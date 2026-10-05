using EkubCircle.Api.Common;
using EkubCircle.Api.DTOs;
using EkubCircle.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EkubCircle.Api.Controllers;

[ApiController]
[Authorize]
public class PaymentsController : ControllerBase
{
    private readonly PaymentService _payments;

    public PaymentsController(PaymentService payments)
    {
        _payments = payments;
    }

    [Authorize(Roles = "Organizer")]
    [HttpPost("api/rounds/{roundId:guid}/payments")]
    [HttpPost("api/rounds/{roundId:guid}/contributions")]
    public async Task<ActionResult<PaymentResponse>> Record(Guid roundId, RecordPaymentRequest request, CancellationToken ct)
    {
        var created = await _payments.RecordAsync(roundId, request, User.GetUserId(), ct);
        return StatusCode(StatusCodes.Status201Created, created);
    }

    [HttpGet("api/rounds/{roundId:guid}/payments")]
    [HttpGet("api/rounds/{roundId:guid}/contributions")]
    public async Task<ActionResult<List<PaymentResponse>>> ListForRound(Guid roundId, CancellationToken ct)
    {
        return Ok(await _payments.ListForRoundAsync(roundId, User.GetUserId(), ct));
    }

    [HttpGet("api/circles/{circleId:guid}/payments")]
    [HttpGet("api/circles/{circleId:guid}/contributions")]
    public async Task<ActionResult<List<PaymentResponse>>> ListForCircle(Guid circleId, CancellationToken ct)
    {
        return Ok(await _payments.ListForCircleAsync(circleId, User.GetUserId(), ct));
    }
}
