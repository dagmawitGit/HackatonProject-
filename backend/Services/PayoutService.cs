using EkubCircle.Api.Authorization;
using EkubCircle.Api.Common;
using EkubCircle.Api.Data;
using EkubCircle.Api.DTOs;
using EkubCircle.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace EkubCircle.Api.Services;

public class PayoutService
{
    private readonly AppDbContext _db;
    private readonly CircleAccess _access;
    private readonly EqubRuleService _rules;
    private readonly AuditService _audit;

    public PayoutService(AppDbContext db, CircleAccess access, EqubRuleService rules, AuditService audit)
    {
        _db = db;
        _access = access;
        _rules = rules;
        _audit = audit;
    }

    public async Task<PayoutResponse> PayOutAsync(Guid roundId, Guid userId, CancellationToken ct)
    {
        var round = await _db.Rounds
            .Include(r => r.Circle)
            .Include(r => r.Payments)
            .FirstOrDefaultAsync(r => r.Id == roundId, ct)
            ?? throw new ApiException(StatusCodes.Status404NotFound, "Round not found.");

        try
        {
            await _access.RequireOrganizerCircleAsync(round.CircleId, userId, ct);
            if (round.Circle.Status != CircleStatus.Active)
                throw new ApiException(StatusCodes.Status409Conflict, "Payout is only available while the equb is active.");

            var members = await _db.CircleMembers
                .Include(m => m.User)
                .Where(m => m.CircleId == round.CircleId)
                .ToListAsync(ct);

            // The receiver always comes from the round row written at Start. The request body cannot choose one.
            var receiver = members.FirstOrDefault(m => m.Id == round.ReceiverMemberId)
                ?? throw new ApiException(StatusCodes.Status409Conflict, "The fixed-order receiver for this round is missing.");

            _rules.EnsureCanPayOut(round, members.Count, round.Payments.Count, receiver);

            var amount = EqubRuleService.Pot(members.Count, round.Circle.ContributionAmount);
            round.Status = RoundStatus.PaidOut;
            round.PaidOutAt = DateTime.UtcNow;
            round.PayoutAmount = amount;
            receiver.HasReceived = true;

            var circleCompleted = members.All(m => m.HasReceived);
            if (circleCompleted)
            {
                round.Circle.Status = CircleStatus.Completed;
                round.Circle.CompletedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync(ct);
            await _audit.LogAsync(userId, "PAYOUT_COMPLETED", "Round", round.Id,
                $"Round {round.RoundNumber} paid out to {receiver.User.FullName} for a recorded pot of {amount:0} ETB.", ct);

            if (circleCompleted)
            {
                await _audit.LogAsync(userId, "CIRCLE_COMPLETED", "Circle", round.CircleId,
                    $"\"{round.Circle.Name}\" is complete. Every member has received exactly once.", ct);
            }

            return new PayoutResponse
            {
                RoundId = round.Id,
                RoundNumber = round.RoundNumber,
                ReceiverMemberId = receiver.Id,
                ReceiverName = receiver.User.FullName,
                Amount = amount,
                Status = "PAID_OUT",
                CircleCompleted = circleCompleted,
                Message = circleCompleted
                    ? $"Round {round.RoundNumber} was paid to {receiver.User.FullName}. The equb is complete."
                    : $"Round {round.RoundNumber} was paid to {receiver.User.FullName}. The receiver still pays in future rounds."
            };
        }
        catch (ApiException ex)
        {
            await _audit.LogAsync(userId, "PAYOUT_ATTEMPTED", "Round", round.Id, ex.Message, ct);
            throw;
        }
    }
}
