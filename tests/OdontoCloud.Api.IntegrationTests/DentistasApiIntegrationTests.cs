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

public sealed class DentistasApiIntegrationTests : IClassFixture<ApiTestFactory>
{
    private readonly ApiTestFactory _factory;

    public DentistasApiIntegrationTests(ApiTestFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task AtualizarAgendaConfig_ComTokenValido_DeveRetornar200ERefletirNoGetDentistas()
    {
        var tenant = await CriarTenantAsync();
        using var cliente = CriarClienteAutenticado(await ObterTokenJwtAsync(tenant.Email));

        var dentista = await CriarDentistaAsync(tenant.ClinicaId, "Dr. Configuracao");

        var payload = new
        {
            inicio = "07:00",
            fim = "17:30",
            duracaoPadraoMinutos = 45,
            diasDaSemana = new[] { 0, 1, 3, 5, 6 },
        };

        var response = await cliente.PatchAsJsonAsync($"/api/dentistas/{dentista}/agenda-config", payload);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var atualizado = await response.Content.ReadFromJsonAsync<DentistaDto>();
        Assert.NotNull(atualizado);
        Assert.Equal("07:00", atualizado.AgendaConfig.Inicio);
        Assert.Equal("17:30", atualizado.AgendaConfig.Fim);
        Assert.Equal(45, atualizado.AgendaConfig.DuracaoPadraoMinutos);
        Assert.Equal(new[] { 0, 1, 3, 5, 6 }, atualizado.AgendaConfig.DiasDaSemana);

        var listaResponse = await cliente.GetAsync("/api/dentistas");
        Assert.Equal(HttpStatusCode.OK, listaResponse.StatusCode);

        var lista = await listaResponse.Content.ReadFromJsonAsync<DentistaDto[]>();
        Assert.NotNull(lista);

        var recuperado = lista.First(dentistaDto => dentistaDto.Id == dentista);
        Assert.Equal("07:00", recuperado.AgendaConfig.Inicio);
        Assert.Equal("17:30", recuperado.AgendaConfig.Fim);
        Assert.Equal(45, recuperado.AgendaConfig.DuracaoPadraoMinutos);
        Assert.Equal(new[] { 0, 1, 3, 5, 6 }, recuperado.AgendaConfig.DiasDaSemana);
    }

    [Fact]
    public async Task AtualizarAgendaConfig_SemToken_DeveRetornar401()
    {
        var tenant = await CriarTenantAsync();
        var dentista = await CriarDentistaAsync(tenant.ClinicaId, "Dr. SemToken");

        using var client = _factory.CreateClient();
        var response = await client.PatchAsJsonAsync(
            $"/api/dentistas/{dentista}/agenda-config",
            new { inicio = "08:00", fim = "09:00", duracaoPadraoMinutos = 20, diasDaSemana = new[] { 1, 2 } });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task AtualizarAgendaConfig_TenantDiferente_NaoDeveAlterarDentistaDeOutraClinica()
    {
        var tenantOrigem = await CriarTenantAsync();
        var tenantDestino = await CriarTenantAsync();

        using var clienteOrigem = CriarClienteAutenticado(await ObterTokenJwtAsync(tenantOrigem.Email));
        using var clienteDestino = CriarClienteAutenticado(await ObterTokenJwtAsync(tenantDestino.Email));

        var dentistaOrigem = await CriarDentistaAsync(tenantOrigem.ClinicaId, "Dr. Segurança Tenant");
        var response = await clienteDestino.PatchAsJsonAsync(
            $"/api/dentistas/{dentistaOrigem}/agenda-config",
            new { inicio = "06:00", fim = "20:00", duracaoPadraoMinutos = 30, diasDaSemana = new[] { 1, 2, 3, 4, 5 } });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        var listaOrigem = await clienteOrigem.GetFromJsonAsync<DentistaDto[]>("/api/dentistas");
        Assert.NotNull(listaOrigem);

        var naoAtualizado = listaOrigem.First(dentista => dentista.Id == dentistaOrigem);
        Assert.Equal("08:00", naoAtualizado.AgendaConfig.Inicio);
        Assert.Equal("18:00", naoAtualizado.AgendaConfig.Fim);
        Assert.Equal(30, naoAtualizado.AgendaConfig.DuracaoPadraoMinutos);
        Assert.Equal(new[] { 0, 1, 2, 3, 4, 5, 6 }, naoAtualizado.AgendaConfig.DiasDaSemana);
    }

    [Fact]
    public async Task AtualizarAgendaConfig_PayloadInvalido_DeveRetornar400()
    {
        var tenant = await CriarTenantAsync();
        using var cliente = CriarClienteAutenticado(await ObterTokenJwtAsync(tenant.Email));
        var dentista = await CriarDentistaAsync(tenant.ClinicaId, "Dr. Payload Invalido");

        var response = await cliente.PatchAsJsonAsync(
            $"/api/dentistas/{dentista}/agenda-config",
            new { inicio = "18:00", fim = "08:00", duracaoPadraoMinutos = 5, diasDaSemana = new[] { 1, 2, 3 } });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task RotaConfigDentistaSemPermissao_DeveRetornarForbidden()
    {
        var tenant = await CriarTenantAsync(PerfilUsuario.Gestor);
        using var cliente = CriarClienteAutenticado(await ObterTokenJwtAsync(tenant.Email));
        var dentista = await CriarDentistaAsync(tenant.ClinicaId, "Dr. Sem Permissao");

        var response = await cliente.GetAsync("/api/dentistas");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    private HttpClient CriarClienteAutenticado(string token)
    {
        var cliente = _factory.CreateClient();
        cliente.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return cliente;
    }

    private async Task<string> ObterTokenJwtAsync(string email, string senha = "123")
    {
        using var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync(
            "/api/auth/login",
            new { Email = email, Senha = senha });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var login = await response.Content.ReadFromJsonAsync<LoginResponse>();
        Assert.NotNull(login);
        return login.Token;
    }

    private async Task<TenantSeed> CriarTenantAsync(PerfilUsuario perfil = PerfilUsuario.Admin)
    {
        using var escopo = _factory.Services.CreateScope();
        var dbContext = escopo.ServiceProvider.GetRequiredService<OdontoCloudDbContext>();
        var contextAccessor = escopo.ServiceProvider.GetRequiredService<IHttpContextAccessor>();

        var nomeClinica = $"Clínica Teste Config {Guid.NewGuid():N}";
        var email = $"dentista-config-{Guid.NewGuid():N}@odontocloud.local";
        var clinica = new Clinica(nomeClinica, "Pro");
        var usuario = new Usuario(
            clinica.Id,
            "Usuario Configuracao",
            email,
            "123",
            perfil);

        contextAccessor.HttpContext = CriarHttpContext(Guid.NewGuid());
        await dbContext.Clinicas.AddAsync(clinica);
        await dbContext.SaveChangesAsync();

        contextAccessor.HttpContext = CriarHttpContext(clinica.Id);
        await dbContext.Usuarios.AddAsync(usuario);
        await dbContext.SaveChangesAsync();
        contextAccessor.HttpContext = null;

        return new TenantSeed(clinica.Id, email);
    }

    private async Task<Guid> CriarDentistaAsync(Guid clinicaId, string nome)
    {
        return await ExecutarNoTenantContext(clinicaId, context =>
        {
            var dentista = new Dentista(
                clinicaId,
                nome,
                agendaConfigJson: """{"inicio":"08:00","fim":"18:00","duracaoPadraoMinutos":30,"diasDaSemana":[0,1,2,3,4,5,6]}""");

            context.Dentistas.Add(dentista);
            return dentista.Id;
        });
    }

    private async Task<T> ExecutarNoTenantContext<T>(Guid clinicaId, Func<OdontoCloudDbContext, T> acao)
    {
        using var escopo = _factory.Services.CreateScope();
        var contextAccessor = escopo.ServiceProvider.GetRequiredService<IHttpContextAccessor>();
        contextAccessor.HttpContext = CriarHttpContext(clinicaId);

        try
        {
            var dbContext = escopo.ServiceProvider.GetRequiredService<OdontoCloudDbContext>();
            var resultado = acao(dbContext);
            await dbContext.SaveChangesAsync();
            return resultado;
        }
        finally
        {
            contextAccessor.HttpContext = null;
        }
    }

    private static DefaultHttpContext CriarHttpContext(Guid clinicaId)
    {
        return new DefaultHttpContext
        {
            User = new ClaimsPrincipal(
                new ClaimsIdentity(
                    new[]
                    {
                        new Claim(AuthClaims.ClinicaId, clinicaId.ToString()),
                        new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString())
                    },
                    "IntegrationTests"))
        };
    }

    private sealed record TenantSeed(Guid ClinicaId, string Email);
    private sealed record LoginResponse(string Token);
    private sealed record AgendaConfigResponse(string Inicio, string Fim, int DuracaoPadraoMinutos, int[] DiasDaSemana);
    private sealed record DentistaDto(Guid Id, string Nome, string? Especialidade, AgendaConfigResponse AgendaConfig);
}
