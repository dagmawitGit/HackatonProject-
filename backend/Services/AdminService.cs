using EkubCircle.Api.Common;
using EkubCircle.Api.Data;
using EkubCircle.Api.DTOs;
using EkubCircle.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace EkubCircle.Api.Services;

public class AdminService
{
    private readonly AppDbContext _db;
    private readonly AuditService _audit;

    public AdminService(AppDbContext db, AuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    public async Task<AdminOverviewResponse> OverviewAsync(CancellationToken ct)
    {
        var connected = await _db.Database.CanConnectAsync(ct);
        return new AdminOverviewResponse
        {
            UserCount = await _db.Users.CountAsync(ct),
            ActiveUserCount = await _db.Users.CountAsync(u => u.Status == UserStatus.Active, ct),
            SuspendedUserCount = await _db.Users.CountAsync(u => u.Status == UserStatus.Suspended, ct),
            CircleCount = await _db.Circles.CountAsync(ct),
            FormingCount = await _db.Circles.CountAsync(c => c.Status == CircleStatus.Forming, ct),
            ActiveCircleCount = await _db.Circles.CountAsync(c => c.Status == CircleStatus.Active, ct),
            CompletedCount = await _db.Circles.CountAsync(c => c.Status == CircleStatus.Completed, ct),
            SuspendedCircleCount = await _db.Circles.CountAsync(c => c.IsSuspended, ct),
            RecordedContributions = await _db.Payments.SumAsync(p => (decimal?)p.Amount, ct) ?? 0,
            RecordedPayouts = await _db.Rounds.SumAsync(r => (decimal?)r.PayoutAmount, ct) ?? 0,
            AuditEventCount = await _db.AuditLogs.CountAsync(ct),
            DatabaseConnected = connected
        };
    }

    public async Task<List<UserResponse>> UsersAsync(string? search, CancellationToken ct)
    {
        var query = _db.Users.AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(u => u.FullName.ToLower().Contains(term) || u.Email.ToLower().Contains(term));
        }

        var users = await query.OrderBy(u => u.FullName).Take(200).ToListAsync(ct);
        return users.Select(AuthService.ToUser).ToList();
    }

    public async Task<UserResponse> SetUserStatusAsync(Guid targetId, string status, Guid adminId, CancellationToken ct)
    {
        if (targetId == adminId)
            throw new ApiException(StatusCodes.Status400BadRequest, "You cannot change your own account status.");

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == targetId, ct)
            ?? throw new ApiException(StatusCodes.Status404NotFound, "User not found.");

        var next = status.Trim().ToUpperInvariant() switch
        {
            "ACTIVE" => UserStatus.Active,
            "SUSPENDED" => UserStatus.Suspended,
            _ => throw new ApiException(StatusCodes.Status400BadRequest, "Status must be ACTIVE or SUSPENDED.")
        };

        if (user.Role == UserRole.Admin && next == UserStatus.Suspended)
        {
            var otherAdmins = await _db.Users.CountAsync(u => u.Role == UserRole.Admin && u.Status == UserStatus.Active && u.Id != user.Id, ct);
            if (otherAdmins == 0)
                throw new ApiException(StatusCodes.Status409Conflict, "The last active admin cannot be suspended.");
        }

