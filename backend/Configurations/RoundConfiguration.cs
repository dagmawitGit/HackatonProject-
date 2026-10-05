using EkubCircle.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EkubCircle.Api.Configurations;

public class RoundConfiguration : IEntityTypeConfiguration<Round>
{
    public void Configure(EntityTypeBuilder<Round> builder)
    {
        builder.ToTable("Rounds");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => new { x.CircleId, x.RoundNumber }).IsUnique();
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
        builder.Property(x => x.PayoutAmount).HasPrecision(18, 2);
        builder.HasOne(x => x.Circle)
            .WithMany(x => x.Rounds)
            .HasForeignKey(x => x.CircleId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.Receiver)
            .WithMany(x => x.RoundsToReceive)
            .HasForeignKey(x => x.ReceiverMemberId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
