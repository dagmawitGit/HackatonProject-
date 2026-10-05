using System.Security.Claims;

namespace EkubCircle.Api.Common;

public static class ClaimsPrincipalExtensions
{
    public static Guid GetUserId(this ClaimsPrincipal user)
    {
        var value = user.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(value, out var id))
            throw new ApiException(StatusCodes.Status401Unauthorized, "Your session is invalid. Please log in again.");

        return id;
    }
}
