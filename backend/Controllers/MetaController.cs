using EkubCircle.Api.Common;
using EkubCircle.Api.Data;
using EkubCircle.Api.DTOs;
using EkubCircle.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EkubCircle.Api.Controllers;

[ApiController]
[Route("api")]
public class MetaController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly NotificationService _notifications;

    public MetaController(AppDbContext db, NotificationService notifications)
    {
        _db = db;
        _notifications = notifications;
    }

    [HttpGet("health")]
    public async Task<IActionResult> Health(CancellationToken ct)
    {
        var connected = false;
        try
        {
            connected = await _db.Database.CanConnectAsync(ct);
        }
        catch
        {
            connected = false;
        }

        return Ok(new
        {
            status = "ok",
            service = "EkubCircle",
            database = connected ? "connected" : "unavailable",
            moneyMovement = "none"
        });
    }

    [Authorize]
    [HttpGet("notifications")]
    public async Task<ActionResult<List<NotificationResponse>>> Notifications(CancellationToken ct)
    {
        return Ok(await _notifications.MineAsync(User.GetUserId(), ct));
    }
}
