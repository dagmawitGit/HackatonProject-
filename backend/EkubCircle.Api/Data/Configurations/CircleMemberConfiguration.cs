using EkubCircle.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EkubCircle.Api.Data.Configurations;

public sealed class CircleMemberConfiguration : IEntityTypeConfiguration<CircleMember>
{
    public void Configure(EntityTypeBuilder<CircleMember> builder)
    {
        builder.HasKey(member => member.Id);
        builder.HasAlternateKey(member => new { member.Id, member.CircleId });
        builder.HasOne<Circle>().WithMany().HasForeignKey(member => member.CircleId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<User>().WithMany().HasForeignKey(member => member.UserId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(member => new { member.CircleId, member.UserId }).IsUnique();
        builder.HasIndex(member => new { member.CircleId, member.PayoutOrder }).IsUnique();
    }
}
