namespace EkubCircle.Api.Entities;

public sealed class Round
{
    public Guid Id { get; set; }
    public Guid CircleId { get; set; }
    public int RoundNumber { get; set; }
    public RoundStatus Status { get; set; } = RoundStatus.Open;
    public Guid? ReceiverCircleMemberId { get; set; }
    public DateTimeOffset? PaidOutAt { get; set; }
}
