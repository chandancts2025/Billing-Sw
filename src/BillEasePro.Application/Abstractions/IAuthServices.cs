using BillEasePro.Domain.Entities;

namespace BillEasePro.Application.Abstractions;

public interface IPasswordHasher
{
    string Hash(string password);
    bool Verify(string password, string hash);
    bool NeedsRehash(string hash);
}

public interface IJwtTokenService
{
    string CreateAccessToken(AppUser user);
    string CreateRefreshToken();
    string HashRefreshToken(string refreshToken);
}

public interface ITotpService
{
    string CreateSecret();
    string BuildProvisioningUri(string issuer, string email, string secret);
    bool Verify(string secret, string code);
}

public interface IOtpDeliveryService
{
    Task SendAsync(string destination, string code, string purpose, CancellationToken cancellationToken);
}
