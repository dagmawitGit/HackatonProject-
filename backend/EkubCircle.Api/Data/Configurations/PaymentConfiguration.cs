using EkubCircle.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EkubCircle.Api.Data.Configurations;

public sealed class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> builder)
    {
        builder.HasKey(payment => payment.Id);
        builder.Property(payment => payment.Amount).HasPrecision(18, 2);
        builder.Property(payment => payment.Status).HasConversion<string>().HasMaxLength(32)
            .HasDefaultValue(PaymentStatus.Paid);
        builder.HasOne<Round>().WithMany()
            .HasForeignKey(payment => new { payment.RoundId, payment.CircleId })
            .HasPrincipalKey(round => new { round.Id, round.CircleId })
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<CircleMember>().WithMany()
            .HasForeignKey(payment => new { payment.CircleMemberId, payment.CircleId })
            .HasPrincipalKey(member => new { member.Id, member.CircleId })
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(payment => new { payment.RoundId, payment.CircleMemberId }).IsUnique();
    }
}
