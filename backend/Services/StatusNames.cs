using EkubCircle.Api.Entities;

namespace EkubCircle.Api.Services;

public static class StatusNames
{
    public static string Role(UserRole role) => role.ToString();

    public static string User(UserStatus status) => status == UserStatus.Active ? "ACTIVE" : "SUSPENDED";

    public static string Circle(CircleStatus status) => status switch
    {
        CircleStatus.Forming => "FORMING",
        CircleStatus.Active => "ACTIVE",
        CircleStatus.Completed => "COMPLETED",
        _ => status.ToString().ToUpperInvariant()
    };

    public static string Round(RoundStatus status) => status switch
    {
        RoundStatus.Pending => "PENDING",
        RoundStatus.Open => "OPEN",
        RoundStatus.PaidOut => "PAID_OUT",
        _ => status.ToString().ToUpperInvariant()
    };
}
