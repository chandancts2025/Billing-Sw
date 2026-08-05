using System.Security.Cryptography;
using System.Text;
using Konscious.Security.Cryptography;

namespace BillEasePro.Infrastructure.Security;

public static class PasswordHashing
{
    private const int Pbkdf2Iterations = 100_000;
    private const int KeySize = 32;
    private const int Argon2MemorySizeKb = 64 * 1024;
    private const int Argon2Iterations = 3;
    private const int Argon2Parallelism = 2;

    public static string Hash(string password)
    {
        var saltBytes = RandomNumberGenerator.GetBytes(16);
        return HashArgon2id(password, saltBytes);
    }

    public static string Hash(string password, string salt)
    {
        var saltBytes = Convert.FromBase64String(NormalizeSalt(salt));
        return HashArgon2id(password, saltBytes);
    }

    public static bool Verify(string password, string storedHash)
        => storedHash.StartsWith("$argon2id$", StringComparison.Ordinal)
            ? VerifyArgon2id(password, storedHash)
            : VerifyFallback(password, storedHash);

    public static bool NeedsRehash(string storedHash)
        => !storedHash.StartsWith("$argon2id$", StringComparison.Ordinal);

    private static string HashArgon2id(string password, byte[] saltBytes)
    {
        var argon2 = new Argon2id(Encoding.UTF8.GetBytes(password))
        {
            Salt = saltBytes,
            MemorySize = Argon2MemorySizeKb,
            Iterations = Argon2Iterations,
            DegreeOfParallelism = Argon2Parallelism
        };

        var hash = argon2.GetBytes(KeySize);
        return string.Join(
            "$",
            "$argon2id",
            "v=19",
            $"m={Argon2MemorySizeKb},t={Argon2Iterations},p={Argon2Parallelism}",
            Convert.ToBase64String(saltBytes),
            Convert.ToBase64String(hash));
    }

    private static bool VerifyArgon2id(string password, string storedHash)
    {
        var parts = storedHash.Split('$', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length != 5 || parts[0] != "argon2id") return false;

        var parameters = parts[2].Split(',');
        var memory = int.Parse(parameters[0].Split('=')[1]);
        var iterations = int.Parse(parameters[1].Split('=')[1]);
        var parallelism = int.Parse(parameters[2].Split('=')[1]);
        var salt = Convert.FromBase64String(parts[3]);
        var expected = Convert.FromBase64String(parts[4]);

        var argon2 = new Argon2id(Encoding.UTF8.GetBytes(password))
        {
            Salt = salt,
            MemorySize = memory,
            Iterations = iterations,
            DegreeOfParallelism = parallelism
        };

        var actual = argon2.GetBytes(expected.Length);
        return CryptographicOperations.FixedTimeEquals(actual, expected);
    }

    private static bool VerifyFallback(string password, string storedHash)
    {
        if (storedHash.StartsWith("$2", StringComparison.Ordinal))
            return BCrypt.Net.BCrypt.Verify(password, storedHash);

        return VerifyPbkdf2(password, storedHash);
    }

    private static bool VerifyPbkdf2(string password, string storedHash)
    {
        var parts = storedHash.Split('$');
        if (parts.Length != 4 || parts[0] != "v1") return false;
        var iterations = int.Parse(parts[1]);
        var saltBytes = Convert.FromBase64String(parts[2]);
        var expected = Convert.FromBase64String(parts[3]);
        using var pbkdf2 = new Rfc2898DeriveBytes(password, saltBytes, iterations, HashAlgorithmName.SHA256);
        var actual = pbkdf2.GetBytes(expected.Length);
        return CryptographicOperations.FixedTimeEquals(actual, expected);
    }

    private static string NormalizeSalt(string salt)
    {
        try
        {
            Convert.FromBase64String(salt);
            return salt;
        }
        catch (FormatException)
        {
            return Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(salt.PadRight(16)[..16]));
        }
    }
}
