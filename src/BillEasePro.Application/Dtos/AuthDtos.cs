using BillEasePro.Domain.Enums;

namespace BillEasePro.Application.Dtos;

public sealed record RegisterAddressRequest(string Line1, string City, string State, string Pincode, string Country);
public sealed record RegisterRequest(
    string FullName,
    string Email,
    string? Phone,
    DateTimeOffset? Dob,
    Gender Gender,
    RegisterAddressRequest Address,
    Guid? ShopId,
    string Password,
    string ConfirmPassword,
    string? InviteCode);
public sealed record LoginRequest(string Email, string Password, string? TwoFactorCode, bool RememberMe);
public sealed record AuthResponse(string AccessToken, string? RefreshToken, DateTimeOffset ExpiresAt, UserDto User, bool RequiresShopSetup);
public sealed record RefreshTokenRequest(string? RefreshToken);
public sealed record ForgotPasswordRequest(string Email);
public sealed record RequestOtpRequest(string Email, OtpPurpose Purpose);
public sealed record VerifyOtpRequest(string Email, string Code, OtpPurpose Purpose);
public sealed record ResetPasswordRequest(string Email, string Otp, string NewPassword);
public sealed record ShopSetupRequest(string Name, string? LegalName, IndustryType IndustryType, TaxRegime TaxRegime, string CurrencyCode, string? TaxRegistrationNumber, string AddressLine1, string? AddressLine2, string City, string State, string PostalCode, string Country, string Phone, string Email);
public sealed record CreateUserRequest(Guid ShopId, string FullName, string Email, string Password, string? Phone, UserRole Role);
public sealed record TwoFactorSetupResponse(string Secret, string ProvisioningUri);
public sealed record ChangePasswordRequest(string CurrentPassword, string NewPassword);
public sealed record LogoutRequest(Guid UserId);
