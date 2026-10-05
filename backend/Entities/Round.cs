namespace EkubCircle.Api.Entities;

public class Round
{
    public Guid Id { get; set; }
    public Guid CircleId { get; set; }
    public int RoundNumber { get; set; }
    public Guid ReceiverMemberId { get; set; }
    public RoundStatus Status { get; set; } = RoundStatus.Pending;
    public DateTime? OpenedAt { get; set; }
    public DateTime? PaidOutAt { get; set; }
    public decimal? PayoutAmount { get; set; }

    public Circle Circle { get; set; } = null!;
    public CircleMember Receiver { get; set; } = null!;
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}
