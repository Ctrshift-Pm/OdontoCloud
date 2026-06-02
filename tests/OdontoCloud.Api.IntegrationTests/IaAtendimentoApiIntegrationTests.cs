using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using OdontoCloud.Domain.Entities;
using OdontoCloud.Domain.Enums;
using OdontoCloud.Infrastructure.Data;
using OdontoCloud.Infrastructure.Identity;

namespace OdontoCloud.Api.IntegrationTests;

public sealed class IaAtendimentoApiIntegrationTests : IClassFixture<ApiTestFactory>
{
    private readonly ApiTestFactory _factory;

    public IaAtendimentoApiIntegrationTests(ApiTestFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task CriarLead_DevePersistirMensagemInicialEListarNoTenant()
    {
        var tenant = await CriarTenantAsync();
        var token = await ObterTokenJwtAsync(tenant.Email);

        using var client = CriarClienteAutenticado(token);
        var criarResponse = await client.PostAsJsonAsync(
            "/api/ia-atendimento",
            new CriarIaLeadRequest(
                $"Lead IA {Guid.NewGuid():N}",
                "11999991111",
                "Dor intensa",
                5,
                "Urgencia odontologica",
                "Paciente com dor intensa solicitando encaixe.",
                "Ansioso",
                "Estou com muita dor."));

        Assert.Equal(HttpStatusCode.OK, criarResponse.StatusCode);
        var leadCriado = await criarResponse.Content.ReadFromJsonAsync<IaLeadResponse>();
        Assert.NotNull(leadCriado);
        Assert.Single(leadCriado!.Mensagens);
        Assert.Equal("Paciente", leadCriado.Mensagens[0].Direcao);

        var listarResponse = await client.GetAsync("/api/ia-atendimento");
        Assert.Equal(HttpStatusCode.OK, listarResponse.StatusCode);
        var leads = await listarResponse.Content.ReadFromJsonAsync<List<IaLeadResponse>>();
        Assert.Contains(leads!, lead => lead.Id == leadCriado.Id);
    }

    [Fact]
    public async Task IntervencaoHumana_DeveAssumirConversaERegistrarMensagem()
    {
        var tenant = await CriarTenantAsync();
        var token = await ObterTokenJwtAsync(tenant.Email);

        using var client = CriarClienteAutenticado(token);
        var lead = await CriarLeadAsync(client);

        var assumirResponse = await client.PatchAsync($"/api/ia-atendimento/{lead.Id}/assumir", null);
        Assert.Equal(HttpStatusCode.OK, assumirResponse.StatusCode);
        var assumido = await assumirResponse.Content.ReadFromJsonAsync<IaLeadResponse>();
        Assert.NotNull(assumido);
        Assert.True(assumido!.AtendimentoAssumido);
        Assert.Equal("EmQualificacao", assumido.Status);

        var mensagemResponse = await client.PostAsJsonAsync(
            $"/api/ia-atendimento/{lead.Id}/mensagens",
            new { Direcao = "Humano", Conteudo = "Vou verificar um horario para hoje." });
        Assert.Equal(HttpStatusCode.OK, mensagemResponse.StatusCode);

        var atualizado = await mensagemResponse.Content.ReadFromJsonAsync<IaLeadResponse>();
        Assert.NotNull(atualizado);
        Assert.Contains(atualizado!.Mensagens, mensagem => mensagem.Direcao == "Humano");
    }

    [Fact]
    public async Task EndpointsIaAtendimento_DevemRespeitarFiltroMultiTenant()
    {
        var tenantA = await CriarTenantAsync();
        var tenantB = await CriarTenantAsync();
        var tokenA = await ObterTokenJwtAsync(tenantA.Email);
        var tokenB = await ObterTokenJwtAsync(tenantB.Email);

        using var clientA = CriarClienteAutenticado(tokenA);
        var leadTenantA = await CriarLeadAsync(clientA);

        using var clientB = CriarClienteAutenticado(tokenB);
        var detalhesResponse = await clientB.GetAsync($"/api/ia-atendimento/{leadTenantA.Id}");
        Assert.Equal(HttpStatusCode.NotFound, detalhesResponse.StatusCode);

        var mensagemResponse = await clientB.PostAsJsonAsync(
            $"/api/ia-atendimento/{leadTenantA.Id}/mensagens",
            new { Direcao = "Humano", Conteudo = "Mensagem indevida." });
        Assert.Equal(HttpStatusCode.NotFound, mensagemResponse.StatusCode);
    }

    private async Task<IaLeadResponse> CriarLeadAsync(HttpClient client)
    {
        var response = await client.PostAsJsonAsync(
            "/api/ia-atendimento",
            new CriarIaLeadRequest(
                $"Lead IA {Guid.NewGuid():N}",
                "11999992222",
                "Dor moderada",
                4,
                "Avaliacao",
                "Lead criado em teste integrado.",
                "Preocupado",
                "Preciso de atendimento."));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var lead = await response.Content.ReadFromJsonAsync<IaLeadResponse>();
        Assert.NotNull(lead);
        return lead!;
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

        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new { Email = email, Senha = senha });
        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);

