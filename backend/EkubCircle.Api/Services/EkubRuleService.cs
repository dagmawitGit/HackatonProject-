using EkubCircle.Api.Entities;

namespace EkubCircle.Api.Services;

public sealed class EkubRuleService : IEkubRuleService
{
    public bool CanStartCircle(Circle circle) => throw new NotImplementedException();

    public bool CanMarkPayment(Payment payment) => throw new NotImplementedException();

    public bool CanPayout(Round round) => throw new NotImplementedException();

    public bool CanOpenNextRound(Circle circle) => throw new NotImplementedException();

    public bool CanCompleteCircle(Circle circle) => throw new NotImplementedException();
}
