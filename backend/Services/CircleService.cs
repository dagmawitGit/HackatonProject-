using EkubCircle.Api.Authorization;
using EkubCircle.Api.Common;
using EkubCircle.Api.Data;
using EkubCircle.Api.DTOs;
using EkubCircle.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace EkubCircle.Api.Services;

public class CircleService
{
    private readonly AppDbContext _db;
    private readonly CircleAccess _access;
    private readonly EqubRuleService _rules;
    private readonly AuditService _audit;

    public CircleService(AppDbContext db, CircleAccess access, EqubRuleService rules, AuditService audit)
    {
        _db = db;
        _access = access;
        _rules = rules;
        _audit = audit;
    }

    public async Task<CircleResponse> CreateAsync(CreateCircleRequest request, Guid userId, CancellationToken ct)
    {
        var user = await _access.RequireActiveUserAsync(userId, ct);
        if (user.Role != UserRole.Organizer)
            throw new ApiException(StatusCodes.Status403Forbidden, "Only an organizer can create an equb.");

        _rules.EnsureText(request.Name, "Circle name");
        _rules.EnsureText(request.MeetingLabel, "Meeting label");
        _rules.EnsureContribution(request.ContributionAmount);

        var circle = new Circle
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            ContributionAmount = request.ContributionAmount,
            MeetingLabel = request.MeetingLabel.Trim(),
            Status = CircleStatus.Forming,
            OrganizerId = userId,
            CreatedAt = DateTime.UtcNow
        };

