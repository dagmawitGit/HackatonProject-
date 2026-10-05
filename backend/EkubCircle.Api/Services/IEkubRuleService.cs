using EkubCircle.Api.Entities;

namespace EkubCircle.Api.Services;

public interface IEkubRuleService
{
    bool CanStartCircle(Circle circle);
    bool CanMarkPayment(Payment payment);
    bool CanPayout(Round round);
    bool CanOpenNextRound(Circle circle);
    bool CanCompleteCircle(Circle circle);
}
