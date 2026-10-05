using System.ComponentModel.DataAnnotations;

namespace EkubCircle.Api.DTOs;

public class CreateCircleRequest
{
    [Required(ErrorMessage = "Circle name is required.")]
    [MaxLength(120)]
    public string Name { get; set; } = string.Empty;

    [Range(0.01, 100000000, ErrorMessage = "Contribution must be greater than 0.")]
    public decimal ContributionAmount { get; set; }

    [Required(ErrorMessage = "Meeting label is required.")]
    [MaxLength(80)]
    public string MeetingLabel { get; set; } = string.Empty;
}

public class UpdateCircleRequest
{
    [Required(ErrorMessage = "Circle name is required.")]
    [MaxLength(120)]
    public string Name { get; set; } = string.Empty;

    [Range(0.01, 100000000, ErrorMessage = "Contribution must be greater than 0.")]
    public decimal ContributionAmount { get; set; }

    [Required(ErrorMessage = "Meeting label is required.")]
    [MaxLength(80)]
    public string MeetingLabel { get; set; } = string.Empty;
}

public class CircleResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal ContributionAmount { get; set; }
    public string MeetingLabel { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public bool IsSuspended { get; set; }
    public Guid OrganizerId { get; set; }
    public string OrganizerName { get; set; } = string.Empty;
    public int MemberCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}

public class CircleSummaryResponse
{
    public int MemberCount { get; set; }
    public decimal ContributionAmount { get; set; }
    public int PaidCount { get; set; }
    public decimal CurrentPot { get; set; }
    public decimal ExpectedPot { get; set; }
    public int? CurrentRound { get; set; }
    public int TotalRounds { get; set; }
    public int ReceivedCount { get; set; }
    public int RemainingReceivers { get; set; }
    public decimal PaymentPercentage { get; set; }
    public decimal CompletionPercentage { get; set; }
    public string? CurrentReceiver { get; set; }
    public Guid? CurrentReceiverMemberId { get; set; }
    public string CircleStatus { get; set; } = string.Empty;
    public string? RoundStatus { get; set; }
    public bool PayoutReady { get; set; }
    public bool IsSuspended { get; set; }
    public List<string> WaitingFor { get; set; } = new();
    public List<string> NextReceivers { get; set; } = new();
    public IntegrityResponse Integrity { get; set; } = new();
}

public class IntegrityResponse
{
    public bool AllMembersVerified { get; set; }
    public bool PaymentRecordsComplete { get; set; }
    public bool ReceiverFromFixedOrder { get; set; }
    public bool NoDuplicatePayout { get; set; }
    public bool CurrentRoundValid { get; set; }
}

public class AddMemberRequest
{
    [Required(ErrorMessage = "Email is required.")]
    [EmailAddress(ErrorMessage = "Enter a valid email address.")]
    public string Email { get; set; } = string.Empty;
}

public class ReorderMembersRequest
{
    [Required]
    [MinLength(1)]
    public List<Guid> OrderedMemberIds { get; set; } = new();
}

public class MemberResponse
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public int PayoutOrder { get; set; }
    public bool HasReceived { get; set; }
    public string UserStatus { get; set; } = string.Empty;
    public DateTime JoinedAt { get; set; }
    public bool PaidCurrentRound { get; set; }
}

public class RoundResponse
{
    public Guid Id { get; set; }
    public Guid CircleId { get; set; }
    public int RoundNumber { get; set; }
    public Guid ReceiverMemberId { get; set; }
    public string ReceiverName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime? OpenedAt { get; set; }
    public DateTime? PaidOutAt { get; set; }
    public decimal? PayoutAmount { get; set; }
    public int PaidCount { get; set; }
    public int MemberCount { get; set; }
}

public class RecordPaymentRequest
{
    [Required(ErrorMessage = "Choose the member whose payment you are recording.")]
    public Guid CircleMemberId { get; set; }
}

public class PaymentResponse
{
    public Guid Id { get; set; }
    public Guid RoundId { get; set; }
    public int RoundNumber { get; set; }
    public Guid CircleMemberId { get; set; }
    public string MemberName { get; set; } = string.Empty;
    public int PayoutOrder { get; set; }
    public bool HasReceived { get; set; }
    public decimal Amount { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime RecordedAt { get; set; }
    public string RecordedByName { get; set; } = string.Empty;
}

public class PayoutResponse
{
    public Guid RoundId { get; set; }
    public int RoundNumber { get; set; }
    public Guid ReceiverMemberId { get; set; }
    public string ReceiverName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool CircleCompleted { get; set; }
    public string Message { get; set; } = string.Empty;
}

public class NotificationResponse
{
    public Guid Id { get; set; }
    public string Action { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