        var login = await loginResponse.Content.ReadFromJsonAsync<LoginResponse>();
        Assert.NotNull(login);
        Assert.False(string.IsNullOrWhiteSpace(login.Token));
        return login.Token;
    }

    private async Task<TenantSeed> CriarTenantAsync()
    {
        using var escopo = _factory.Services.CreateScope();
        var dbContext = escopo.ServiceProvider.GetRequiredService<OdontoCloudDbContext>();
        var contextAccessor = escopo.ServiceProvider.GetRequiredService<IHttpContextAccessor>();

        var email = $"ia-teste-{Guid.NewGuid():N}@odontocloud.local";
        var clinica = new Clinica($"Clinica IA {Guid.NewGuid():N}", "Pro");

        contextAccessor.HttpContext = CriarHttpContext(Guid.NewGuid());
        await dbContext.Clinicas.AddAsync(clinica);
        await dbContext.SaveChangesAsync();

        contextAccessor.HttpContext = CriarHttpContext(clinica.Id);
        dbContext.Usuarios.Add(new Usuario(clinica.Id, "Usuario IA", email, "123", PerfilUsuario.Admin));
        await dbContext.SaveChangesAsync();

        contextAccessor.HttpContext = null;

        return new TenantSeed(clinica.Id, email);
    }

    private static DefaultHttpContext CriarHttpContext(Guid clinicaId)
    {
        return new DefaultHttpContext
        {
            User = new ClaimsPrincipal(
                new ClaimsIdentity(
                    [
                        new Claim(AuthClaims.ClinicaId, clinicaId.ToString()),
                        new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString())
                    ],
                    "IntegrationTests"))
        };
    }

    private sealed record CriarIaLeadRequest(
        string Nome,
        string TelefoneWhatsapp,
        string MotivoContato,
        int Urgencia,
        string ProcedimentoInteresse,
        string? ResumoInteracao,
        string? Sentimento,
        string? MensagemInicial);

    private sealed record IaLeadResponse(
        Guid Id,
        string Nome,
        string TelefoneWhatsapp,
        string MotivoContato,
        string? ResumoInteracao,
        int Urgencia,
        string ProcedimentoInteresse,
        string Status,
        string? Sentimento,
        DateTimeOffset? ProximoFollowUpEm,
        bool AtendimentoAssumido,
        DateTimeOffset CreatedAt,
        List<IaMensagemResponse> Mensagens);

    private sealed record IaMensagemResponse(
        Guid Id,
        string Direcao,
        string Conteudo,
        DateTimeOffset EnviadaEmUtc,
        string Canal);

    private sealed record LoginResponse(string Token);

    private sealed record TenantSeed(Guid ClinicaId, string Email);
}
