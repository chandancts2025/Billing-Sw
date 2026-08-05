using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using BillEasePro.Application.Abstractions;
using BillEasePro.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;

namespace BillEasePro.Infrastructure.Services;

public sealed class SecurePasswordHasher : IPasswordHasher
{
    public string Hash(string password) => Security.PasswordHashing.Hash(password);
    public bool Verify(string password, string hash) => Security.PasswordHashing.Verify(password, hash);
    public bool NeedsRehash(string hash) => Security.PasswordHashing.NeedsRehash(hash);
}

public sealed class JwtTokenService : IJwtTokenService
{
    private readonly IConfiguration _configuration;

    public JwtTokenService(IConfiguration configuration) => _configuration = configuration;

    public string CreateAccessToken(AppUser user)
    {
        var key = JwtRsaKeyProvider.GetSigningKey(_configuration);
        var credentials = new SigningCredentials(key, SecurityAlgorithms.RsaSha256);
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.FullName),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim("userId", user.Id.ToString()),
            new Claim("shopId", user.ShopId.ToString()),
            new Claim("role", user.Role.ToString()),
            new Claim("email", user.Email),
            new Claim("shopType", user.Shop?.IndustryType.ToString() ?? string.Empty)
        };

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(int.Parse(_configuration["Jwt:AccessTokenMinutes"] ?? "15")),
            signingCredentials: credentials);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string CreateRefreshToken() => Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));

    public string HashRefreshToken(string refreshToken)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(refreshToken));
        return Convert.ToHexString(hash);
    }
}

public static class JwtRsaKeyProvider
{
    private static readonly Lazy<RSA> DevelopmentKey = new(() =>
    {
        var rsa = RSA.Create(2048);
        return rsa;
    });

    public static RsaSecurityKey GetSigningKey(IConfiguration configuration)
    {
        var rsa = RSA.Create();
        var privateKey = GetConfiguredKey(configuration, "Jwt:PrivateKeyPem", "BILLEASE_JWT_PRIVATE_KEY_PEM");
        if (string.IsNullOrWhiteSpace(privateKey))
            return new RsaSecurityKey(DevelopmentKey.Value) { KeyId = "billease-dev-rsa" };

        rsa.ImportFromPem(privateKey);
        return new RsaSecurityKey(rsa) { KeyId = "billease-rsa" };
    }

    public static RsaSecurityKey GetValidationKey(IConfiguration configuration)
    {
        var rsa = RSA.Create();
        var publicKey = GetConfiguredKey(configuration, "Jwt:PublicKeyPem", "BILLEASE_JWT_PUBLIC_KEY_PEM");
        var privateKey = GetConfiguredKey(configuration, "Jwt:PrivateKeyPem", "BILLEASE_JWT_PRIVATE_KEY_PEM");
        var key = string.IsNullOrWhiteSpace(publicKey) ? privateKey : publicKey;

        if (string.IsNullOrWhiteSpace(key))
            return new RsaSecurityKey(DevelopmentKey.Value) { KeyId = "billease-dev-rsa" };

        rsa.ImportFromPem(key);
        return new RsaSecurityKey(rsa) { KeyId = "billease-rsa" };
    }

    private static string? GetConfiguredKey(IConfiguration configuration, string configKey, string environmentKey)
    {
        var value = configuration[configKey] ?? Environment.GetEnvironmentVariable(environmentKey);
        return value?.Replace("\\n", "\n", StringComparison.Ordinal);
    }
}

public sealed class TotpService : ITotpService
{
    public string CreateSecret() => Base32Encode(RandomNumberGenerator.GetBytes(20));

    public string BuildProvisioningUri(string issuer, string email, string secret)
        => $"otpauth://totp/{Uri.EscapeDataString(issuer)}:{Uri.EscapeDataString(email)}?secret={secret}&issuer={Uri.EscapeDataString(issuer)}&digits=6&period=30";

    public bool Verify(string secret, string code)
    {
        if (string.IsNullOrWhiteSpace(code)) return false;
        var timestep = DateTimeOffset.UtcNow.ToUnixTimeSeconds() / 30;
        return Enumerable.Range(-1, 3).Any(offset => GenerateCode(secret, timestep + offset) == code);
    }

    private static string GenerateCode(string secret, long timestep)
    {
        var key = Base32Decode(secret);
        var counter = BitConverter.GetBytes(System.Net.IPAddress.HostToNetworkOrder(timestep));
        using var hmac = new HMACSHA1(key);
        var hash = hmac.ComputeHash(counter);
        var offset = hash[^1] & 0x0f;
        var binary = ((hash[offset] & 0x7f) << 24) | ((hash[offset + 1] & 0xff) << 16) | ((hash[offset + 2] & 0xff) << 8) | (hash[offset + 3] & 0xff);
        return (binary % 1_000_000).ToString("D6");
    }

    private static string Base32Encode(byte[] data)
    {
        const string alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
        var output = new StringBuilder();
        var bits = 0;
        var value = 0;
        foreach (var b in data)
        {
            value = (value << 8) | b;
            bits += 8;
            while (bits >= 5)
            {
                output.Append(alphabet[(value >> (bits - 5)) & 31]);
                bits -= 5;
            }
        }
        if (bits > 0) output.Append(alphabet[(value << (5 - bits)) & 31]);
        return output.ToString();
    }

    private static byte[] Base32Decode(string input)
    {
        const string alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
        var bytes = new List<byte>();
        var bits = 0;
        var value = 0;
        foreach (var c in input.TrimEnd('=').ToUpperInvariant())
        {
            var index = alphabet.IndexOf(c);
            if (index < 0) continue;
            value = (value << 5) | index;
            bits += 5;
            if (bits >= 8)
            {
                bytes.Add((byte)((value >> (bits - 8)) & 255));
                bits -= 8;
            }
        }
        return bytes.ToArray();
    }
}

public sealed class LoggingOtpDeliveryService : IOtpDeliveryService
{
    private readonly ILogger<LoggingOtpDeliveryService> _logger;

    public LoggingOtpDeliveryService(ILogger<LoggingOtpDeliveryService> logger) => _logger = logger;

    public Task SendAsync(string destination, string code, string purpose, CancellationToken cancellationToken)
    {
        _logger.LogInformation("OTP for {Purpose} to {Destination}: {Code}", purpose, destination, code);
        return Task.CompletedTask;
    }
}
