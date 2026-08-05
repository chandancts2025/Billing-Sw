using System.Security.Cryptography;
using System.Text;
using AutoMapper;
using BillEasePro.Application.Abstractions;
using BillEasePro.Application.Dtos;
using BillEasePro.Domain.Entities;
using BillEasePro.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace BillEasePro.Application.Features.Auth;

public sealed class RegisterCommandHandler : IRequestHandler<RegisterCommand, AuthResponse>
{
    private readonly IRepository<AppUser> _users;
    private readonly IRepository<Shop> _shops;
    private readonly IRepository<RefreshToken> _refreshTokens;
    private readonly IRepository<UserOtp> _otps;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IOtpDeliveryService _otpDeliveryService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public RegisterCommandHandler(
        IRepository<AppUser> users,
        IRepository<Shop> shops,
        IRepository<RefreshToken> refreshTokens,
        IRepository<UserOtp> otps,
        IPasswordHasher passwordHasher,
        IJwtTokenService jwtTokenService,
        IOtpDeliveryService otpDeliveryService,
        IUnitOfWork unitOfWork,
        IMapper mapper)
    {
        _users = users;
        _shops = shops;
        _refreshTokens = refreshTokens;
        _otps = otps;
        _passwordHasher = passwordHasher;
        _jwtTokenService = jwtTokenService;
        _otpDeliveryService = otpDeliveryService;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<AuthResponse> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        var email = request.Request.Email.Trim().ToLowerInvariant();
        if (await _users.ExistsAsync(x => x.Email == email, cancellationToken))
            throw new InvalidOperationException("Email is already registered.");

        var isFirstUser = !await _users.Query().AnyAsync(cancellationToken);
        var shop = request.Request.ShopId is { } shopId
            ? await _shops.GetByIdAsync(shopId, cancellationToken) ?? throw new KeyNotFoundException("Shop not found.")
            : new Shop
            {
                Name = "Pending Shop Setup",
                LegalName = "Pending Shop Setup",
                AddressLine1 = request.Request.Address.Line1,
                City = request.Request.Address.City,
                State = request.Request.Address.State,
                PostalCode = request.Request.Address.Pincode,
                Country = request.Request.Address.Country,
                Phone = request.Request.Phone ?? string.Empty,
                Email = email
            };

        var user = new AppUser
        {
            ShopId = shop.Id,
            Shop = shop,
            FullName = request.Request.FullName.Trim(),
            Email = email,
            Phone = request.Request.Phone,
            DateOfBirth = request.Request.Dob,
            Gender = request.Request.Gender,
            AddressLine1 = request.Request.Address.Line1,
            City = request.Request.Address.City,
            State = request.Request.Address.State,
            Pincode = request.Request.Address.Pincode,
            Country = request.Request.Address.Country,
            Role = isFirstUser ? UserRole.SuperAdmin : ResolveInviteRole(request.Request.InviteCode),
            PasswordHash = _passwordHasher.Hash(request.Request.Password),
            IsActive = true
        };

        if (request.Request.ShopId is null)
            await _shops.AddAsync(shop, cancellationToken);

        await _users.AddAsync(user, cancellationToken);
        await AddOtpAsync(user.Id, email, OtpPurpose.EmailVerification, cancellationToken);

        var refresh = CreateRefreshToken(user.Id, rememberMe: false);
        await _refreshTokens.AddAsync(refresh.Entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new AuthResponse(
            _jwtTokenService.CreateAccessToken(user),
            refresh.PlainText,
            DateTimeOffset.UtcNow.AddMinutes(15),
            _mapper.Map<UserDto>(user),
            isFirstUser);
    }

    private static UserRole ResolveInviteRole(string? inviteCode)
        => string.Equals(inviteCode, "ADMIN", StringComparison.OrdinalIgnoreCase) ? UserRole.Admin : UserRole.Operator;

    private async Task AddOtpAsync(Guid userId, string destination, OtpPurpose purpose, CancellationToken cancellationToken)
    {
        var code = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");
        await _otps.AddAsync(new UserOtp
        {
            AppUserId = userId,
            Purpose = purpose,
            CodeHash = HashOtp(code),
            ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(10)
        }, cancellationToken);
        await _otpDeliveryService.SendAsync(destination, code, purpose.ToString(), cancellationToken);
    }

    private (RefreshToken Entity, string PlainText) CreateRefreshToken(Guid userId, bool rememberMe)
    {
        var token = _jwtTokenService.CreateRefreshToken();
        return (new RefreshToken
        {
            AppUserId = userId,
            TokenHash = _jwtTokenService.HashRefreshToken(token),
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(7),
            IsRemembered = rememberMe
        }, token);
    }

    private static string HashOtp(string code)
        => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(code)));
}

