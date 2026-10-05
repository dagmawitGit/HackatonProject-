using EkubCircle.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EkubCircle.Api.Configurations;

public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> builder)
    {
        builder.ToTable("Payments");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => new { x.RoundId, x.CircleMemberId }).IsUnique();
        builder.Property(x => x.Amount).HasPrecision(18, 2);
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
        builder.HasOne(x => x.Round)
            .WithMany(x => x.Payments)
            .HasForeignKey(x => x.RoundId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.CircleMember)
            .WithMany(x => x.Payments)
            .HasForeignKey(x => x.CircleMemberId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