        user.Status = next;
        await _db.SaveChangesAsync(ct);
        var action = next == UserStatus.Suspended ? "ADMIN_USER_SUSPENDED" : "ADMIN_USER_REACTIVATED";
        await _audit.LogAsync(adminId, action, "User", user.Id, $"{user.FullName} is now {StatusNames.User(next)}.", ct);
        return AuthService.ToUser(user);
    }

    public async Task<List<AdminCircleResponse>> CirclesAsync(string? search, CancellationToken ct)
    {
        var query = _db.Circles.Include(c => c.Organizer).AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(c => c.Name.ToLower().Contains(term) || c.Organizer.FullName.ToLower().Contains(term));
        }

        var circles = await query.OrderByDescending(c => c.CreatedAt).Take(200).ToListAsync(ct);
        var counts = await _db.CircleMembers
            .GroupBy(m => m.CircleId)
            .Select(g => new { g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Key, x => x.Count, ct);

        return circles.Select(c => new AdminCircleResponse
        {
            Id = c.Id,
            Name = c.Name,
            Status = StatusNames.Circle(c.Status),
            IsSuspended = c.IsSuspended,
            ContributionAmount = c.ContributionAmount,
            MeetingLabel = c.MeetingLabel,
            OrganizerName = c.Organizer.FullName,
            OrganizerEmail = c.Organizer.Email,
            MemberCount = counts.TryGetValue(c.Id, out var count) ? count : 0,
            CreatedAt = c.CreatedAt
        }).ToList();
    }

    public async Task<AdminCircleResponse> SetSuspensionAsync(Guid circleId, bool suspended, Guid adminId, CancellationToken ct)
    {
        var circle = await _db.Circles.Include(c => c.Organizer).FirstOrDefaultAsync(c => c.Id == circleId, ct)
            ?? throw new ApiException(StatusCodes.Status404NotFound, "Equb not found.");

        circle.IsSuspended = suspended;
        await _db.SaveChangesAsync(ct);
        await _audit.LogAsync(adminId, suspended ? "ADMIN_CIRCLE_SUSPENDED" : "ADMIN_CIRCLE_REACTIVATED", "Circle", circle.Id,
            $"\"{circle.Name}\" suspension is now {(suspended ? "on" : "off")}. Ledger history was not rewritten.", ct);

        var count = await _db.CircleMembers.CountAsync(m => m.CircleId == circle.Id, ct);
        return new AdminCircleResponse
        {
            Id = circle.Id,
            Name = circle.Name,
            Status = StatusNames.Circle(circle.Status),
            IsSuspended = circle.IsSuspended,
            ContributionAmount = circle.ContributionAmount,
            MeetingLabel = circle.MeetingLabel,
            OrganizerName = circle.Organizer.FullName,
            OrganizerEmail = circle.Organizer.Email,
            MemberCount = count,
            CreatedAt = circle.CreatedAt
        };
    }

    public async Task<List<CircleReportResponse>> ReportsAsync(CancellationToken ct)
    {
        var circles = await _db.Circles.Include(c => c.Organizer).OrderBy(c => c.Name).ToListAsync(ct);
        var members = await _db.CircleMembers.ToListAsync(ct);
        var payments = await _db.Payments.Include(p => p.Round).ToListAsync(ct);
        var rounds = await _db.Rounds.ToListAsync(ct);

        return circles.Select(c => new CircleReportResponse
        {
            CircleId = c.Id,
            CircleName = c.Name,
            Status = StatusNames.Circle(c.Status),
            IsSuspended = c.IsSuspended,
            OrganizerName = c.Organizer.FullName,
            MemberCount = members.Count(m => m.CircleId == c.Id),
            ReceivedCount = members.Count(m => m.CircleId == c.Id && m.HasReceived),
            ContributionAmount = c.ContributionAmount,
            TotalRecordedPayments = payments.Where(p => p.Round.CircleId == c.Id).Sum(p => p.Amount),
            TotalPayouts = rounds.Where(r => r.CircleId == c.Id).Sum(r => r.PayoutAmount ?? 0)
        }).ToList();
    }

    public async Task<List<AuditLogResponse>> AuditLogsAsync(string? search, string? action, CancellationToken ct)
    {
        var query = _db.AuditLogs.Include(a => a.User).AsQueryable();
        if (!string.IsNullOrWhiteSpace(action))
        {
            var code = action.Trim().ToUpperInvariant();
            query = query.Where(a => a.Action == code);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(a => a.Description.ToLower().Contains(term)
                || (a.User != null && (a.User.FullName.ToLower().Contains(term) || a.User.Email.ToLower().Contains(term))));
        }

        var logs = await query.OrderByDescending(a => a.CreatedAt).Take(300).ToListAsync(ct);
        return logs.Select(a => new AuditLogResponse
        {
            Id = a.Id,
            UserId = a.UserId,
            UserName = a.User?.FullName,
            UserEmail = a.User?.Email,
            Action = a.Action,
            EntityType = a.EntityType,
            EntityId = a.EntityId,
            Description = a.Description,
            CreatedAt = a.CreatedAt
        }).ToList();
    }
}
