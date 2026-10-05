using EkubCircle.Api.Common;
using EkubCircle.Api.DTOs;
using EkubCircle.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EkubCircle.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/circles/{circleId:guid}/rounds")]
public class RoundsController : ControllerBase
{
    private readonly RoundService _rounds;

    public RoundsController(RoundService rounds)
    {
        _rounds = rounds;
    }

    [HttpGet]
    public async Task<ActionResult<List<RoundResponse>>> List(Guid circleId, CancellationToken ct)
    {
        return Ok(await _rounds.ListAsync(circleId, User.GetUserId(), ct));
    }

    [HttpGet("current")]
    public async Task<IActionResult> Current(Guid circleId, CancellationToken ct)
    {
        var round = await _rounds.CurrentAsync(circleId, User.GetUserId(), ct);
        if (round is null)
            return Ok(new { round = (RoundResponse?)null, message = "There is no open round right now." });

        return Ok(round);
    }

    [Authorize(Roles = "Organizer")]
    [HttpPost("next")]
    public async Task<ActionResult<RoundResponse>> OpenNext(Guid circleId, CancellationToken ct)
    {
        return Ok(await _rounds.OpenNextAsync(circleId, User.GetUserId(), ct));
    }
}
