namespace EkubCircle.Api.DTOs.Payments;

public sealed record MarkPaymentRequestDto(Guid RoundId, Guid CircleMemberId, decimal Amount);
