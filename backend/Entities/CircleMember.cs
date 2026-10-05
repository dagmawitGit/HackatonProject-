namespace EkubCircle.Api.Entities;

public class CircleMember
{
    public Guid Id { get; set; }
    public Guid CircleId { get; set; }
    public Guid UserId { get; set; }
    public int PayoutOrder { get; set; }
    public bool HasReceived { get; set; }
    public DateTime JoinedAt { get; set; }

    public Circle Circle { get; set; } = null!;
    public User User { get; set; } = null!;
    public ICollection<Round> RoundsToReceive { get; set; } = new List<Round>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}
