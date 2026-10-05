using EkubCircle.Api.Common;
using EkubCircle.Api.Data;
using EkubCircle.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace EkubCircle.Api.Authorization;

public class CircleAccess
{
    private readonly AppDbContext _db;

    public CircleAccess(AppDbContext db)
    {
        _db = db;
    }

    public async Task<User> RequireActiveUserAsync(Guid userId, CancellationToken ct)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new ApiException(StatusCodes.Status401Unauthorized, "Please log in again.");

        if (user.Status == UserStatus.Suspended)
            throw new ApiException(StatusCodes.Status403Forbidden, "This account is suspended.");

        return user;
    }

    public async Task<Circle> RequireOrganizerCircleAsync(Guid circleId, Guid userId, CancellationToken ct)
    {
        await RequireActiveUserAsync(userId, ct);
        var circle = await _db.Circles.FirstOrDefaultAsync(c => c.Id == circleId, ct)
            ?? throw new ApiException(StatusCodes.Status404NotFound, "Equb not found.");

        if (circle.OrganizerId != userId)
            throw new ApiException(StatusCodes.Status403Forbidden, "Only the organizer of this equb can do that.");

        if (circle.IsSuspended)
            throw new ApiException(StatusCodes.Status403Forbidden, "This equb is suspended. Contact a platform admin.");

        return circle;
    }

    public async Task<Circle> RequireReaderAsync(Guid circleId, Guid userId, CancellationToken ct)
    {
        var user = await RequireActiveUserAsync(userId, ct);
        var circle = await _db.Circles.Include(c => c.Organizer).FirstOrDefaultAsync(c => c.Id == circleId, ct)
            ?? throw new ApiException(StatusCodes.Status404NotFound, "Equb not found.");

        if (user.Role == UserRole.Admin)
            return circle;

        var belongs = circle.OrganizerId == userId
            || await _db.CircleMembers.AnyAsync(m => m.CircleId == circleId && m.UserId == userId, ct);

        if (!belongs)
            throw new ApiException(StatusCodes.Status403Forbidden, "You do not belong to this equb.");

        return circle;
    }
}
