namespace EkubCircle.Api.DTOs.Rounds;

public sealed record RoundResponseDto(Guid Id, int RoundNumber, string Status, Guid? ReceiverCircleMemberId);
