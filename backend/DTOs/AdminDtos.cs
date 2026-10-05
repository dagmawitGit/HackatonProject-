//adminDots

namespace EkubCircle.Api.DTOs;

public class AdminOverviewResponse
{
    public int UserCount { get; set; }
    public int ActiveUserCount { get; set; }
    public int SuspendedUserCount { get; set; }
    public int CircleCount { get; set; }
    public int FormingCount { get; set; }
    public int ActiveCircleCount { get; set; }
    public int CompletedCount { get; set; }
    public int SuspendedCircleCount { get; set; }
    public decimal RecordedContributions { get; set; }
    public decimal RecordedPayouts { get; set; }
    public int AuditEventCount { get; set; }
    public bool DatabaseConnected { get; set; }
}

public class UpdateUserStatusRequest
{
    public string Status { get; set; } = string.Empty;
}

public class UpdateCircleSuspensionRequest
{
    public bool Suspended { get; set; }
}

public class AdminCircleResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public bool IsSuspended { get; set; }
    public decimal ContributionAmount { get; set; }
    public string MeetingLabel { get; set; } = string.Empty;
    public string OrganizerName { get; set; } = string.Empty;
    public string OrganizerEmail { get; set; } = string.Empty;
    public int MemberCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CircleReportResponse
{
    public Guid CircleId { get; set; }
    public string CircleName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public bool IsSuspended { get; set; }
    public string OrganizerName { get; set; } = string.Empty;
    public int MemberCount { get; set; }
    public int ReceivedCount { get; set; }
    public decimal ContributionAmount { get; set; }
    public decimal TotalRecordedPayments { get; set; }
    public decimal TotalPayouts { get; set; }
}

public class AuditLogResponse
{
    public Guid Id { get; set; }
    public Guid? UserId { get; set; }
    public string? UserName { get; set; }
    public string? UserEmail { get; set; }
    public string Action { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public Guid? EntityId { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

// public class AdminUserDto
// {
//     public Guid Id { get; set; }
//     public string FullName { get; set; } = string.Empty;
//     public string Email { get; set; } = string.Empty;
//     public string Role { get; set; } = string.Empty;
//     public string Status { get; set; } = string.Empty;
//     public DateTime CreatedAt { get; set; }
// }


