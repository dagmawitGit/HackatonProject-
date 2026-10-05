using EkubCircle.Api.Authentication;
using EkubCircle.Api.Common;
using EkubCircle.Api.Data;
using EkubCircle.Api.DTOs;
using EkubCircle.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace EkubCircle.Api.Services;

public class AuthService
{
    private readonly AppDbContext _db;
    private readonly JwtTokenService _tokens;
    private readonly AuditService _audit;

    public AuthService(AppDbContext db, JwtTokenService tokens, AuditService audit)
    {
        _db = db;
        _tokens = tokens;
        _audit = audit;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken ct)
    {
        var email = NormalizeEmail(request.Email);
        var name = request.FullName.Trim();
        if (string.IsNullOrWhiteSpace(name))
            throw new ApiException(StatusCodes.Status400BadRequest, "Full name is required.");

        if (request.Password.Length < 8)
            throw new ApiException(StatusCodes.Status400BadRequest, "Password must be at least 8 characters.");

        if (request.Role is not (UserRole.Member or UserRole.Organizer))
            throw new ApiException(StatusCodes.Status400BadRequest, "Role must be Member or Organizer.");

        if (await _db.Users.AnyAsync(u => u.Email == email, ct))
            throw new ApiException(StatusCodes.Status409Conflict, "An account with this email already exists.");

        var user = new User
        {
            Id = Guid.NewGuid(),
            FullName = name,
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = request.Role,
            Status = UserStatus.Active,
            CreatedAt = DateTime.UtcNow
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);
        await _audit.LogAsync(user.Id, "USER_REGISTERED", "User", user.Id, $"{user.FullName} registered as {user.Role}.", ct);
        return ToAuth(user);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken ct)
    {
        var email = NormalizeEmail(request.Email);
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);
        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            throw new ApiException(StatusCodes.Status401Unauthorized, "Email or password is incorrect.");

        if (user.Status == UserStatus.Suspended)
            throw new ApiException(StatusCodes.Status403Forbidden, "This account is suspended.");

        await _audit.LogAsync(user.Id, "USER_LOGIN", "User", user.Id, $"{user.FullName} logged in.", ct);
        return ToAuth(user);
    }

    public async Task<UserResponse> MeAsync(Guid userId, CancellationToken ct)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new ApiException(StatusCodes.Status401Unauthorized, "Please log in again.");

        if (user.Status == UserStatus.Suspended)
            throw new ApiException(StatusCodes.Status403Forbidden, "This account is suspended.");

        return ToUser(user);
    }

    public static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();

    private AuthResponse ToAuth(User user) => new()
    {
        Token = _tokens.CreateToken(user),
        User = ToUser(user)
    };

    public static UserResponse ToUser(User user) => new()
    {
        Id = user.Id,
        FullName = user.FullName,
        Email = user.Email,
        Role = StatusNames.Role(user.Role),
        Status = StatusNames.User(user.Status),
        CreatedAt = user.CreatedAt
    };
}