public sealed class LoginCommandHandler : IRequestHandler<LoginCommand, AuthResponse>
{
    private readonly IRepository<AppUser> _users;
    private readonly IRepository<RefreshToken> _refreshTokens;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly ITotpService _totpService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IConfiguration _configuration;

    public LoginCommandHandler(
        IRepository<AppUser> users,
        IRepository<RefreshToken> refreshTokens,
        IPasswordHasher passwordHasher,
        IJwtTokenService jwtTokenService,
        ITotpService totpService,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IConfiguration configuration)
    {
        _users = users;
        _refreshTokens = refreshTokens;
        _passwordHasher = passwordHasher;
        _jwtTokenService = jwtTokenService;
        _totpService = totpService;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _configuration = configuration;
    }

    public async Task<AuthResponse> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var email = request.Request.Email.Trim().ToLowerInvariant();
        var user = await _users.Query().Include(x => x.Shop).FirstOrDefaultAsync(x => x.Email == email, cancellationToken)
            ?? throw new UnauthorizedAccessException("Invalid credentials.");

        if (!user.IsActive)
            throw new UnauthorizedAccessException("Account is disabled.");

        if (user.LockoutEnd is { } lockoutEnd && lockoutEnd > DateTimeOffset.UtcNow)
            throw new UnauthorizedAccessException("Account is locked. Try again later.");

        if (!_passwordHasher.Verify(request.Request.Password, user.PasswordHash))
        {
            user.FailedLoginAttempts += 1;
            if (user.FailedLoginAttempts >= 5)
            {
                user.LockoutEnd = DateTimeOffset.UtcNow.AddMinutes(15);
                user.FailedLoginAttempts = 0;
            }
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            throw new UnauthorizedAccessException("Invalid credentials.");
        }

        if (user.TwoFactorEnabled && (string.IsNullOrWhiteSpace(request.Request.TwoFactorCode) || !_totpService.Verify(user.TwoFactorSecret!, request.Request.TwoFactorCode)))
            throw new UnauthorizedAccessException("Two-factor code is required.");

        if (_passwordHasher.NeedsRehash(user.PasswordHash))
            user.PasswordHash = _passwordHasher.Hash(request.Request.Password);

        user.FailedLoginAttempts = 0;
        user.LockoutEnd = null;
        user.LastLoginAt = DateTimeOffset.UtcNow;

        if (user.Role == UserRole.Operator && PreventMultipleOperatorSessions())
        {
            var activeTokens = await _refreshTokens.Query()
                .Where(x => x.AppUserId == user.Id && x.RevokedAt == null && x.ExpiresAt > DateTimeOffset.UtcNow)
                .ToListAsync(cancellationToken);
            foreach (var token in activeTokens)
                token.RevokedAt = DateTimeOffset.UtcNow;
        }

        var refreshToken = _jwtTokenService.CreateRefreshToken();
        await _refreshTokens.AddAsync(new RefreshToken
        {
            AppUserId = user.Id,
            TokenHash = _jwtTokenService.HashRefreshToken(refreshToken),
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(7),
            IsRemembered = request.Request.RememberMe
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return new AuthResponse(
            _jwtTokenService.CreateAccessToken(user),
            refreshToken,
            DateTimeOffset.UtcNow.AddMinutes(15),
            _mapper.Map<UserDto>(user),
            user.Role == UserRole.SuperAdmin && user.Shop?.Name == "Pending Shop Setup");
    }

    private bool PreventMultipleOperatorSessions()
        => !bool.TryParse(_configuration["Security:PreventMultipleOperatorSessions"], out var configured) || configured;
}

public sealed class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, AuthResponse>
{
    private readonly IRepository<RefreshToken> _tokens;
    private readonly IRepository<AppUser> _users;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public RefreshTokenCommandHandler(IRepository<RefreshToken> tokens, IRepository<AppUser> users, IJwtTokenService jwtTokenService, IUnitOfWork unitOfWork, IMapper mapper)
    {
        _tokens = tokens;
        _users = users;
        _jwtTokenService = jwtTokenService;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<AuthResponse> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Request.RefreshToken))
            throw new UnauthorizedAccessException("Missing refresh token.");

