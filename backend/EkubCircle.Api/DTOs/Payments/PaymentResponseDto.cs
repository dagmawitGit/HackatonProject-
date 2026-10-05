namespace EkubCircle.Api.DTOs.Payments;

public sealed record PaymentResponseDto(Guid Id, Guid RoundId, Guid CircleMemberId, decimal Amount, DateTimeOffset PaidAt);
