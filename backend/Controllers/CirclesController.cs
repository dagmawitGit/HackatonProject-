using EkubCircle.Api.Common;
using EkubCircle.Api.DTOs;
using EkubCircle.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EkubCircle.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/circles")]
public class CirclesController : ControllerBase
{
    private readonly CircleService _circles;

    public CirclesController(CircleService circles)
    {
        _circles = circles;
    }

    [HttpGet]
    public async Task<ActionResult<List<CircleResponse>>> List(CancellationToken ct)
    {
        return Ok(await _circles.ListMineAsync(User.GetUserId(), ct));
    }

    [Authorize(Roles = "Organizer")]
    [HttpPost]
    public async Task<ActionResult<CircleResponse>> Create(CreateCircleRequest request, CancellationToken ct)
    {
        var created = await _circles.CreateAsync(request, User.GetUserId(), ct);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<CircleResponse>> Get(Guid id, CancellationToken ct)
    {
        return Ok(await _circles.GetAsync(id, User.GetUserId(), ct));
    }

    [Authorize(Roles = "Organizer")]
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<CircleResponse>> Update(Guid id, UpdateCircleRequest request, CancellationToken ct)
    {
        return Ok(await _circles.UpdateAsync(id, request, User.GetUserId(), ct));
    }

    [Authorize(Roles = "Organizer")]
    [HttpPost("{id:guid}/start")]
    public async Task<ActionResult<CircleResponse>> Start(Guid id, CancellationToken ct)
    {
        return Ok(await _circles.StartAsync(id, User.GetUserId(), ct));
    }

    [Authorize(Roles = "Organizer")]
    [HttpPost("{id:guid}/complete")]
    public async Task<ActionResult<CircleResponse>> Complete(Guid id, CancellationToken ct)
    {
        return Ok(await _circles.CompleteAsync(id, User.GetUserId(), ct));
    }

    [HttpGet("{id:guid}/summary")]
    public async Task<ActionResult<CircleSummaryResponse>> Summary(Guid id, CancellationToken ct)
    {
        return Ok(await _circles.SummaryAsync(id, User.GetUserId(), ct));
    }
}
