using EkubCircle.Api.Data;
using EkubCircle.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace EkubCircle.Api.Middleware;

public class ActiveUserMiddleware
{
    private readonly RequestDelegate _next;

    public ActiveUserMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task Invoke(HttpContext context, AppDbContext db)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var raw = context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(raw, out var userId))
            {
                await Reject(context);
                return;
            }

            var status = await db.Users.AsNoTracking()
                .Where(u => u.Id == userId)
                .Select(u => (UserStatus?)u.Status)
                .FirstOrDefaultAsync(context.RequestAborted);

            if (status is null || status == UserStatus.Suspended)
            {
                await Reject(context);
                return;
            }
        }

        await _next(context);
    }

    private static async Task Reject(HttpContext context)
    {
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(new { message = "This account is suspended." });
    }
}
