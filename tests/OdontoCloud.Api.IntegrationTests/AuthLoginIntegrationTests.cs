using System.Collections.Generic;
using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using OdontoCloud.Domain.Entities;
using OdontoCloud.Domain.Enums;
using OdontoCloud.Infrastructure.Data;
using OdontoCloud.Infrastructure.Identity;

namespace OdontoCloud.Api.IntegrationTests;

public sealed class AuthLoginIntegrationTests : IClassFixture<ApiTestFactory>
{
    private readonly ApiTestFactory _factory;
    private const string SenhaPadrao = "123";

    public AuthLoginIntegrationTests(ApiTestFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Login_ComSenhaLegada_DeveGerarTokenEAtualizarHash()
    {
        var senhaHasher = new PasswordHasher<Usuario>();
        var seed = await CriarUsuarioAsync(UsuarioPasswordSource.Legacy, senhaHasher);

        using var client = _factory.CreateClient();
        var response = await client.PostAsJsonAsync(
            "/api/auth/login",
            new { Email = seed.Email, Senha = SenhaPadrao });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var login = await response.Content.ReadFromJsonAsync<LoginResponse>();
        Assert.NotNull(login);
        Assert.False(string.IsNullOrWhiteSpace(login.Token));

        var tokenClaims = ExtrairClaims(login.Token);
        Assert.True(tokenClaims.TryGetValue("ClinicaId", out var clinicaClaim));
        Assert.Equal(seed.ClinicaId, Guid.Parse(clinicaClaim));

        var senhaHashAtual = await ObterSenhaHashUsuarioAsync(seed.UsuarioId, seed.ClinicaId);
        Assert.NotEqual(seed.PasswordHash, senhaHashAtual);
        Assert.True(senhaHasher.VerifyHashedPassword(seed.UsuarioRef, senhaHashAtual, SenhaPadrao) is PasswordVerificationResult.Success or PasswordVerificationResult.SuccessRehashNeeded);
    }

    [Fact]
    public async Task Login_ComSenhaHasheada_DeveManterHashSemMigrar()
    {
        var senhaHasher = new PasswordHasher<Usuario>();
        var seed = await CriarUsuarioAsync(UsuarioPasswordSource.Hashed, senhaHasher);

        using var client = _factory.CreateClient();
        var response = await client.PostAsJsonAsync(
            "/api/auth/login",
            new { Email = seed.Email, Senha = SenhaPadrao });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var login = await response.Content.ReadFromJsonAsync<LoginResponse>();
        Assert.NotNull(login);
        Assert.False(string.IsNullOrWhiteSpace(login.Token));

        var senhaHashAtual = await ObterSenhaHashUsuarioAsync(seed.UsuarioId, seed.ClinicaId);
        Assert.Equal(seed.PasswordHash, senhaHashAtual);
        Assert.True(senhaHasher.VerifyHashedPassword(seed.UsuarioRef, senhaHashAtual, SenhaPadrao) is PasswordVerificationResult.Success or PasswordVerificationResult.SuccessRehashNeeded);
    }

    [Fact]
    public async Task Login_ComSenhaInvalidaNaoDeveMigrarSenha()
    {
        var senhaHasher = new PasswordHasher<Usuario>();
        var seed = await CriarUsuarioAsync(UsuarioPasswordSource.Legacy, senhaHasher);

        using var client = _factory.CreateClient();
        var response = await client.PostAsJsonAsync(
            "/api/auth/login",
            new { Email = seed.Email, Senha = "senha-errada" });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);

        var senhaHashAtual = await ObterSenhaHashUsuarioAsync(seed.UsuarioId, seed.ClinicaId);
        Assert.Equal(seed.PasswordHash, senhaHashAtual);
    }

    private async Task<TenantUsuarioSeed> CriarUsuarioAsync(
        UsuarioPasswordSource passwordSource,
        PasswordHasher<Usuario> passwordHasher)
    {
        using var escopo = _factory.Services.CreateScope();
        var dbContext = escopo.ServiceProvider.GetRequiredService<OdontoCloudDbContext>();
        var contextAccessor = escopo.ServiceProvider.GetRequiredService<IHttpContextAccessor>();

        var clinica = new Clinica($"Clínica Login Teste {Guid.NewGuid():N}", "Pro");
        var email = $"login-{Guid.NewGuid():N}@odontocloud.local";
        var usuario = new Usuario(clinica.Id, "Usuario Login", email, "temp", PerfilUsuario.Admin);
        usuario.AtualizarSenhaHash(ObterSenhaInicial(passwordSource, usuario, passwordHasher, SenhaPadrao));

        contextAccessor.HttpContext = CriaHttpContext(Guid.NewGuid());
        dbContext.Clinicas.Add(clinica);
        await dbContext.SaveChangesAsync();

        contextAccessor.HttpContext = CriaHttpContext(clinica.Id);
        try
        {
            dbContext.Usuarios.Add(usuario);
            await dbContext.SaveChangesAsync();
        }
        finally
        {
            contextAccessor.HttpContext = null;
        }

        return new TenantUsuarioSeed(clinica.Id, usuario.Id, email, usuario.PasswordHash, usuario);
    }

    private static string ObterSenhaInicial(
        UsuarioPasswordSource source,
        Usuario usuario,
        PasswordHasher<Usuario> passwordHasher,
        string senha)
    {
        return source == UsuarioPasswordSource.Hashed
            ? passwordHasher.HashPassword(usuario, senha)
            : senha;
    }

    private static DefaultHttpContext CriaHttpContext(Guid clinicaId)
    {
        return new DefaultHttpContext
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(AuthClaims.ClinicaId, clinicaId.ToString()),
                new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString())
            }, "IntegrationTests"))
        };
    }

    private async Task<string> ObterSenhaHashUsuarioAsync(Guid usuarioId, Guid clinicaId)
    {
        using var escopo = _factory.Services.CreateScope();
        var dbContext = escopo.ServiceProvider.GetRequiredService<OdontoCloudDbContext>();

        var usuario = await dbContext.Usuarios
            .IgnoreQueryFilters()
            .FirstAsync(u => u.Id == usuarioId && u.ClinicaId == clinicaId);

        return usuario.PasswordHash;
    }

    private static Dictionary<string, string> ExtrairClaims(string token)
    {
        var parts = token.Split('.');
        var payload = parts.Length > 1 ? parts[1] : throw new ArgumentException("Token inválido");
        payload = payload.Replace('-', '+').Replace('_', '/');
        payload = payload.PadRight(payload.Length + (4 - payload.Length % 4) % 4, '=');

        var payloadJson = Encoding.UTF8.GetString(Convert.FromBase64String(payload));
        using var doc = JsonDocument.Parse(payloadJson);

        var claims = new Dictionary<string, string>(StringComparer.Ordinal);
        foreach (var element in doc.RootElement.EnumerateObject())
        {
            claims[element.Name] = element.Value.ValueKind switch
            {
                JsonValueKind.String => element.Value.GetString() ?? string.Empty,
                JsonValueKind.True or JsonValueKind.False => element.Value.GetBoolean().ToString(),
                _ => element.Value.ToString()
            };
        }

        return claims;
    }

    private record TenantUsuarioSeed(
        Guid ClinicaId,
        Guid UsuarioId,
        string Email,
        string PasswordHash,
        Usuario UsuarioRef);

    private enum UsuarioPasswordSource
    {
        Legacy,
        Hashed
    }

    private sealed record LoginResponse(string Token);
}