        var tokenHash = _jwtTokenService.HashRefreshToken(request.Request.RefreshToken);
        var stored = await _tokens.Query().FirstOrDefaultAsync(x => x.TokenHash == tokenHash, cancellationToken)
            ?? throw new UnauthorizedAccessException("Invalid refresh token.");

        if (stored.RevokedAt is not null || stored.ExpiresAt <= DateTimeOffset.UtcNow)
            throw new UnauthorizedAccessException("Invalid refresh token.");

        var user = await _users.Query().Include(x => x.Shop).FirstOrDefaultAsync(x => x.Id == stored.AppUserId, cancellationToken)
            ?? throw new UnauthorizedAccessException("Invalid refresh token.");

        var replacement = _jwtTokenService.CreateRefreshToken();
        stored.RevokedAt = DateTimeOffset.UtcNow;
        stored.ReplacedByTokenHash = _jwtTokenService.HashRefreshToken(replacement);

        await _tokens.AddAsync(new RefreshToken
        {
            AppUserId = user.Id,
            TokenHash = stored.ReplacedByTokenHash,
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(7),
            IsRemembered = stored.IsRemembered
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return new AuthResponse(
            _jwtTokenService.CreateAccessToken(user),
            replacement,
            DateTimeOffset.UtcNow.AddMinutes(15),
            _mapper.Map<UserDto>(user),
            user.Role == UserRole.SuperAdmin && user.Shop?.Name == "Pending Shop Setup");
    }
}

public sealed class ForgotPasswordCommandHandler : IRequestHandler<ForgotPasswordCommand, string>
{
    private readonly IRepository<AppUser> _users;
    private readonly IRepository<UserOtp> _otps;
    private readonly IOtpDeliveryService _otpDeliveryService;
    private readonly IUnitOfWork _unitOfWork;

    public ForgotPasswordCommandHandler(IRepository<AppUser> users, IRepository<UserOtp> otps, IOtpDeliveryService otpDeliveryService, IUnitOfWork unitOfWork)
    {
        _users = users;
        _otps = otps;
        _otpDeliveryService = otpDeliveryService;
        _unitOfWork = unitOfWork;
    }

    public async Task<string> Handle(ForgotPasswordCommand request, CancellationToken cancellationToken)
    {
        var user = await _users.Query().FirstOrDefaultAsync(x => x.Email == request.Request.Email.Trim().ToLowerInvariant(), cancellationToken);
        if (user is null) return "If the email exists, a reset OTP has been sent.";

        var code = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");
        await _otps.AddAsync(new UserOtp
        {
            AppUserId = user.Id,
            Purpose = OtpPurpose.PasswordReset,
            CodeHash = HashOtp(code),
            ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(10)
        }, cancellationToken);
        await _otpDeliveryService.SendAsync(user.Email, code, OtpPurpose.PasswordReset.ToString(), cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return "If the email exists, a reset OTP has been sent.";
    }

    private static string HashOtp(string code)
        => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(code)));
}

public sealed class VerifyOtpCommandHandler : IRequestHandler<VerifyOtpCommand, bool>
{
    private readonly IRepository<AppUser> _users;
    private readonly IRepository<UserOtp> _otps;
    private readonly IUnitOfWork _unitOfWork;

    public VerifyOtpCommandHandler(IRepository<AppUser> users, IRepository<UserOtp> otps, IUnitOfWork unitOfWork)
    {
        _users = users;
        _otps = otps;
        _unitOfWork = unitOfWork;
    }

    public async Task<bool> Handle(VerifyOtpCommand request, CancellationToken cancellationToken)
    {
        var user = await _users.Query().FirstOrDefaultAsync(x => x.Email == request.Request.Email.Trim().ToLowerInvariant(), cancellationToken);
        if (user is null) return false;

        var otp = await _otps.Query()
            .Where(x => x.AppUserId == user.Id && x.Purpose == request.Request.Purpose && x.ConsumedAt == null && x.ExpiresAt > DateTimeOffset.UtcNow)
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (otp is null) return false;

        otp.AttemptCount += 1;
        var valid = otp.AttemptCount <= 5 && otp.CodeHash == HashOtp(request.Request.Code);
        if (valid)
        {
            otp.ConsumedAt = DateTimeOffset.UtcNow;
            if (request.Request.Purpose == OtpPurpose.EmailVerification) user.EmailVerified = true;
            if (request.Request.Purpose == OtpPurpose.PhoneVerification) user.PhoneVerified = true;
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return valid;
    }

    private static string HashOtp(string code)
        => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(code)));
}

