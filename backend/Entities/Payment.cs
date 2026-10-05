namespace EkubCircle.Api.Entities;

public class Payment
{
    public Guid Id { get; set; }
    public Guid RoundId { get; set; }
    public Guid CircleMemberId { get; set; }
    public decimal Amount { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Recorded;
    public DateTime RecordedAt { get; set; }
    public Guid RecordedBy { get; set; }

    public Round Round { get; set; } = null!;
    public CircleMember CircleMember { get; set; } = null!;
}
