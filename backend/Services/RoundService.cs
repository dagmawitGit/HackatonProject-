using EkubCircle.Api.Authorization;
using EkubCircle.Api.Common;
using EkubCircle.Api.Data;
using EkubCircle.Api.DTOs;
using EkubCircle.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace EkubCircle.Api.Services;

public class RoundService
{
    private readonly AppDbContext _db;
    private readonly CircleAccess _access;
    private readonly AuditService _audit;

    public RoundService(AppDbContext db, CircleAccess access, AuditService audit)
    {
        _db = db;
        _access = access;
        _audit = audit;
    }

    public async Task<List<RoundResponse>> ListAsync(Guid circleId, Guid userId, CancellationToken ct)
    {
        await _access.RequireReaderAsync(circleId, userId, ct);
        var memberCount = await _db.CircleMembers.CountAsync(m => m.CircleId == circleId, ct);
        var rounds = await _db.Rounds
            .Include(r => r.Receiver).ThenInclude(m => m.User)
            .Include(r => r.Payments)
            .Where(r => r.CircleId == circleId)
            .OrderBy(r => r.RoundNumber)
            .ToListAsync(ct);

        return rounds.Select(r => Map(r, memberCount)).ToList();
    }

    public async Task<RoundResponse?> CurrentAsync(Guid circleId, Guid userId, CancellationToken ct)
    {
        await _access.RequireReaderAsync(circleId, userId, ct);
        var memberCount = await _db.CircleMembers.CountAsync(m => m.CircleId == circleId, ct);
        var round = await _db.Rounds
            .Include(r => r.Receiver).ThenInclude(m => m.User)
            .Include(r => r.Payments)
            .FirstOrDefaultAsync(r => r.CircleId == circleId && r.Status == RoundStatus.Open, ct);

        return round is null ? null : Map(round, memberCount);
    }

    public async Task<RoundResponse> OpenNextAsync(Guid circleId, Guid userId, CancellationToken ct)
    {
        var circle = await _access.RequireOrganizerCircleAsync(circleId, userId, ct);
        if (circle.Status != CircleStatus.Active)
            throw new ApiException(StatusCodes.Status409Conflict, "The next round can only be opened while the equb is active.");

        var rounds = await _db.Rounds.Where(r => r.CircleId == circleId).OrderBy(r => r.RoundNumber).ToListAsync(ct);
        if (rounds.Any(r => r.Status == RoundStatus.Open))
            throw new ApiException(StatusCodes.Status409Conflict, "Pay out the current round before opening the next one.");

        var next = rounds.FirstOrDefault(r => r.Status == RoundStatus.Pending)
            ?? throw new ApiException(StatusCodes.Status400BadRequest, "There is no next round. Every round has already been opened.");

        var previous = rounds.FirstOrDefault(r => r.RoundNumber == next.RoundNumber - 1);
        if (previous is not null && previous.Status != RoundStatus.PaidOut)
            throw new ApiException(StatusCodes.Status409Conflict, "The previous round must be paid out before the next one opens.");

        next.Status = RoundStatus.Open;
        next.OpenedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        await _audit.LogAsync(userId, "ROUND_OPENED", "Round", next.Id, $"Opened round {next.RoundNumber} of \"{circle.Name}\".", ct);

        var memberCount = await _db.CircleMembers.CountAsync(m => m.CircleId == circleId, ct);
        var loaded = await _db.Rounds
            .Include(r => r.Receiver).ThenInclude(m => m.User)
            .Include(r => r.Payments)
            .FirstAsync(r => r.Id == next.Id, ct);
        return Map(loaded, memberCount);
    }

    public static RoundResponse Map(Round round, int memberCount) => new()
    {
        Id = round.Id,
        CircleId = round.CircleId,
        RoundNumber = round.RoundNumber,
        ReceiverMemberId = round.ReceiverMemberId,
        ReceiverName = round.Receiver.User.FullName,
        Status = StatusNames.Round(round.Status),
        OpenedAt = round.OpenedAt,
        PaidOutAt = round.PaidOutAt,
        PayoutAmount = round.PayoutAmount,
        PaidCount = round.Payments.Count,
        MemberCount = memberCount
    };
}
