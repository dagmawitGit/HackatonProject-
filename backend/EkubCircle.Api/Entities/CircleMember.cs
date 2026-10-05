namespace EkubCircle.Api.Entities;

public sealed class CircleMember
{
    public Guid Id { get; set; }
    public Guid CircleId { get; set; }
    public Guid UserId { get; set; }
    public int? PayoutOrder { get; set; }
    public DateTimeOffset JoinedAt { get; set; }
}
