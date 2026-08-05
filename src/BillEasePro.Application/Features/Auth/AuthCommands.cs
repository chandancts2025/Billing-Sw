using BillEasePro.Application.Dtos;
using MediatR;

namespace BillEasePro.Application.Features.Auth;

public sealed record RegisterCommand(RegisterRequest Request) : IRequest<AuthResponse>;
public sealed record LoginCommand(LoginRequest Request) : IRequest<AuthResponse>;
public sealed record RefreshTokenCommand(RefreshTokenRequest Request) : IRequest<AuthResponse>;
public sealed record ForgotPasswordCommand(ForgotPasswordRequest Request) : IRequest<string>;
public sealed record RequestOtpCommand(RequestOtpRequest Request) : IRequest<bool>;
public sealed record VerifyOtpCommand(VerifyOtpRequest Request) : IRequest<bool>;
public sealed record ResetPasswordCommand(ResetPasswordRequest Request) : IRequest<bool>;
public sealed record SetupShopCommand(Guid UserId, ShopSetupRequest Request) : IRequest<ShopDto>;
public sealed record EnableTwoFactorCommand(Guid UserId) : IRequest<TwoFactorSetupResponse>;
public sealed record VerifyTwoFactorCommand(Guid UserId, string Code) : IRequest<bool>;
public sealed record ChangePasswordCommand(Guid UserId, ChangePasswordRequest Request) : IRequest<bool>;
public sealed record LogoutCommand(LogoutRequest Request) : IRequest<bool>;
