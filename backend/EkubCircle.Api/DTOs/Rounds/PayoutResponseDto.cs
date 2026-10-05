namespace EkubCircle.Api.DTOs.Rounds;

public sealed record PayoutResponseDto(Guid RoundId, Guid ReceiverCircleMemberId, DateTimeOffset PaidOutAt);