public sealed class RequestOtpCommandHandler : IRequestHandler<RequestOtpCommand, bool>
{
    private readonly IRepository<AppUser> _users;
    private readonly IRepository<UserOtp> _otps;
    private readonly IOtpDeliveryService _otpDeliveryService;
    private readonly IUnitOfWork _unitOfWork;

    public RequestOtpCommandHandler(IRepository<AppUser> users, IRepository<UserOtp> otps, IOtpDeliveryService otpDeliveryService, IUnitOfWork unitOfWork)
    {
        _users = users;
        _otps = otps;
        _otpDeliveryService = otpDeliveryService;
        _unitOfWork = unitOfWork;
    }

    public async Task<bool> Handle(RequestOtpCommand request, CancellationToken cancellationToken)
    {
        var user = await _users.Query().FirstOrDefaultAsync(x => x.Email == request.Request.Email.Trim().ToLowerInvariant(), cancellationToken);
        if (user is null) return false;

        var code = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");
        await _otps.AddAsync(new UserOtp
        {
            AppUserId = user.Id,
            Purpose = request.Request.Purpose,
            CodeHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(code))),
            ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(10)
        }, cancellationToken);
        var destination = request.Request.Purpose == OtpPurpose.PhoneVerification && !string.IsNullOrWhiteSpace(user.Phone)
            ? user.Phone
            : user.Email;
        await _otpDeliveryService.SendAsync(destination, code, request.Request.Purpose.ToString(), cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }
}

public sealed class ResetPasswordCommandHandler : IRequestHandler<ResetPasswordCommand, bool>
{
    private readonly IRepository<AppUser> _users;
    private readonly IRepository<UserOtp> _otps;
    private readonly IRepository<RefreshToken> _tokens;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IUnitOfWork _unitOfWork;

    public ResetPasswordCommandHandler(IRepository<AppUser> users, IRepository<UserOtp> otps, IRepository<RefreshToken> tokens, IPasswordHasher passwordHasher, IUnitOfWork unitOfWork)
    {
        _users = users;
        _otps = otps;
        _tokens = tokens;
        _passwordHasher = passwordHasher;
        _unitOfWork = unitOfWork;
    }

    public async Task<bool> Handle(ResetPasswordCommand request, CancellationToken cancellationToken)
    {
        var user = await _users.Query().FirstOrDefaultAsync(x => x.Email == request.Request.Email.Trim().ToLowerInvariant(), cancellationToken);
        if (user is null) return false;

        var otpHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(request.Request.Otp)));
        var otp = await _otps.Query()
            .Where(x => x.AppUserId == user.Id && x.Purpose == OtpPurpose.PasswordReset && x.ConsumedAt == null && x.ExpiresAt > DateTimeOffset.UtcNow)
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (otp is null || otp.CodeHash != otpHash) return false;

        otp.ConsumedAt = DateTimeOffset.UtcNow;
        user.PasswordHash = _passwordHasher.Hash(request.Request.NewPassword);
        user.FailedLoginAttempts = 0;
        user.LockoutEnd = null;

        var tokens = await _tokens.Query().Where(x => x.AppUserId == user.Id && x.RevokedAt == null).ToListAsync(cancellationToken);
        foreach (var token in tokens)
            token.RevokedAt = DateTimeOffset.UtcNow;

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }
}

public sealed class SetupShopCommandHandler : IRequestHandler<SetupShopCommand, ShopDto>
{
    private readonly IRepository<AppUser> _users;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public SetupShopCommandHandler(IRepository<AppUser> users, IUnitOfWork unitOfWork, IMapper mapper)
    {
        _users = users;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<ShopDto> Handle(SetupShopCommand request, CancellationToken cancellationToken)
    {
        var user = await _users.Query().Include(x => x.Shop).FirstOrDefaultAsync(x => x.Id == request.UserId, cancellationToken)
            ?? throw new KeyNotFoundException("User not found.");

        if (user.Role != UserRole.SuperAdmin || user.Shop is null)
            throw new UnauthorizedAccessException("Only SuperAdmin can configure a shop.");

        user.Shop.Name = request.Request.Name;
        user.Shop.LegalName = request.Request.LegalName;
        user.Shop.IndustryType = request.Request.IndustryType;
        user.Shop.TaxRegime = request.Request.TaxRegime;
        user.Shop.CurrencyCode = request.Request.CurrencyCode;
        user.Shop.TaxRegistrationNumber = request.Request.TaxRegistrationNumber;
        user.Shop.AddressLine1 = request.Request.AddressLine1;
        user.Shop.AddressLine2 = request.Request.AddressLine2;
        user.Shop.City = request.Request.City;
        user.Shop.State = request.Request.State;
        user.Shop.PostalCode = request.Request.PostalCode;
        user.Shop.Country = request.Request.Country;
        user.Shop.Phone = request.Request.Phone;
        user.Shop.Email = request.Request.Email;

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return _mapper.Map<ShopDto>(user.Shop);
    }
}

public sealed class EnableTwoFactorCommandHandler : IRequestHandler<EnableTwoFactorCommand, TwoFactorSetupResponse>
{
    private readonly IRepository<AppUser> _users;
    private readonly ITotpService _totpService;
    private readonly IUnitOfWork _unitOfWork;

