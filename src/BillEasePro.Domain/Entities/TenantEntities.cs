using BillEasePro.Domain.Common;
using BillEasePro.Domain.Enums;

namespace BillEasePro.Domain.Entities;

public sealed class Tenant : BaseAuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string Plan { get; set; } = "Free";
    public bool IsActive { get; set; } = true;
    public ICollection<Shop> Shops { get; set; } = new List<Shop>();
}

public sealed class Shop : BaseAuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string? LegalName { get; set; }
    public string? TaxRegistrationNumber { get; set; }
    public IndustryType IndustryType { get; set; } = IndustryType.Retail;
    public TaxRegime TaxRegime { get; set; } = TaxRegime.GST;
    public string CurrencyCode { get; set; } = "INR";
    public string? LogoUrl { get; set; }
    public string AddressLine1 { get; set; } = string.Empty;
    public string? AddressLine2 { get; set; }
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string Country { get; set; } = "India";
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public ICollection<AppUser> Users { get; set; } = new List<AppUser>();
}

public sealed class ShopSetting : BaseAuditableEntity
{
    public Guid ShopId { get; set; }
    public Shop? Shop { get; set; }
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public SettingDataType DataType { get; set; } = SettingDataType.String;
}

public sealed class AppUser : BaseAuditableEntity
{
    public Guid ShopId { get; set; }
    public Shop? Shop { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public DateTimeOffset? DateOfBirth { get; set; }
    public Gender Gender { get; set; } = Gender.NotSpecified;
    public string? AddressLine1 { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Pincode { get; set; }
    public string Country { get; set; } = "India";
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Operator;
    public bool IsActive { get; set; } = true;
    public bool EmailVerified { get; set; }
    public bool PhoneVerified { get; set; }
    public int FailedLoginAttempts { get; set; }
    public DateTimeOffset? LockoutEnd { get; set; }
    public DateTimeOffset? LastLoginAt { get; set; }
    public string? TwoFactorSecret { get; set; }
    public bool TwoFactorEnabled { get; set; }
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}

public sealed class AuditLog : BaseAuditableEntity
{
    public Guid? UserId { get; set; }
    public AppUser? User { get; set; }
    public string Action { get; set; } = string.Empty;
    public string Entity { get; set; } = string.Empty;
    public Guid? EntityId { get; set; }
    public string? OldValues { get; set; }
    public string? NewValues { get; set; }
    public string? IPAddress { get; set; }
    public DateTimeOffset Timestamp { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class RefreshToken : BaseAuditableEntity
{
    public Guid AppUserId { get; set; }
    public AppUser? AppUser { get; set; }
    public string TokenHash { get; set; } = string.Empty;
    public DateTimeOffset ExpiresAt { get; set; }
    public DateTimeOffset? RevokedAt { get; set; }
    public string? ReplacedByTokenHash { get; set; }
    public string? CreatedByIp { get; set; }
    public string? UserAgent { get; set; }
    public bool IsRemembered { get; set; }
}

public sealed class UserActivityLog : BaseAuditableEntity
{
    public Guid AppUserId { get; set; }
    public AppUser? AppUser { get; set; }
    public string Action { get; set; } = string.Empty;
    public string EntityName { get; set; } = string.Empty;
    public Guid? EntityId { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? MetadataJson { get; set; }
}

public sealed class UserOtp : BaseAuditableEntity
{
    public Guid AppUserId { get; set; }
    public AppUser? AppUser { get; set; }
    public OtpPurpose Purpose { get; set; }
    public string CodeHash { get; set; } = string.Empty;
    public DateTimeOffset ExpiresAt { get; set; }
    public DateTimeOffset? ConsumedAt { get; set; }
    public int AttemptCount { get; set; }
}