        _db.Circles.Add(circle);
        _db.CircleMembers.Add(new CircleMember
        {
            Id = Guid.NewGuid(),
            CircleId = circle.Id,
            UserId = userId,
            PayoutOrder = 1,
            HasReceived = false,
            JoinedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync(ct);
        await _audit.LogAsync(userId, "CIRCLE_CREATED", "Circle", circle.Id, $"Created equb \"{circle.Name}\".", ct);
        return await MapAsync(circle.Id, ct);
    }

    public async Task<List<CircleResponse>> ListMineAsync(Guid userId, CancellationToken ct)
    {
        await _access.RequireActiveUserAsync(userId, ct);
        var ids = await _db.Circles
            .Where(c => c.OrganizerId == userId || c.Members.Any(m => m.UserId == userId))
            .Select(c => c.Id)
            .ToListAsync(ct);

        var result = new List<CircleResponse>();
        foreach (var id in ids)
            result.Add(await MapAsync(id, ct));

        return result.OrderByDescending(c => c.CreatedAt).ToList();
    }

    public async Task<CircleResponse> GetAsync(Guid circleId, Guid userId, CancellationToken ct)
    {
        await _access.RequireReaderAsync(circleId, userId, ct);
        return await MapAsync(circleId, ct);
    }

    public async Task<CircleResponse> UpdateAsync(Guid circleId, UpdateCircleRequest request, Guid userId, CancellationToken ct)
    {
        var circle = await _access.RequireOrganizerCircleAsync(circleId, userId, ct);
        _rules.EnsureFormingMutation(circle, "Equb settings");
        _rules.EnsureText(request.Name, "Circle name");
        _rules.EnsureText(request.MeetingLabel, "Meeting label");
        _rules.EnsureContribution(request.ContributionAmount);

        circle.Name = request.Name.Trim();
        circle.MeetingLabel = request.MeetingLabel.Trim();
        circle.ContributionAmount = request.ContributionAmount;
        await _db.SaveChangesAsync(ct);
        await _audit.LogAsync(userId, "CIRCLE_UPDATED", "Circle", circle.Id, $"Updated equb \"{circle.Name}\".", ct);
        return await MapAsync(circle.Id, ct);
    }

    public async Task<CircleResponse> StartAsync(Guid circleId, Guid userId, CancellationToken ct)
    {
        var circle = await _access.RequireOrganizerCircleAsync(circleId, userId, ct);
        var members = await _db.CircleMembers
            .Where(m => m.CircleId == circleId)
            .OrderBy(m => m.PayoutOrder)
            .ToListAsync(ct);

        _rules.EnsureCanStart(circle, members);

        var now = DateTime.UtcNow;
        foreach (var member in members)
        {
            _db.Rounds.Add(new Round
            {
                Id = Guid.NewGuid(),
                CircleId = circle.Id,
                RoundNumber = member.PayoutOrder,
                ReceiverMemberId = member.Id,
                Status = member.PayoutOrder == 1 ? RoundStatus.Open : RoundStatus.Pending,
                OpenedAt = member.PayoutOrder == 1 ? now : null
            });
        }

        circle.Status = CircleStatus.Active;
        circle.StartedAt = now;
        await _db.SaveChangesAsync(ct);
        await _audit.LogAsync(userId, "CIRCLE_STARTED", "Circle", circle.Id,
            $"Started \"{circle.Name}\" with {members.Count} locked members and a fixed payout order.", ct);
        await _audit.LogAsync(userId, "ROUND_OPENED", "Round", circle.Id, "Opened round 1.", ct);
        return await MapAsync(circle.Id, ct);
    }

    public async Task<CircleResponse> CompleteAsync(Guid circleId, Guid userId, CancellationToken ct)
    {
        var circle = await _access.RequireOrganizerCircleAsync(circleId, userId, ct);
        if (circle.Status == CircleStatus.Completed)
            return await MapAsync(circle.Id, ct);

        if (circle.Status != CircleStatus.Active)
            throw new ApiException(StatusCodes.Status409Conflict, "Only an active equb can be completed.");

        var members = await _db.CircleMembers.Where(m => m.CircleId == circleId).ToListAsync(ct);
        var rounds = await _db.Rounds.Where(r => r.CircleId == circleId).ToListAsync(ct);
        if (members.Count == 0 || members.Any(m => !m.HasReceived) || rounds.Any(r => r.Status != RoundStatus.PaidOut))
            throw new ApiException(StatusCodes.Status409Conflict, "The equb completes only after every member has received exactly once.");

        circle.Status = CircleStatus.Completed;
        circle.CompletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        await _audit.LogAsync(userId, "CIRCLE_COMPLETED", "Circle", circle.Id, $"Completed equb \"{circle.Name}\".", ct);
        return await MapAsync(circle.Id, ct);
    }

    public async Task<CircleSummaryResponse> SummaryAsync(Guid circleId, Guid userId, CancellationToken ct)
    {
        await _access.RequireReaderAsync(circleId, userId, ct);
        var circle = await _db.Circles.FirstAsync(c => c.Id == circleId, ct);
        var members = await _db.CircleMembers
            .Include(m => m.User)
            .Where(m => m.CircleId == circleId)
            .OrderBy(m => m.PayoutOrder)
            .ToListAsync(ct);
        var rounds = await _db.Rounds
            .Include(r => r.Receiver).ThenInclude(m => m.User)
            .Include(r => r.Payments)
            .Where(r => r.CircleId == circleId)
            .OrderBy(r => r.RoundNumber)
            .ToListAsync(ct);

        var open = rounds.FirstOrDefault(r => r.Status == RoundStatus.Open);
        var paidCount = open?.Payments.Count ?? 0;
        var currentPot = open?.Payments.Sum(p => p.Amount) ?? 0m;
        var memberCount = members.Count;
        var receivedCount = members.Count(m => m.HasReceived);
        var waiting = new List<string>();
        if (open is not null)
        {
            var paidIds = open.Payments.Select(p => p.CircleMemberId).ToHashSet();
            waiting = members.Where(m => !paidIds.Contains(m.Id)).Select(m => m.User.FullName).ToList();
        }

        var paidOutRounds = rounds.Where(r => r.Status == RoundStatus.PaidOut).ToList();
        var paymentRecordsComplete = paidOutRounds.All(r => r.Payments.Count == memberCount
                && r.Payments.Select(p => p.CircleMemberId).Distinct().Count() == memberCount
                && r.Payments.All(p => p.Amount == circle.ContributionAmount))
            && (open is null || open.Payments.Select(p => p.CircleMemberId).Distinct().Count() == open.Payments.Count);

        return new CircleSummaryResponse
        {
            MemberCount = memberCount,
            ContributionAmount = circle.ContributionAmount,
            PaidCount = paidCount,
            CurrentPot = currentPot,
            ExpectedPot = EqubRuleService.Pot(memberCount, circle.ContributionAmount),
            CurrentRound = open?.RoundNumber,
            TotalRounds = rounds.Count > 0 ? rounds.Count : memberCount,
            ReceivedCount = receivedCount,
            RemainingReceivers = memberCount - receivedCount,
            PaymentPercentage = open is null ? 0 : EqubRuleService.Percentage(paidCount, memberCount),
            CompletionPercentage = EqubRuleService.Percentage(receivedCount, memberCount),
            CurrentReceiver = open?.Receiver.User.FullName,
            CurrentReceiverMemberId = open?.ReceiverMemberId,
            CircleStatus = StatusNames.Circle(circle.Status),
            RoundStatus = open is null ? null : StatusNames.Round(open.Status),
            PayoutReady = open is not null && memberCount > 0
                && members.All(member => open.Payments.Any(payment => payment.CircleMemberId == member.Id))
                && !open.Receiver.HasReceived,
            IsSuspended = circle.IsSuspended,
            WaitingFor = waiting,
            NextReceivers = members
                .Where(m => !m.HasReceived && (open is null || m.Id != open.ReceiverMemberId))
                .OrderBy(m => m.PayoutOrder)
                .Select(m => m.User.FullName)
                .ToList(),
            Integrity = new IntegrityResponse
            {
                AllMembersVerified = members.All(m => m.User.Status == UserStatus.Active),
                PaymentRecordsComplete = paymentRecordsComplete,
                ReceiverFromFixedOrder = rounds.All(r => r.Receiver.PayoutOrder == r.RoundNumber),
                NoDuplicatePayout = paidOutRounds.Count == members.Count(m => m.HasReceived)
                    && paidOutRounds.Select(r => r.ReceiverMemberId).Distinct().Count() == paidOutRounds.Count,
                CurrentRoundValid = rounds.Count(r => r.Status == RoundStatus.Open) <= 1
            }
        };
    }

    private async Task<CircleResponse> MapAsync(Guid circleId, CancellationToken ct)
    {
        var circle = await _db.Circles.Include(c => c.Organizer).FirstAsync(c => c.Id == circleId, ct);
        var memberCount = await _db.CircleMembers.CountAsync(m => m.CircleId == circleId, ct);
        return new CircleResponse
        {
            Id = circle.Id,
            Name = circle.Name,
            ContributionAmount = circle.ContributionAmount,
            MeetingLabel = circle.MeetingLabel,
            Status = StatusNames.Circle(circle.Status),
            IsSuspended = circle.IsSuspended,
            OrganizerId = circle.OrganizerId,
            OrganizerName = circle.Organizer.FullName,
            MemberCount = memberCount,
            CreatedAt = circle.CreatedAt,
            StartedAt = circle.StartedAt,
            CompletedAt = circle.CompletedAt
        };
    }
}
