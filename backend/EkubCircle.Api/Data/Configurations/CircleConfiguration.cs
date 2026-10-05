using EkubCircle.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EkubCircle.Api.Data.Configurations;

public sealed class CircleConfiguration : IEntityTypeConfiguration<Circle>
{
    public void Configure(EntityTypeBuilder<Circle> builder)
    {
        builder.HasKey(circle => circle.Id);
        builder.Property(circle => circle.Name).HasMaxLength(160).IsRequired();
        builder.Property(circle => circle.Status).HasConversion<string>().HasMaxLength(32)
            .HasDefaultValue(CircleStatus.Forming);
        builder.HasOne<User>().WithMany().HasForeignKey(circle => circle.OrganizerUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
