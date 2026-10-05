namespace EkubCircle.Api.Entities;

public sealed class Payment
{
    public Guid Id { get; set; }
    public Guid RoundId { get; set; }
    public Guid CircleId { get; set; }
    public Guid CircleMemberId { get; set; }
    public decimal Amount { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Paid;
    public DateTimeOffset PaidAt { get; set; }
}
