using EkubCircle.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace EkubCircle.Api.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddEkubCircleServices(this IServiceCollection services)
    {
        services.AddScoped<IEkubRuleService, EkubRuleService>();
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer();
        services.AddAuthorization();

        return services;
    }
}
