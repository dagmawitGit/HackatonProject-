using EkubCircle.Api.Common;
using EkubCircle.Api.DTOs;
using EkubCircle.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EkubCircle.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin")]
public class AdminController : ControllerBase
{
    private readonly AdminService _admin;

    public AdminController(AdminService admin)
    {
        _admin = admin;
    }

    [HttpGet("overview")]
    public async Task<ActionResult<AdminOverviewResponse>> Overview(CancellationToken ct)
    {
        return Ok(await _admin.OverviewAsync(ct));
    }

    [HttpGet("users")]
    public async Task<ActionResult<List<UserResponse>>> Users([FromQuery] string? search, CancellationToken ct)
    {
        return Ok(await _admin.UsersAsync(search, ct));
    }

    [HttpPatch("users/{id:guid}/status")]
    public async Task<ActionResult<UserResponse>> SetUserStatus(Guid id, UpdateUserStatusRequest request, CancellationToken ct)
    {
        return Ok(await _admin.SetUserStatusAsync(id, request.Status, User.GetUserId(), ct));
    }

    [HttpGet("circles")]
    public async Task<ActionResult<List<AdminCircleResponse>>> Circles([FromQuery] string? search, CancellationToken ct)
    {
        return Ok(await _admin.CirclesAsync(search, ct));
    }

    [HttpPatch("circles/{id:guid}/suspension")]
    public async Task<ActionResult<AdminCircleResponse>> SetSuspension(Guid id, UpdateCircleSuspensionRequest request, CancellationToken ct)
    {
        return Ok(await _admin.SetSuspensionAsync(id, request.Suspended, User.GetUserId(), ct));
    }

    [HttpGet("reports")]
    public async Task<ActionResult<List<CircleReportResponse>>> Reports(CancellationToken ct)
    {
        return Ok(await _admin.ReportsAsync(ct));
    }

    [HttpGet("audit-logs")]
    public async Task<ActionResult<List<AuditLogResponse>>> AuditLogs([FromQuery] string? search, [FromQuery] string? action, CancellationToken ct)
    {
        return Ok(await _admin.AuditLogsAsync(search, action, ct));
    }
}