    public EnableTwoFactorCommandHandler(IRepository<AppUser> users, ITotpService totpService, IUnitOfWork unitOfWork)
    {
        _users = users;
        _totpService = totpService;
        _unitOfWork = unitOfWork;
    }

    public async Task<TwoFactorSetupResponse> Handle(EnableTwoFactorCommand request, CancellationToken cancellationToken)
    {
        var user = await _users.GetByIdAsync(request.UserId, cancellationToken) ?? throw new KeyNotFoundException("User not found.");
        user.TwoFactorSecret = _totpService.CreateSecret();
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return new TwoFactorSetupResponse(user.TwoFactorSecret, _totpService.BuildProvisioningUri("BillEase Pro", user.Email, user.TwoFactorSecret));
    }
}

public sealed class VerifyTwoFactorCommandHandler : IRequestHandler<VerifyTwoFactorCommand, bool>
{
    private readonly IRepository<AppUser> _users;
    private readonly ITotpService _totpService;
    private readonly IUnitOfWork _unitOfWork;

    public VerifyTwoFactorCommandHandler(IRepository<AppUser> users, ITotpService totpService, IUnitOfWork unitOfWork)
    {
        _users = users;
        _totpService = totpService;
        _unitOfWork = unitOfWork;
    }

    public async Task<bool> Handle(VerifyTwoFactorCommand request, CancellationToken cancellationToken)
    {
        var user = await _users.GetByIdAsync(request.UserId, cancellationToken) ?? throw new KeyNotFoundException("User not found.");
        var valid = !string.IsNullOrWhiteSpace(user.TwoFactorSecret) && _totpService.Verify(user.TwoFactorSecret, request.Code);
        if (valid)
        {
            user.TwoFactorEnabled = true;
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        return valid;
    }
}

public sealed class ChangePasswordCommandHandler : IRequestHandler<ChangePasswordCommand, bool>
{
    private readonly IRepository<AppUser> _users;
    private readonly IRepository<RefreshToken> _tokens;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IUnitOfWork _unitOfWork;

    public ChangePasswordCommandHandler(IRepository<AppUser> users, IRepository<RefreshToken> tokens, IPasswordHasher passwordHasher, IUnitOfWork unitOfWork)
    {
        _users = users;
        _tokens = tokens;
        _passwordHasher = passwordHasher;
        _unitOfWork = unitOfWork;
    }

    public async Task<bool> Handle(ChangePasswordCommand request, CancellationToken cancellationToken)
    {
        var user = await _users.GetByIdAsync(request.UserId, cancellationToken) ?? throw new KeyNotFoundException("User not found.");
        if (!_passwordHasher.Verify(request.Request.CurrentPassword, user.PasswordHash))
            throw new UnauthorizedAccessException("Current password is incorrect.");

        user.PasswordHash = _passwordHasher.Hash(request.Request.NewPassword);
        var tokens = await _tokens.Query().Where(x => x.AppUserId == user.Id && x.RevokedAt == null).ToListAsync(cancellationToken);
        foreach (var token in tokens)
            token.RevokedAt = DateTimeOffset.UtcNow;

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }
}

public sealed class LogoutCommandHandler : IRequestHandler<LogoutCommand, bool>
{
    private readonly IRepository<RefreshToken> _tokens;
    private readonly IUnitOfWork _unitOfWork;

    public LogoutCommandHandler(IRepository<RefreshToken> tokens, IUnitOfWork unitOfWork)
    {
        _tokens = tokens;
        _unitOfWork = unitOfWork;
    }

    public async Task<bool> Handle(LogoutCommand request, CancellationToken cancellationToken)
    {
        var tokens = await _tokens.Query().Where(x => x.AppUserId == request.Request.UserId && x.RevokedAt == null).ToListAsync(cancellationToken);
        foreach (var token in tokens)
            token.RevokedAt = DateTimeOffset.UtcNow;

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }
}
