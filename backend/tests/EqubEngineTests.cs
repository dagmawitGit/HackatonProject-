using EkubCircle.Api.Authentication;
using EkubCircle.Api.Authorization;
using EkubCircle.Api.Common;
using EkubCircle.Api.Data;
using EkubCircle.Api.DTOs;
using EkubCircle.Api.Entities;
using EkubCircle.Api.Services;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace EkubCircle.Tests;

public class EqubEngineTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly AppDbContext _db;
    private readonly AuthService _auth;
    private readonly CircleService _circles;
    private readonly MemberService _members;
    private readonly RoundService _rounds;
    private readonly PaymentService _payments;
    private readonly PayoutService _payouts;
    private readonly AdminService _admin;

    public EqubEngineTests()
    {
        _connection = new SqliteConnection("Data Source=:memory:");
        _connection.Open();
        var options = new DbContextOptionsBuilder<AppDbContext>().UseSqlite(_connection).Options;
        _db = new AppDbContext(options);
        _db.Database.EnsureCreated();

        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Jwt:Key"] = "equb-test-signing-key-must-be-32b!!",
            ["Jwt:Issuer"] = "EkubCircle",
            ["Jwt:Audience"] = "EkubCircle"
        }).Build();

        var audit = new AuditService(_db);
        var rules = new EqubRuleService();
        var access = new CircleAccess(_db);
        _auth = new AuthService(_db, new JwtTokenService(config), audit);
        _circles = new CircleService(_db, access, rules, audit);
        _members = new MemberService(_db, access, rules, audit);
        _rounds = new RoundService(_db, access, audit);
        _payments = new PaymentService(_db, access, rules, audit);
        _payouts = new PayoutService(_db, access, rules, audit);
        _admin = new AdminService(_db, audit);
    }

    [Fact]
    public async Task User_can_register_and_login()
    {
        var registered = await _auth.RegisterAsync(new RegisterRequest
        {
            FullName = "Ruth Alemu",
            Email = "ruth@test.et",
            Password = "Member@123",
            Role = UserRole.Member
        }, CancellationToken.None);

        Assert.Equal("Member", registered.User.Role);
        Assert.False(string.IsNullOrWhiteSpace(registered.Token));

        var loggedIn = await _auth.LoginAsync(new LoginRequest
        {
            Email = "ruth@test.et",
            Password = "Member@123"
        }, CancellationToken.None);

        Assert.Equal(registered.User.Id, loggedIn.User.Id);

        var duplicate = await Assert.ThrowsAsync<ApiException>(() => _auth.RegisterAsync(new RegisterRequest
        {
            FullName = "Ruth Alemu",
            Email = "ruth@test.et",
            Password = "Member@123"
        }, CancellationToken.None));
        Assert.Equal(409, duplicate.StatusCode);
    }

    [Fact]
    public async Task Organizer_can_create_add_members_and_start_with_fixed_order()
    {
        var circle = await StartUnityAsync();
        var started = await _circles.GetAsync(circle.CircleId, circle.OrganizerId, CancellationToken.None);
        Assert.Equal("ACTIVE", started.Status);
        Assert.Equal(25000, started.ContributionAmount);
        Assert.Equal(6, started.MemberCount);

        var rounds = await _rounds.ListAsync(circle.CircleId, circle.OrganizerId, CancellationToken.None);
        Assert.Equal(6, rounds.Count);
        Assert.Equal(new[] { "Hana Bekele", "Abel Tesfaye", "Ruth Alemu", "Samuel Desta", "Meron Girma", "Dawit Kebede" },
            rounds.Select(r => r.ReceiverName).ToArray());
        Assert.Equal("OPEN", rounds[0].Status);
        Assert.All(rounds.Skip(1), r => Assert.Equal("PENDING", r.Status));
    }

    [Fact]
    public async Task Starting_locks_members_contribution_and_duplicate_member()
    {
        var circle = await StartUnityAsync();

        var add = await Assert.ThrowsAsync<ApiException>(() => _members.AddAsync(
            circle.CircleId, new AddMemberRequest { Email = "new@test.et" }, circle.OrganizerId, CancellationToken.None));
        Assert.Equal(409, add.StatusCode);

        var update = await Assert.ThrowsAsync<ApiException>(() => _circles.UpdateAsync(circle.CircleId, new UpdateCircleRequest
        {
            Name = "Changed",
            ContributionAmount = 1000,
            MeetingLabel = "Weekly"
        }, circle.OrganizerId, CancellationToken.None));
        Assert.Equal(409, update.StatusCode);

        var again = await Assert.ThrowsAsync<ApiException>(() => _circles.StartAsync(circle.CircleId, circle.OrganizerId, CancellationToken.None));
        Assert.Equal(409, again.StatusCode);
    }

    [Fact]
    public async Task Duplicate_member_is_rejected_while_forming()
    {
        var organizer = await RegisterAsync("Hana Bekele", "hana@test.et", UserRole.Organizer);
        var abel = await RegisterAsync("Abel Tesfaye", "abel@test.et", UserRole.Member);
        var circle = await _circles.CreateAsync(new CreateCircleRequest
        {
            Name = "Unity Equb",
            ContributionAmount = 25000,
            MeetingLabel = "Monthly"
        }, organizer.Id, CancellationToken.None);

        await _members.AddAsync(circle.Id, new AddMemberRequest { Email = abel.Email }, organizer.Id, CancellationToken.None);
        var duplicate = await Assert.ThrowsAsync<ApiException>(() =>
            _members.AddAsync(circle.Id, new AddMemberRequest { Email = abel.Email }, organizer.Id, CancellationToken.None));
        Assert.Equal(409, duplicate.StatusCode);

        await _members.RemoveAsync(circle.Id, (await _members.ListAsync(circle.Id, organizer.Id, CancellationToken.None))[0].Id, organizer.Id, CancellationToken.None);
        var after = await _members.ListAsync(circle.Id, organizer.Id, CancellationToken.None);
        Assert.Empty(after);
    }

    [Fact]
    public async Task Payout_is_blocked_until_everyone_pays_then_server_chooses_receiver()
    {
        var circle = await StartUnityAsync();
        var round = await _rounds.CurrentAsync(circle.CircleId, circle.OrganizerId, CancellationToken.None);
        Assert.NotNull(round);

        foreach (var member in circle.Roster.Take(5))
        {
            await _payments.RecordAsync(round!.Id, new RecordPaymentRequest { CircleMemberId = member.Id }, circle.OrganizerId, CancellationToken.None);
        }

        var locked = await _circles.SummaryAsync(circle.CircleId, circle.OrganizerId, CancellationToken.None);
        Assert.Equal(5, locked.PaidCount);
        Assert.Equal(125000, locked.CurrentPot);
        Assert.Equal(150000, locked.ExpectedPot);
        Assert.False(locked.PayoutReady);
        Assert.Equal("Dawit Kebede", Assert.Single(locked.WaitingFor));

        var blocked = await Assert.ThrowsAsync<ApiException>(() => _payouts.PayOutAsync(round!.Id, circle.OrganizerId, CancellationToken.None));
        Assert.Equal(409, blocked.StatusCode);
        Assert.Contains("locked", blocked.Message, StringComparison.OrdinalIgnoreCase);

        await _payments.RecordAsync(round!.Id, new RecordPaymentRequest { CircleMemberId = circle.Roster[5].Id }, circle.OrganizerId, CancellationToken.None);
        var duplicate = await Assert.ThrowsAsync<ApiException>(() =>
            _payments.RecordAsync(round.Id, new RecordPaymentRequest { CircleMemberId = circle.Roster[5].Id }, circle.OrganizerId, CancellationToken.None));
        Assert.Equal(409, duplicate.StatusCode);

        var ready = await _circles.SummaryAsync(circle.CircleId, circle.OrganizerId, CancellationToken.None);
        Assert.Equal(6, ready.PaidCount);
        Assert.Equal(150000, ready.CurrentPot);
        Assert.Equal(100, ready.PaymentPercentage);
        Assert.Equal("Hana Bekele", ready.CurrentReceiver);
        Assert.True(ready.PayoutReady);

        var payout = await _payouts.PayOutAsync(round.Id, circle.OrganizerId, CancellationToken.None);
        Assert.Equal("Hana Bekele", payout.ReceiverName);
        Assert.Equal(150000, payout.Amount);
        Assert.Equal("PAID_OUT", payout.Status);
        Assert.Equal(circle.Roster[0].Id, payout.ReceiverMemberId);

        var again = await Assert.ThrowsAsync<ApiException>(() => _payouts.PayOutAsync(round.Id, circle.OrganizerId, CancellationToken.None));
        Assert.Equal(409, again.StatusCode);
    }

    [Fact]
    public async Task Previous_receiver_still_pays_and_cannot_receive_again()
    {
        var circle = await StartUnityAsync();
        var first = await _rounds.CurrentAsync(circle.CircleId, circle.OrganizerId, CancellationToken.None);
        await PayEveryoneAsync(first!.Id, circle);
        await _payouts.PayOutAsync(first.Id, circle.OrganizerId, CancellationToken.None);

        var second = await _rounds.OpenNextAsync(circle.CircleId, circle.OrganizerId, CancellationToken.None);
        Assert.Equal(2, second.RoundNumber);
        Assert.Equal("Abel Tesfaye", second.ReceiverName);
        Assert.Equal("OPEN", second.Status);

        var hanaPayment = await _payments.RecordAsync(second.Id, new RecordPaymentRequest { CircleMemberId = circle.Roster[0].Id }, circle.OrganizerId, CancellationToken.None);
        Assert.True(hanaPayment.HasReceived);
        Assert.Equal("Hana Bekele", hanaPayment.MemberName);

        var summary = await _circles.SummaryAsync(circle.CircleId, circle.OrganizerId, CancellationToken.None);
        Assert.DoesNotContain("Hana Bekele", summary.WaitingFor);
        Assert.Contains("Abel Tesfaye", summary.WaitingFor);

        var early = await Assert.ThrowsAsync<ApiException>(() => _payouts.PayOutAsync(second.Id, circle.OrganizerId, CancellationToken.None));
        Assert.Equal(409, early.StatusCode);

        var future = await _rounds.ListAsync(circle.CircleId, circle.OrganizerId, CancellationToken.None);
        var roundThree = future.Single(r => r.RoundNumber == 3);
        var skipped = await Assert.ThrowsAsync<ApiException>(() => _payouts.PayOutAsync(roundThree.Id, circle.OrganizerId, CancellationToken.None));
        Assert.Equal(400, skipped.StatusCode);
    }

    [Fact]
    public async Task Equb_completes_after_every_member_receives_once()
    {
        var organizer = await RegisterAsync("Hana Bekele", "hana@test.et", UserRole.Organizer);
        var abel = await RegisterAsync("Abel Tesfaye", "abel@test.et", UserRole.Member);
        var circle = await _circles.CreateAsync(new CreateCircleRequest
        {
            Name = "Short Equb",
            ContributionAmount = 1000,
            MeetingLabel = "Weekly"
        }, organizer.Id, CancellationToken.None);

        await _members.AddAsync(circle.Id, new AddMemberRequest { Email = organizer.Email }, organizer.Id, CancellationToken.None);
        await _members.AddAsync(circle.Id, new AddMemberRequest { Email = abel.Email }, organizer.Id, CancellationToken.None);
        await _circles.StartAsync(circle.Id, organizer.Id, CancellationToken.None);

        var roster = await _members.ListAsync(circle.Id, organizer.Id, CancellationToken.None);
        for (var roundNumber = 1; roundNumber <= 2; roundNumber++)
        {
            var round = await _rounds.CurrentAsync(circle.Id, organizer.Id, CancellationToken.None);
            await PayEveryoneAsync(round!.Id, new StartedCircle(circle.Id, organizer.Id, roster));
            var payout = await _payouts.PayOutAsync(round.Id, organizer.Id, CancellationToken.None);
            Assert.Equal(roster[roundNumber - 1].FullName, payout.ReceiverName);
            if (roundNumber == 1)
                await _rounds.OpenNextAsync(circle.Id, organizer.Id, CancellationToken.None);
        }

        var done = await _circles.GetAsync(circle.Id, organizer.Id, CancellationToken.None);
        Assert.Equal("COMPLETED", done.Status);
        var summary = await _circles.SummaryAsync(circle.Id, organizer.Id, CancellationToken.None);
        Assert.Equal(100, summary.CompletionPercentage);
        Assert.Equal(0, summary.RemainingReceivers);

        var noNext = await Assert.ThrowsAsync<ApiException>(() => _rounds.OpenNextAsync(circle.Id, organizer.Id, CancellationToken.None));
        Assert.Equal(409, noNext.StatusCode);
    }

    [Fact]
    public async Task Member_cannot_manage_another_organizers_equb_and_suspension_blocks_login()
    {
        var owner = await RegisterAsync("Hana Bekele", "hana@test.et", UserRole.Organizer);
        var other = await RegisterAsync("Abel Tesfaye", "abel@test.et", UserRole.Organizer);
        var circle = await _circles.CreateAsync(new CreateCircleRequest
        {
            Name = "Private Equb",
            ContributionAmount = 500,
            MeetingLabel = "Monthly"
        }, owner.Id, CancellationToken.None);

        var forbidden = await Assert.ThrowsAsync<ApiException>(() =>
            _members.AddAsync(circle.Id, new AddMemberRequest { Email = other.Email }, other.Id, CancellationToken.None));
        Assert.Equal(403, forbidden.StatusCode);

        var member = await RegisterAsync("Ruth Alemu", "ruth@test.et", UserRole.Member);
        var admin = new User
        {
            Id = Guid.NewGuid(),
            FullName = "Platform Admin",
            Email = "admin@test.et",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@12345"),
            Role = UserRole.Admin,
            Status = UserStatus.Active,
            CreatedAt = DateTime.UtcNow
        };
        _db.Users.Add(admin);
        await _db.SaveChangesAsync();

        await _admin.SetUserStatusAsync(member.Id, "SUSPENDED", admin.Id, CancellationToken.None);
        var login = await Assert.ThrowsAsync<ApiException>(() => _auth.LoginAsync(new LoginRequest
        {
            Email = member.Email,
            Password = "Member@123"
        }, CancellationToken.None));
        Assert.Equal(403, login.StatusCode);
    }

    [Fact]
    public async Task Organizer_must_be_a_member_before_start()
    {
        var organizer = await RegisterAsync("Hana Bekele", "hana@test.et", UserRole.Organizer);
        var abel = await RegisterAsync("Abel Tesfaye", "abel@test.et", UserRole.Member);
        var circle = await _circles.CreateAsync(new CreateCircleRequest
        {
            Name = "Unity Equb",
            ContributionAmount = 25000,
            MeetingLabel = "Monthly"
        }, organizer.Id, CancellationToken.None);
        await _members.AddAsync(circle.Id, new AddMemberRequest { Email = abel.Email }, organizer.Id, CancellationToken.None);
        await _members.AddAsync(circle.Id, new AddMemberRequest { Email = (await RegisterAsync("Ruth Alemu", "ruth@test.et", UserRole.Member)).Email }, organizer.Id, CancellationToken.None);

        var blocked = await Assert.ThrowsAsync<ApiException>(() => _circles.StartAsync(circle.Id, organizer.Id, CancellationToken.None));
        Assert.Equal(400, blocked.StatusCode);
        Assert.Contains("organizer must also be a member", blocked.Message, StringComparison.OrdinalIgnoreCase);
    }

    public void Dispose()
    {
        _db.Dispose();
        _connection.Dispose();
    }

    private async Task<UserResponse> RegisterAsync(string name, string email, UserRole role)
    {
        var result = await _auth.RegisterAsync(new RegisterRequest
        {
            FullName = name,
            Email = email,
            Password = role == UserRole.Organizer ? "Organizer@123" : "Member@123",
            Role = role
        }, CancellationToken.None);
        return result.User;
    }

    private async Task<StartedCircle> StartUnityAsync()
    {
        var organizer = await RegisterAsync("Hana Bekele", "hana@test.et", UserRole.Organizer);
        var circle = await _circles.CreateAsync(new CreateCircleRequest
        {
            Name = "Unity Equb",
            ContributionAmount = 25000,
            MeetingLabel = "Monthly"
        }, organizer.Id, CancellationToken.None);

        await _members.AddAsync(circle.Id, new AddMemberRequest { Email = organizer.Email }, organizer.Id, CancellationToken.None);
        var others = new[]
        {
            ("Abel Tesfaye", "abel@test.et"),
            ("Ruth Alemu", "ruth@test.et"),
            ("Samuel Desta", "samuel@test.et"),
            ("Meron Girma", "meron@test.et"),
            ("Dawit Kebede", "dawit@test.et")
        };
        foreach (var (name, email) in others)
        {
            var user = await RegisterAsync(name, email, UserRole.Member);
            await _members.AddAsync(circle.Id, new AddMemberRequest { Email = user.Email }, organizer.Id, CancellationToken.None);
        }

        await _circles.StartAsync(circle.Id, organizer.Id, CancellationToken.None);
        var roster = await _members.ListAsync(circle.Id, organizer.Id, CancellationToken.None);
        return new StartedCircle(circle.Id, organizer.Id, roster);
    }

    private async Task PayEveryoneAsync(Guid roundId, StartedCircle circle)
    {
        foreach (var member in circle.Roster)
            await _payments.RecordAsync(roundId, new RecordPaymentRequest { CircleMemberId = member.Id }, circle.OrganizerId, CancellationToken.None);
    }

    private sealed record StartedCircle(Guid CircleId, Guid OrganizerId, List<MemberResponse> Roster);
}
