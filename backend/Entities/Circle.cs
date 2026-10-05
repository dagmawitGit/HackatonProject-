namespace EkubCircle.Api.Entities;

public class Circle
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal ContributionAmount { get; set; }
    public string MeetingLabel { get; set; } = string.Empty;
    public CircleStatus Status { get; set; } = CircleStatus.Forming;
    public bool IsSuspended { get; set; }
    public Guid OrganizerId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }

    public User Organizer { get; set; } = null!;
    public ICollection<CircleMember> Members { get; set; } = new List<CircleMember>();
    public ICollection<Round> Rounds { get; set; } = new List<Round>();
}
