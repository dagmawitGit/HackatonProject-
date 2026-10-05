using EkubCircle.Api.Data;
using EkubCircle.Api.DTOs;
using Microsoft.EntityFrameworkCore;

namespace EkubCircle.Api.Services;

public class NotificationService
{
    private readonly AppDbContext _db;

    public NotificationService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<NotificationResponse>> MineAsync(Guid userId, CancellationToken ct)
    {
        var circleIds = await _db.Circles
            .Where(c => c.OrganizerId == userId || c.Members.Any(m => m.UserId == userId))
            .Select(c => c.Id)
            .ToListAsync(ct);
        var roundIds = await _db.Rounds.Where(r => circleIds.Contains(r.CircleId)).Select(r => r.Id).ToListAsync(ct);
        var memberIds = await _db.CircleMembers.Where(m => circleIds.Contains(m.CircleId)).Select(m => m.Id).ToListAsync(ct);
        var paymentIds = await _db.Payments.Where(p => roundIds.Contains(p.RoundId)).Select(p => p.Id).ToListAsync(ct);
        var related = circleIds.Concat(roundIds).Concat(memberIds).Concat(paymentIds).Distinct().ToList();

        var logs = await _db.AuditLogs
            .Where(a => a.UserId == userId || (a.EntityId != null && related.Contains(a.EntityId.Value)))
            .OrderByDescending(a => a.CreatedAt)
            .Take(40)
            .ToListAsync(ct);

        return logs.Select(a => new NotificationResponse
        {
            Id = a.Id,
            Action = a.Action,
            Description = a.Description,
            CreatedAt = a.CreatedAt
        }).ToList();
    }
}
