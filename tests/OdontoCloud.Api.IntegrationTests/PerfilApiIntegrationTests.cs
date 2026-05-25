using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using OdontoCloud.Domain.Entities;
using OdontoCloud.Domain.Enums;
using OdontoCloud.Infrastructure.Data;
using OdontoCloud.Infrastructure.Identity;

namespace OdontoCloud.Api.IntegrationTests;

public sealed class PerfilApiIntegrationTests : IClassFixture<ApiTestFactory>
{
    private readonly ApiTestFactory _factory;

    public PerfilApiIntegrationTests(ApiTestFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task GetPerfilMe_SemToken_DeveRetornar401()
    {
        using var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/perfil/me");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetPerfilMe_ComToken_DeveRetornarDadosSemPasswordHash()
    {
        var tenant = await CriarTenantEUsuarioAsync();
        using var client = CriarClienteAutenticado(tenant.token);

        var response = await client.GetAsync("/api/perfil/me");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var raw = await response.Content.ReadAsStringAsync();
        Assert.DoesNotContain("PasswordHash", raw, StringComparison.OrdinalIgnoreCase);

        var perfil = await response.Content.ReadFromJsonAsync<PerfilResponse>();
        Assert.NotNull(perfil);
        Assert.Equal(tenant.Usuario.Id, perfil.Id);
        Assert.Equal(tenant.Usuario.Email, perfil.Email);
        Assert.Equal(tenant.Usuario.Nome, perfil.Nome);
        Assert.Equal(tenant.Usuario.Perfil.ToString(), perfil.Perfil);
        Assert.Equal(tenant.Usuario.ClinicaId, perfil.ClinicaId);
        Assert.Null(perfil.DentistaId);
    }

    [Fact]
    public async Task TrocaSenha_ComSenhaAtualInvalida_DeveRetornar400()
    {
        var tenant = await CriarTenantEUsuarioAsync();
        using var client = CriarClienteAutenticado(tenant.token);

        var response = await client.PatchAsJsonAsync(
            "/api/perfil/senha",
            new { SenhaAtual = "invalida", NovaSenha = "nova123", ConfirmacaoSenha = "nova123" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task TrocaSenha_ComSenhaValida_DeveAtualizarEPermitirLoginComNovaSenha()
    {
        const string novaSenha = "novasenha321";
        var tenant = await CriarTenantEUsuarioAsync();
        using var client = CriarClienteAutenticado(tenant.token);

        var response = await client.PatchAsJsonAsync(
            "/api/perfil/senha",
            new { SenhaAtual = "123", NovaSenha = novaSenha, ConfirmacaoSenha = novaSenha });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var loginAntigo = await FazerLoginComSenhaAsync(tenant.Usuario.Email, "123");
        Assert.Equal(HttpStatusCode.Unauthorized, loginAntigo.StatusCode);

        var loginNovo = await FazerLoginComSenhaAsync(tenant.Usuario.Email, novaSenha);
        Assert.Equal(HttpStatusCode.OK, loginNovo.StatusCode);
        Assert.NotNull((await loginNovo.Content.ReadFromJsonAsync<LoginResponse>())?.Token);
    }

    [Fact]
    public async Task RotaPerfilSemPermissao_DeveRetornarForbidden()
    {
        var tenant = await CriarTenantEUsuarioAsync(PerfilUsuario.Gestor);
        using var client = CriarClienteAutenticado(tenant.token);

        var response = await client.GetAsync("/api/perfil/me");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    private HttpClient CriarClienteAutenticado(string token)
    {
        var cliente = _factory.CreateClient();
        cliente.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return cliente;
    }

    private async Task<TenantUsuario> CriarTenantEUsuarioAsync(PerfilUsuario perfil = PerfilUsuario.Admin)
    {
        using var escopo = _factory.Services.CreateScope();
        var dbContext = escopo.ServiceProvider.GetRequiredService<OdontoCloudDbContext>();
        var contextAccessor = escopo.ServiceProvider.GetRequiredService<IHttpContextAccessor>();

        var nomeClinica = $"Clinica Perfil Teste {Guid.NewGuid():N}";
        var email = $"perfil-{Guid.NewGuid():N}@odontocloud.local";

        var clinica = new Clinica(nomeClinica, "Pro");
        var usuario = new Usuario(clinica.Id, "Usuario Perfil", email, "123", perfil);

        contextAccessor.HttpContext = CriaContextoTenant(Guid.NewGuid());
        try
        {
            dbContext.Clinicas.Add(clinica);
            await dbContext.SaveChangesAsync();

            contextAccessor.HttpContext = CriaContextoTenant(clinica.Id);
            dbContext.Usuarios.Add(usuario);
            await dbContext.SaveChangesAsync();
        }
        finally
        {
            contextAccessor.HttpContext = null;
        }

        var loginResponse = await FazerLoginComSenhaAsync(email, "123");
        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);

        var token = (await loginResponse.Content.ReadFromJsonAsync<LoginResponse>())?.Token;
        Assert.NotNull(token);

        return new TenantUsuario(clinica, usuario, token);
    }

    private async Task<HttpResponseMessage> FazerLoginComSenhaAsync(string email, string senha)
    {
        using var client = _factory.CreateClient();

        return await client.PostAsJsonAsync(
            "/api/auth/login",
            new { Email = email, Senha = senha });
    }

    private DefaultHttpContext CriaContextoTenant(Guid clinicaId)
    {
        return new DefaultHttpContext
        {
            User = new ClaimsPrincipal(
                new ClaimsIdentity(new[]
                {
                    new Claim(AuthClaims.ClinicaId, clinicaId.ToString()),
                    new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()),
                }, "IntegrationTests"))
        };
    }

    private sealed record TenantUsuario(Clinica Clinica, Usuario Usuario, string token);
    private sealed record PerfilResponse(Guid Id, string Nome, string Email, string Perfil, Guid ClinicaId, Guid? DentistaId);
    private sealed record LoginResponse(string Token);
}
