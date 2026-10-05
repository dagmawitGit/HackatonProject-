namespace EkubCircle.Api.DTOs.Members;

public sealed record CircleMemberResponseDto(Guid Id, Guid UserId, int? PayoutOrder);
