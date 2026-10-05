using EkubCircle.Api.Common;
using EkubCircle.Api.Entities;

namespace EkubCircle.Api.Services;

public class EqubRuleService
{
    public void EnsureContribution(decimal amount)
    {
        if (amount <= 0)
            throw new ApiException(StatusCodes.Status400BadRequest, "Contribution must be greater than 0.");
    }

    public void EnsureText(string? value, string label)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ApiException(StatusCodes.Status400BadRequest, $"{label} is required.");
    }

    public void EnsureCanStart(Circle circle, IReadOnlyCollection<CircleMember> members)
    {
        if (circle.Status != CircleStatus.Forming)
            throw new ApiException(StatusCodes.Status409Conflict, "This equb has already started.");

        if (members.Count < 2)
            throw new ApiException(StatusCodes.Status400BadRequest, "Add at least 2 members before starting the equb.");

        if (members.All(m => m.UserId != circle.OrganizerId))
            throw new ApiException(StatusCodes.Status400BadRequest, "The organizer must also be a member of the equb before it can start.");

        var orders = members.Select(m => m.PayoutOrder).OrderBy(x => x).ToArray();
        for (var i = 0; i < orders.Length; i++)
        {
            if (orders[i] != i + 1)
                throw new ApiException(StatusCodes.Status400BadRequest, "Payout order must be a continuous sequence starting at 1.");
        }
    }

    public void EnsureFormingMutation(Circle circle, string action)
    {
        if (circle.Status != CircleStatus.Forming)
            throw new ApiException(StatusCodes.Status409Conflict, $"{action} is locked after the equb starts.");
    }

    public void EnsureCanRecordPayment(Round round, CircleMember member, bool alreadyPaid)
    {
        if (round.Status == RoundStatus.PaidOut)
            throw new ApiException(StatusCodes.Status409Conflict, "This round is already closed. Payments cannot be changed.");

        if (round.Status != RoundStatus.Open)
            throw new ApiException(StatusCodes.Status400BadRequest, "Payments can only be recorded for the current open round.");

        if (member.CircleId != round.CircleId)
            throw new ApiException(StatusCodes.Status400BadRequest, "That person is not a member of this equb.");

        if (alreadyPaid)
            throw new ApiException(StatusCodes.Status409Conflict, "This member already has a payment for the current round.");
    }

    public void EnsureCanPayOut(Round round, int memberCount, int paidCount, CircleMember receiver)
    {
        if (round.Status == RoundStatus.PaidOut)
            throw new ApiException(StatusCodes.Status409Conflict, "This round has already been paid out.");

        if (round.Status != RoundStatus.Open)
            throw new ApiException(StatusCodes.Status400BadRequest, "Only the current open round can be paid out.");

        if (paidCount != memberCount)
            throw new ApiException(StatusCodes.Status409Conflict, "Payout is locked. All members must pay before payout.");

        if (receiver.HasReceived)
            throw new ApiException(StatusCodes.Status409Conflict, "This member has already received the pot.");

        if (receiver.Id != round.ReceiverMemberId || receiver.PayoutOrder != round.RoundNumber)
            throw new ApiException(StatusCodes.Status409Conflict, "The receiver does not match the fixed payout order.");
    }

    public static decimal Pot(int paidOrMemberCount, decimal contribution) => paidOrMemberCount * contribution;

    public static decimal Percentage(int part, int whole)
    {
        if (whole <= 0)
            return 0;

        return Math.Round(part * 100m / whole, 2);
    }
}
