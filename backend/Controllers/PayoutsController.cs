using EkubCircle.Api.Common;
using EkubCircle.Api.DTOs;
using EkubCircle.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EkubCircle.Api.Controllers;

[ApiController]
[Authorize(Roles = "Organizer")]
[Route("api/rounds/{roundId:guid}/payout")]
public class PayoutsController : ControllerBase
{
    private readonly PayoutService _payouts;

    public PayoutsController(PayoutService payouts)
    {
        _payouts = payouts;
    }

    [HttpPost]
    public async Task<ActionResult<PayoutResponse>> PayOut(Guid roundId, CancellationToken ct)
    {
        return Ok(await _payouts.PayOutAsync(roundId, User.GetUserId(), ct));
    }
}
