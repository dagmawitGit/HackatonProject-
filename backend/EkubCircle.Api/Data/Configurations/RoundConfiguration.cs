using EkubCircle.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EkubCircle.Api.Data.Configurations;

public sealed class RoundConfiguration : IEntityTypeConfiguration<Round>
{
    public void Configure(EntityTypeBuilder<Round> builder)
    {
        builder.HasKey(round => round.Id);
        builder.HasAlternateKey(round => new { round.Id, round.CircleId });
        builder.Property(round => round.Status).HasConversion<string>().HasMaxLength(32)
            .HasDefaultValue(RoundStatus.Open);
        builder.HasOne<Circle>().WithMany().HasForeignKey(round => round.CircleId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<CircleMember>().WithMany()
            .HasForeignKey(round => new { round.ReceiverCircleMemberId, round.CircleId })
            .HasPrincipalKey(member => new { member.Id, member.CircleId })
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(round => new { round.CircleId, round.RoundNumber }).IsUnique();
        builder.HasIndex(round => new { round.CircleId, round.ReceiverCircleMemberId }).IsUnique();
    }
}
