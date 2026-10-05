using EkubCircle.Api.Authorization;
using EkubCircle.Api.Data;
using EkubCircle.Api.DTOs;
using EkubCircle.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace EkubCircle.Api.Services;

public class PaymentService
{
    private readonly AppDbContext _db;
    private readonly CircleAccess _access;
    private readonly EqubRuleService _rules;
    private readonly AuditService _audit;

    public PaymentService(AppDbContext db, CircleAccess access, EqubRuleService rules, AuditService audit)
    {
        _db = db;
        _access = access;
        _rules = rules;
        _audit = audit;
    }

    public async Task<PaymentResponse> RecordAsync(Guid roundId, RecordPaymentRequest request, Guid userId, CancellationToken ct)
    {
        var round = await _db.Rounds.Include(r => r.Circle).FirstOrDefaultAsync(r => r.Id == roundId, ct)
            ?? throw new Common.ApiException(StatusCodes.Status404NotFound, "Round not found.");

        await _access.RequireOrganizerCircleAsync(round.CircleId, userId, ct);
        if (round.Circle.Status != CircleStatus.Active)
            throw new Common.ApiException(StatusCodes.Status409Conflict, "Payments can only be recorded while the equb is active.");

        var member = await _db.CircleMembers.Include(m => m.User)
            .FirstOrDefaultAsync(m => m.Id == request.CircleMemberId, ct)
            ?? throw new Common.ApiException(StatusCodes.Status404NotFound, "Member not found.");

        var alreadyPaid = await _db.Payments.AnyAsync(p => p.RoundId == roundId && p.CircleMemberId == member.Id, ct);
        _rules.EnsureCanRecordPayment(round, member, alreadyPaid);

        var payment = new Payment
        {
            Id = Guid.NewGuid(),
            RoundId = round.Id,
            CircleMemberId = member.Id,
            Amount = round.Circle.ContributionAmount,
            Status = PaymentStatus.Recorded,
            RecordedAt = DateTime.UtcNow,
            RecordedBy = userId
        };

        _db.Payments.Add(payment);
        await _db.SaveChangesAsync(ct);
        await _audit.LogAsync(userId, "PAYMENT_RECORDED", "Payment", payment.Id,
            $"Recorded {payment.Amount:0} ETB from {member.User.FullName} for round {round.RoundNumber}. This is a ledger entry, not a money transfer.", ct);

        return await MapOneAsync(payment.Id, ct);
    }

    public async Task<List<PaymentResponse>> ListForRoundAsync(Guid roundId, Guid userId, CancellationToken ct)
    {
        var round = await _db.Rounds.FirstOrDefaultAsync(r => r.Id == roundId, ct)
            ?? throw new Common.ApiException(StatusCodes.Status404NotFound, "Round not found.");

        await _access.RequireReaderAsync(round.CircleId, userId, ct);
        var payments = await Query().Where(p => p.RoundId == roundId).OrderBy(p => p.CircleMember.PayoutOrder).ToListAsync(ct);
        var names = await RecorderNamesAsync(payments, ct);
        return payments.Select(p => Map(p, names)).ToList();
    }

    public async Task<List<PaymentResponse>> ListForCircleAsync(Guid circleId, Guid userId, CancellationToken ct)
    {
        await _access.RequireReaderAsync(circleId, userId, ct);
        var payments = await Query()
            .Where(p => p.Round.CircleId == circleId)
            .OrderBy(p => p.Round.RoundNumber)
            .ThenBy(p => p.CircleMember.PayoutOrder)
            .ToListAsync(ct);
        var names = await RecorderNamesAsync(payments, ct);
        return payments.Select(p => Map(p, names)).ToList();
    }

    private IQueryable<Payment> Query() => _db.Payments
        .Include(p => p.Round)
        .Include(p => p.CircleMember).ThenInclude(m => m.User);

    private async Task<Dictionary<Guid, string>> RecorderNamesAsync(List<Payment> payments, CancellationToken ct)
    {
        var ids = payments.Select(p => p.RecordedBy).Distinct().ToList();
        return await _db.Users.Where(u => ids.Contains(u.Id)).ToDictionaryAsync(u => u.Id, u => u.FullName, ct);
    }

    private async Task<PaymentResponse> MapOneAsync(Guid paymentId, CancellationToken ct)
    {
        var payment = await Query().FirstAsync(p => p.Id == paymentId, ct);
        var names = await RecorderNamesAsync(new List<Payment> { payment }, ct);
        return Map(payment, names);
    }

    private static PaymentResponse Map(Payment payment, Dictionary<Guid, string> recorders) => new()
    {
        Id = payment.Id,
        RoundId = payment.RoundId,
        RoundNumber = payment.Round.RoundNumber,
        CircleMemberId = payment.CircleMemberId,
        MemberName = payment.CircleMember.User.FullName,
        PayoutOrder = payment.CircleMember.PayoutOrder,
        HasReceived = payment.CircleMember.HasReceived,
        Amount = payment.Amount,
        Status = "RECORDED",
        RecordedAt = payment.RecordedAt,
        RecordedByName = recorders.TryGetValue(payment.RecordedBy, out var name) ? name : "Organizer"
    };
}
