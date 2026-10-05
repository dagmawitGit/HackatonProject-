namespace EkubCircle.Api.DTOs.Auth;

public sealed record AuthResponseDto(string AccessToken, string DisplayName, string Role);
