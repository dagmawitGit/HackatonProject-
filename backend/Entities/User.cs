namespace EkubCircle.Api.Entities;

public class User
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public UserStatus Status { get; set; } = UserStatus.Active;
    public DateTime CreatedAt { get; set; }

    public ICollection<Circle> OrganizedCircles { get; set; } = new List<Circle>();
    public ICollection<CircleMember> Memberships { get; set; } = new List<CircleMember>();
}
