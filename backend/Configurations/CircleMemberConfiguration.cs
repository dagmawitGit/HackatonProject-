using EkubCircle.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EkubCircle.Api.Configurations;

public class CircleMemberConfiguration : IEntityTypeConfiguration<CircleMember>
{
    public void Configure(EntityTypeBuilder<CircleMember> builder)
    {
        builder.ToTable("CircleMembers");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => new { x.CircleId, x.UserId }).IsUnique();
        builder.HasIndex(x => new { x.CircleId, x.PayoutOrder }).IsUnique();
        builder.HasOne(x => x.Circle)
            .WithMany(x => x.Members)
            .HasForeignKey(x => x.CircleId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.User)
            .WithMany(x => x.Memberships)
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
