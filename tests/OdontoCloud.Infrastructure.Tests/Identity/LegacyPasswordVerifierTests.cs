using Microsoft.AspNetCore.Identity;
using OdontoCloud.Domain.Entities;
using OdontoCloud.Domain.Enums;
using OdontoCloud.Infrastructure.Identity;

namespace OdontoCloud.Infrastructure.Tests.Identity;

public sealed class LegacyPasswordVerifierTests
{
    [Fact]
    public void DeveAceitarSenhaEmTextoClaroParaCompatibilidadeComSeed()
    {
        var usuario = new Usuario(
            Guid.NewGuid(),
            "Admin Seed",
            "admin@clinicasorrir.com.br",
            "123",
            PerfilUsuario.Admin);

        var verifier = new LegacyPasswordVerifier(new PasswordHasher<Usuario>());

        Assert.True(verifier.Verify(usuario, "123"));
        Assert.False(verifier.Verify(usuario, "321"));
        Assert.False(verifier.IsHashed(usuario.PasswordHash));
    }

    [Fact]
    public void DeveAceitarSenhaComHashDaInfraestrutura()
    {
        var usuario = new Usuario(
            Guid.NewGuid(),
            "Admin",
            "admin@example.com",
            "hash",
            PerfilUsuario.Admin);
        var passwordHasher = new PasswordHasher<Usuario>();
        var hashedPassword = passwordHasher.HashPassword(usuario, "123");
        var usuarioComHash = new Usuario(
            Guid.NewGuid(),
            "Admin",
            "admin@example.com",
            hashedPassword,
            PerfilUsuario.Admin);
        var verifier = new LegacyPasswordVerifier(new PasswordHasher<Usuario>());

        Assert.True(verifier.IsHashed(usuarioComHash.PasswordHash));
        Assert.True(verifier.Verify(usuarioComHash, "123"));
    }
}
