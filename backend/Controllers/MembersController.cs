using EkubCircle.Api.Common;
using EkubCircle.Api.DTOs;
using EkubCircle.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EkubCircle.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/circles/{circleId:guid}/members")]
public class MembersController : ControllerBase
{
    private readonly MemberService _members;

    public MembersController(MemberService members)
    {
        _members = members;
    }

    [HttpGet]
    public async Task<ActionResult<List<MemberResponse>>> List(Guid circleId, CancellationToken ct)
    {
        return Ok(await _members.ListAsync(circleId, User.GetUserId(), ct));
    }

    [Authorize(Roles = "Organizer")]
    [HttpPost]
    public async Task<ActionResult<MemberResponse>> Add(Guid circleId, AddMemberRequest request, CancellationToken ct)
    {
        var created = await _members.AddAsync(circleId, request, User.GetUserId(), ct);
        return StatusCode(StatusCodes.Status201Created, created);
    }

    [Authorize(Roles = "Organizer")]
    [HttpPut("order")]
    public async Task<ActionResult<List<MemberResponse>>> Reorder(Guid circleId, ReorderMembersRequest request, CancellationToken ct)
    {
        return Ok(await _members.ReorderAsync(circleId, request, User.GetUserId(), ct));
    }

    [Authorize(Roles = "Organizer")]
    [HttpDelete("{memberId:guid}")]
    public async Task<IActionResult> Remove(Guid circleId, Guid memberId, CancellationToken ct)
    {
        await _members.RemoveAsync(circleId, memberId, User.GetUserId(), ct);
        return NoContent();
    }
}
