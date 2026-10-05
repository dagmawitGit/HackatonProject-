namespace EkubCircle.Api.Entities;

public sealed class Circle
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public Guid OrganizerUserId { get; set; }
    public CircleStatus Status { get; set; } = CircleStatus.Forming;
    public DateTimeOffset CreatedAt { get; set; }
}
