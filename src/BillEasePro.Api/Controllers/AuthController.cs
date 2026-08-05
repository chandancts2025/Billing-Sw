using Asp.Versioning;
using BillEasePro.Application.Dtos;
using BillEasePro.Application.Features.Auth;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Claims;

namespace BillEasePro.Api.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
[EnableRateLimiting("auth")]
public sealed class AuthController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IWebHostEnvironment _environment;

    public AuthController(IMediator mediator, IWebHostEnvironment environment)
    {
        _mediator = mediator;
        _environment = environment;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<AuthResponse> Register(RegisterRequest request, CancellationToken cancellationToken)
    {
        var response = await _mediator.Send(new RegisterCommand(request), cancellationToken);
        return WithRefreshCookie(response);
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<AuthResponse> Login(LoginRequest request, CancellationToken cancellationToken)
    {
        var response = await _mediator.Send(new LoginCommand(request), cancellationToken);
        return WithRefreshCookie(response);
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<AuthResponse> Refresh(RefreshTokenRequest? request, CancellationToken cancellationToken)
    {
        var refreshToken = request?.RefreshToken ?? Request.Cookies["billease.refresh"];
        var response = await _mediator.Send(new RefreshTokenCommand(new RefreshTokenRequest(refreshToken)), cancellationToken);
        return WithRefreshCookie(response);
    }

    [HttpPost("forgot-password")]
    [AllowAnonymous]
    public async Task<ActionResult<object>> ForgotPassword(ForgotPasswordRequest request, CancellationToken cancellationToken)
        => Ok(new { message = await _mediator.Send(new ForgotPasswordCommand(request), cancellationToken) });

    [HttpPost("request-otp")]
    [AllowAnonymous]
    public Task<bool> RequestOtp(RequestOtpRequest request, CancellationToken cancellationToken)
        => _mediator.Send(new RequestOtpCommand(request), cancellationToken);

    [HttpPost("verify-otp")]
    [AllowAnonymous]
    public Task<bool> VerifyOtp(VerifyOtpRequest request, CancellationToken cancellationToken)
        => _mediator.Send(new VerifyOtpCommand(request), cancellationToken);

    [HttpPost("reset-password")]
    [AllowAnonymous]
    public Task<bool> ResetPassword(ResetPasswordRequest request, CancellationToken cancellationToken)
        => _mediator.Send(new ResetPasswordCommand(request), cancellationToken);

    [HttpPost("setup")]
    [Authorize(Policy = "SuperAdminOnly")]
    public Task<ShopDto> SetupShop(ShopSetupRequest request, CancellationToken cancellationToken)
        => _mediator.Send(new SetupShopCommand(GetCurrentUserId(), request), cancellationToken);

    [HttpPost("{userId:guid}/2fa/setup")]
    [Authorize]
    public Task<TwoFactorSetupResponse> Enable2Fa(Guid userId, CancellationToken cancellationToken)
        => _mediator.Send(new EnableTwoFactorCommand(userId), cancellationToken);

    [HttpPost("{userId:guid}/2fa/verify")]
    [Authorize]
    public Task<bool> Verify2Fa(Guid userId, [FromBody] string code, CancellationToken cancellationToken)
        => _mediator.Send(new VerifyTwoFactorCommand(userId, code), cancellationToken);

    [HttpPost("change-password/{userId:guid}")]
    [Authorize]
    public Task<bool> ChangePassword(Guid userId, ChangePasswordRequest request, CancellationToken cancellationToken)
        => _mediator.Send(new ChangePasswordCommand(userId, request), cancellationToken);

    [HttpPost("logout")]
    [Authorize]
    public async Task<bool> Logout([FromBody] LogoutRequest? request, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new LogoutCommand(request ?? new LogoutRequest(GetCurrentUserId())), cancellationToken);
        Response.Cookies.Delete("billease.refresh", BuildCookieOptions(DateTimeOffset.UtcNow.AddDays(-1)));
        return result;
    }

    private AuthResponse WithRefreshCookie(AuthResponse response)
    {
        if (!string.IsNullOrWhiteSpace(response.RefreshToken))
            Response.Cookies.Append("billease.refresh", response.RefreshToken, BuildCookieOptions(DateTimeOffset.UtcNow.AddDays(7)));

        return response with { RefreshToken = null };
    }

    private CookieOptions BuildCookieOptions(DateTimeOffset expires)
        => new()
        {
            HttpOnly = true,
            Secure = !_environment.IsDevelopment(),
            SameSite = _environment.IsDevelopment() ? SameSiteMode.Lax : SameSiteMode.None,
            Expires = expires,
            Path = "/api"
        };

    private Guid GetCurrentUserId()
    {
        var id = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("userId");
        return Guid.TryParse(id, out var userId) ? userId : throw new UnauthorizedAccessException("Invalid user context.");
    }
}
