using EkubCircle.Api.DTOs;
using EkubCircle.Api.Entities;
using EkubCircle.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace EkubCircle.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(IServiceProvider services, CancellationToken ct = default)
    {
        var db = services.GetRequiredService<AppDbContext>();
        if (await db.Users.AnyAsync(ct))
            return;

        db.Users.Add(new User
        {
            Id = Guid.NewGuid(),
            FullName = "Platform Admin",
            Email = "admin@ekubcircle.et",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@12345"),
            Role = UserRole.Admin,
            Status = UserStatus.Active,
            CreatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync(ct);

        var auth = services.GetRequiredService<AuthService>();
        var circles = services.GetRequiredService<CircleService>();
        var members = services.GetRequiredService<MemberService>();

        var people = new (string Name, string Email, string Password, UserRole Role)[]
        {
            ("Hana Bekele", "hana@ekubcircle.et", "Organizer@123", UserRole.Organizer),
            ("Abel Tesfaye", "abel@ekubcircle.et", "Member@123", UserRole.Member),
            ("Ruth Alemu", "ruth@ekubcircle.et", "Member@123", UserRole.Member),
            ("Samuel Desta", "samuel@ekubcircle.et", "Member@123", UserRole.Member),
            ("Meron Girma", "meron@ekubcircle.et", "Member@123", UserRole.Member),
            ("Dawit Kebede", "dawit@ekubcircle.et", "Member@123", UserRole.Member)
        };

        Guid organizerId = Guid.Empty;
        foreach (var person in people)
        {
            var created = await auth.RegisterAsync(new RegisterRequest
            {
                FullName = person.Name,
                Email = person.Email,
                Password = person.Password,
                Role = person.Role
            }, ct);

            if (person.Role == UserRole.Organizer)
                organizerId = created.User.Id;
        }

        var circle = await circles.CreateAsync(new CreateCircleRequest
        {
            Name = "Bole Family Equb",
            ContributionAmount = 25000,
            MeetingLabel = "Monthly"
        }, organizerId, ct);

        foreach (var person in people)
        {
            if (person.Role == UserRole.Organizer)
                continue;

            await members.AddAsync(circle.Id, new AddMemberRequest { Email = person.Email }, organizerId, ct);
        }

        await circles.StartAsync(circle.Id, organizerId, ct);
    }
}
