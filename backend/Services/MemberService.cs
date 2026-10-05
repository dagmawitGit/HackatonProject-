using EkubCircle.Api.Authorization;
using EkubCircle.Api.Common;
using EkubCircle.Api.Data;
using EkubCircle.Api.DTOs;
using EkubCircle.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace EkubCircle.Api.Services;

public class MemberService
{
    private readonly AppDbContext _db;
    private readonly CircleAccess _access;
    private readonly EqubRuleService _rules;
    private readonly AuditService _audit;

    public MemberService(AppDbContext db, CircleAccess access, EqubRuleService rules, AuditService audit)
    {
        _db = db;
        _access = access;
        _rules = rules;
        _audit = audit;
    }

    public async Task<MemberResponse> AddAsync(Guid circleId, AddMemberRequest request, Guid userId, CancellationToken ct)
    {
        var circle = await _access.RequireOrganizerCircleAsync(circleId, userId, ct);
        _rules.EnsureFormingMutation(circle, "Adding members");

        var email = AuthService.NormalizeEmail(request.Email);
        var person = await _db.Users.FirstOrDefaultAsync(u => u.Email == email, ct)
            ?? throw new ApiException(StatusCodes.Status404NotFound, "No registered user has that email. Ask them to register first.");

        if (person.Status == UserStatus.Suspended)
            throw new ApiException(StatusCodes.Status409Conflict, "That account is suspended and cannot join an equb.");

        if (await _db.CircleMembers.AnyAsync(m => m.CircleId == circleId && m.UserId == person.Id, ct))
            throw new ApiException(StatusCodes.Status409Conflict, "That person is already a member of this equb.");

        var nextOrder = await _db.CircleMembers.Where(m => m.CircleId == circleId).Select(m => (int?)m.PayoutOrder).MaxAsync(ct) ?? 0;
        var member = new CircleMember
        {
            Id = Guid.NewGuid(),
            CircleId = circleId,
            UserId = person.Id,
            PayoutOrder = nextOrder + 1,
            HasReceived = false,
            JoinedAt = DateTime.UtcNow
        };

        _db.CircleMembers.Add(member);
        await _db.SaveChangesAsync(ct);
        await _audit.LogAsync(userId, "MEMBER_ADDED", "CircleMember", member.Id, $"{person.FullName} joined \"{circle.Name}\" at payout position {member.PayoutOrder}.", ct);
        return await MapOneAsync(member.Id, ct);
    }

    public async Task<List<MemberResponse>> ListAsync(Guid circleId, Guid userId, CancellationToken ct)
    {
        await _access.RequireReaderAsync(circleId, userId, ct);
        var openRoundId = await _db.Rounds
            .Where(r => r.CircleId == circleId && r.Status == RoundStatus.Open)
            .Select(r => (Guid?)r.Id)
            .FirstOrDefaultAsync(ct);

        var paidIds = openRoundId is null
            ? new HashSet<Guid>()
            : (await _db.Payments.Where(p => p.RoundId == openRoundId).Select(p => p.CircleMemberId).ToListAsync(ct)).ToHashSet();

        var members = await _db.CircleMembers
            .Include(m => m.User)
            .Where(m => m.CircleId == circleId)
            .OrderBy(m => m.PayoutOrder)
            .ToListAsync(ct);

        return members.Select(m => Map(m, paidIds.Contains(m.Id))).ToList();
    }

    public async Task RemoveAsync(Guid circleId, Guid memberId, Guid userId, CancellationToken ct)
    {
        var circle = await _access.RequireOrganizerCircleAsync(circleId, userId, ct);
        _rules.EnsureFormingMutation(circle, "Removing members");

        var member = await _db.CircleMembers.Include(m => m.User)
            .FirstOrDefaultAsync(m => m.Id == memberId && m.CircleId == circleId, ct)
            ?? throw new ApiException(StatusCodes.Status404NotFound, "Member not found in this equb.");

        if (member.UserId == circle.OrganizerId)
            throw new ApiException(StatusCodes.Status400BadRequest, "The organizer must remain a member of the equb.");

        var name = member.User.FullName;
        _db.CircleMembers.Remove(member);
        await _db.SaveChangesAsync(ct);

        var remaining = await _db.CircleMembers
            .Where(m => m.CircleId == circleId)
            .OrderBy(m => m.PayoutOrder)
            .ToListAsync(ct);
        foreach (var item in remaining)
            item.PayoutOrder = -item.PayoutOrder;
        await _db.SaveChangesAsync(ct);
        for (var i = 0; i < remaining.Count; i++)
            remaining[i].PayoutOrder = i + 1;
        await _db.SaveChangesAsync(ct);
        await _audit.LogAsync(userId, "MEMBER_REMOVED", "CircleMember", memberId, $"{name} was removed from \"{circle.Name}\" while it was still forming.", ct);
    }

    public async Task<List<MemberResponse>> ReorderAsync(Guid circleId, ReorderMembersRequest request, Guid userId, CancellationToken ct)
    {
        var circle = await _access.RequireOrganizerCircleAsync(circleId, userId, ct);
        _rules.EnsureFormingMutation(circle, "Payout order");

        var members = await _db.CircleMembers.Where(m => m.CircleId == circleId).ToListAsync(ct);
        var requested = request.OrderedMemberIds.Distinct().ToList();
        if (requested.Count != members.Count || members.Select(m => m.Id).Except(requested).Any())
            throw new ApiException(StatusCodes.Status400BadRequest, "The payout order must include every member exactly once.");

        // Two-phase update so the unique (CircleId, PayoutOrder) index never collides mid-save.
        foreach (var member in members)
            member.PayoutOrder = -member.PayoutOrder - 1;
        await _db.SaveChangesAsync(ct);

        for (var i = 0; i < requested.Count; i++)
        {
            var member = members.First(m => m.Id == requested[i]);
            member.PayoutOrder = i + 1;
        }

        await _db.SaveChangesAsync(ct);
        await _audit.LogAsync(userId, "PAYOUT_ORDER_SET", "Circle", circleId, $"Payout order updated for \"{circle.Name}\".", ct);
        return await ListAsync(circleId, userId, ct);
    }

    private async Task<MemberResponse> MapOneAsync(Guid memberId, CancellationToken ct)
    {
        var member = await _db.CircleMembers.Include(m => m.User).FirstAsync(m => m.Id == memberId, ct);
        return Map(member, false);
    }

    private static MemberResponse Map(CircleMember member, bool paidCurrentRound) => new()
    {
        Id = member.Id,
        UserId = member.UserId,
        FullName = member.User.FullName,
        Email = member.User.Email,
        PayoutOrder = member.PayoutOrder,
        HasReceived = member.HasReceived,
        UserStatus = StatusNames.User(member.User.Status),
        JoinedAt = member.JoinedAt,
        PaidCurrentRound = paidCurrentRound
    };
}
