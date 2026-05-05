using Microsoft.AspNetCore.Identity;
using OdontoCloud.Application.Interfaces;
using OdontoCloud.Domain.Entities;

namespace OdontoCloud.Infrastructure.Identity;

public sealed class LegacyPasswordVerifier : IPasswordVerifier
{
    private readonly IPasswordHasher<Usuario> _passwordHasher;

    public LegacyPasswordVerifier(IPasswordHasher<Usuario> passwordHasher)
    {
        _passwordHasher = passwordHasher;
    }

    public bool Verify(Usuario usuario, string plainPassword)
    {
        if (string.IsNullOrWhiteSpace(plainPassword) || string.IsNullOrWhiteSpace(usuario.PasswordHash))
        {
            return false;
        }

        if (IsHashed(usuario.PasswordHash))
        {
            var verificationResult = _passwordHasher.VerifyHashedPassword(usuario, usuario.PasswordHash, plainPassword);
            return verificationResult is PasswordVerificationResult.Success or PasswordVerificationResult.SuccessRehashNeeded;
        }

        return string.Equals(usuario.PasswordHash, plainPassword, StringComparison.Ordinal);
    }

    public bool IsHashed(string passwordValue)
    {
        return !string.IsNullOrWhiteSpace(passwordValue) && passwordValue.StartsWith("AQAAAA", StringComparison.Ordinal);
    }

    public string HashPassword(Usuario usuario, string plainPassword)
    {
        return _passwordHasher.HashPassword(usuario, plainPassword);
    }
}
