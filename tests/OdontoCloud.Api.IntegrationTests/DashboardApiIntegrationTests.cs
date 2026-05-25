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

public sealed class DashboardApiIntegrationTests : IClassFixture<ApiTestFactory>
{
    private readonly ApiTestFactory _factory;

    public DashboardApiIntegrationTests(ApiTestFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Resumo_Dashboard_SemToken_DeveRetornarUnauthorized()
    {
        using var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/dashboard/resumo");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Resumo_Dashboard_ComDadosValidos_DeveRetornarIndicadores()
    {
        var tenant = await CriarTenantAsync();
        var token = await ObterTokenJwtAsync(tenant.Email);
        using var client = CriarClienteAutenticado(token);

        var pacienteId = await CriarPacienteAsync(tenant.ClinicaId);
        var dentistaId = await CriarDentistaAsync(tenant.ClinicaId);
        var hoje = DateTime.UtcNow.Date;
        await CriarAgendamentoAsync(tenant.ClinicaId, pacienteId, dentistaId, hoje.AddHours(10), "Agendado");
        await CriarContaReceberPendenteAsync(tenant.ClinicaId, pacienteId, valorBase: 250m);
        await CriarContaPagarAsync(tenant.ClinicaId, 120m, DateTime.UtcNow.AddDays(3));

        var response = await client.GetAsync("/api/dashboard/resumo");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var resumo = await response.Content.ReadFromJsonAsync<DashboardResumoResponse>();
        Assert.NotNull(resumo);
        Assert.Equal(1, resumo!.TotalPacientes);
        Assert.Equal(1, resumo.AgendamentosHoje);
        Assert.Equal(1, resumo.AgendamentosProximos);
        Assert.Equal(1, resumo.ContasReceberPendentes);
        Assert.Equal(1, resumo.ContasPagarPendentes);
        Assert.Equal(250m, resumo.TotalPendenteReceber);
        Assert.Equal(120m, resumo.TotalPendentePagar);
        Assert.NotEmpty(resumo.ProximosAgendamentos);
        Assert.Contains("Novo", resumo.PacientesPorStatusKanban.Select(item => item.Status));
    }

    [Fact]
    public async Task Resumo_Dashboard_DeveRespeitarFiltroMultiTenant()
    {
        var tenantA = await CriarTenantAsync();
        var tenantB = await CriarTenantAsync();

        var tokenA = await ObterTokenJwtAsync(tenantA.Email);
        using var clientA = CriarClienteAutenticado(tokenA);

        var pacienteTenantA = await CriarPacienteAsync(tenantA.ClinicaId);
        var dentistaTenantA = await CriarDentistaAsync(tenantA.ClinicaId);
        await CriarAgendamentoAsync(
            tenantA.ClinicaId,
            pacienteTenantA,
            dentistaTenantA,
            DateTime.UtcNow.Date.AddHours(11),
            "Agendado");
        await CriarContaPagarAsync(tenantA.ClinicaId, 110m, DateTime.UtcNow.AddDays(1));
        await CriarContaReceberPendenteAsync(tenantA.ClinicaId, pacienteTenantA, valorBase: 180m);

        var dentistaTenantB = await CriarDentistaAsync(tenantB.ClinicaId);
        var pacienteTenantB = await CriarPacienteAsync(tenantB.ClinicaId);
        await CriarContaPagarAsync(tenantB.ClinicaId, 220m, DateTime.UtcNow.AddDays(2));
        await CriarContaReceberPendenteAsync(tenantB.ClinicaId, pacienteTenantB, valorBase: 260m);
        await CriarAgendamentoAsync(tenantB.ClinicaId, pacienteTenantB, dentistaTenantB, DateTime.UtcNow.AddHours(2), "Agendado");

        var response = await clientA.GetAsync("/api/dashboard/resumo");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var resumo = await response.Content.ReadFromJsonAsync<DashboardResumoResponse>();
        Assert.NotNull(resumo);
        Assert.Equal(1, resumo!.TotalPacientes);
        Assert.Equal(1, resumo.ContasPagarPendentes);
        Assert.Equal(1, resumo.ContasReceberPendentes);
        Assert.Equal(1, resumo.AgendamentosHoje);
        Assert.Equal(180m, resumo.TotalPendenteReceber);
        Assert.Equal(110m, resumo.TotalPendentePagar);
        Assert.NotEmpty(resumo.ProximosAgendamentos);
        Assert.All(
            resumo.ProximosAgendamentos,
            agendamento => Assert.StartsWith("Paciente", agendamento.PacienteNome));
    }

    [Fact]
    public async Task Resumo_Dashboard_NaoDevePersistirAlteracaoDeStatusAtrasado()
    {
        var tenant = await CriarTenantAsync();
        var token = await ObterTokenJwtAsync(tenant.Email);
        using var client = CriarClienteAutenticado(token);

        var pacienteId = await CriarPacienteAsync(tenant.ClinicaId);
        await CriarContaReceberPendenteAsync(tenant.ClinicaId, pacienteId, valorBase: 200m, dataVencimento: DateTime.UtcNow.AddDays(-5));

        var response = await client.GetAsync("/api/dashboard/resumo");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var statusReceber = await ObterStatusContaReceberAsync(tenant.ClinicaId, pacienteId);
        Assert.Equal(StatusContaReceber.Pendente.ToString(), statusReceber);
    }

    [Fact]
    public async Task RotaDashboardSemPermissao_DeveRetornarForbidden()
    {
        var tenant = await CriarTenantAsync(PerfilUsuario.Gestor);
        var token = await ObterTokenJwtAsync(tenant.Email);

        using var client = CriarClienteAutenticado(token);
        var response = await client.GetAsync("/api/dashboard/resumo");

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
        var loginResponse = await client.PostAsJsonAsync(
            "/api/auth/login",
            new { Email = email, Senha = senha });
        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);

        var login = await loginResponse.Content.ReadFromJsonAsync<LoginResponse>();
        Assert.NotNull(login);
        return login.Token;
    }

    private async Task<TenantSeed> CriarTenantAsync(PerfilUsuario perfil = PerfilUsuario.Admin)
    {
        using var escopo = _factory.Services.CreateScope();
        var dbContext = escopo.ServiceProvider.GetRequiredService<OdontoCloudDbContext>();
        var contextAccessor = escopo.ServiceProvider.GetRequiredService<IHttpContextAccessor>();

        var nomeClinica = $"Clinica Dashboard {Guid.NewGuid():N}";
        var email = $"dashboard-teste-{Guid.NewGuid():N}@odontocloud.local";
        var clinica = new Clinica(nomeClinica, "Pro");

        contextAccessor.HttpContext = new DefaultHttpContext
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(AuthClaims.ClinicaId, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString())
            }))
        };

        dbContext.Clinicas.Add(clinica);
        await dbContext.SaveChangesAsync();

        contextAccessor.HttpContext = new DefaultHttpContext
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(AuthClaims.ClinicaId, clinica.Id.ToString()),
                new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString())
            }))
        };

        var usuario = new Usuario(clinica.Id, "Usuario Dashboard", email, "123", perfil);
        dbContext.Usuarios.Add(usuario);
        await dbContext.SaveChangesAsync();

        contextAccessor.HttpContext = null;
        return new TenantSeed(clinica.Id, email);
    }

    private async Task<Guid> CriarPacienteAsync(Guid clinicaId)
    {
        var paciente = await ExecutarNoTenantContext(clinicaId, context =>
        {
            var novo = new Paciente(
                $"Paciente {Guid.NewGuid():N}",
                "12345678901",
                "11999990000");
            context.Pacientes.Add(novo);
            return novo;
        });

        return paciente.Id;
    }

    private async Task<Guid> CriarDentistaAsync(Guid clinicaId)
    {
        var dentista = await ExecutarNoTenantContext(clinicaId, context =>
        {
            var dentistaNovo = new Dentista(
                clinicaId,
                $"Dr. {Guid.NewGuid():N}",
                regraComissaoJson: """{"tipo":"PercentualFixo","percentual":10}""");
            context.Dentistas.Add(dentistaNovo);
            return dentistaNovo;
        });

        return dentista.Id;
    }

    private async Task CriarAgendamentoAsync(Guid clinicaId, Guid pacienteId, Guid dentistaId, DateTime dataHora, string status)
    {
        await ExecutarNoTenantContext(clinicaId, context =>
        {
            var novoAgendamento = new Agendamento(
                pacienteId,
                dentistaId,
                dataHora,
                30,
                status,
                "Consulta");
            context.Agendamentos.Add(novoAgendamento);
            return novoAgendamento;
        });
    }

    private async Task<Guid> CriarContaReceberPendenteAsync(
        Guid clinicaId,
        Guid pacienteId,
        decimal valorBase,
        DateTime? dataVencimento = null)
    {
        var conta = await ExecutarNoTenantContext(clinicaId, context =>
        {
            var contaNova = new ContaReceber(
                pacienteId,
                null,
                null,
                valorBase,
                desconto: 0m,
                dataVencimento ?? DateTime.UtcNow.AddDays(2));
            context.ContasReceber.Add(contaNova);
            return contaNova;
        });

        return conta.Id;
    }

    private async Task<string> ObterStatusContaReceberAsync(Guid clinicaId, Guid pacienteId)
    {
        return await ExecutarNoTenantContext(clinicaId, context =>
        {
            var conta = context.ContasReceber.FirstOrDefault(c => c.PacienteId == pacienteId);
            return conta?.Status ?? string.Empty;
        });
    }

    private async Task CriarContaPagarAsync(Guid clinicaId, decimal valor, DateTime dataVencimento)
    {
        await ExecutarNoTenantContext(clinicaId, context =>
        {
            var contaPagar = new ContaPagar(
                "Fornecedor Teste",
                "Despesa",
                "Conta em aberto",
                valor,
                dataVencimento);
            context.ContasPagar.Add(contaPagar);
            return contaPagar;
        });
    }

    private async Task<T> ExecutarNoTenantContext<T>(Guid clinicaId, Func<OdontoCloudDbContext, T> acao)
    {
        using var escopo = _factory.Services.CreateScope();
        var contextoHttp = escopo.ServiceProvider.GetRequiredService<IHttpContextAccessor>();
        contextoHttp.HttpContext = new DefaultHttpContext
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(AuthClaims.ClinicaId, clinicaId.ToString()),
                new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString())
            }))
        };

        try
        {
            var dbContext = escopo.ServiceProvider.GetRequiredService<OdontoCloudDbContext>();
            var resultado = acao(dbContext);
            await dbContext.SaveChangesAsync();
            return resultado;
        }
        finally
        {
            contextoHttp.HttpContext = null;
        }
    }

    private sealed record LoginResponse(string Token);

    private sealed record TenantSeed(
        Guid ClinicaId,
        string Email);

    private sealed record DashboardKanbanStatusResumoResponse(string Status, int Quantidade);

    private sealed record DashboardProximoAgendamentoResumoResponse(
        string PacienteNome,
        string DentistaNome,
        DateTime DataHora,
        string Status,
        string Procedimento);

    private sealed record DashboardResumoResponse(
        int TotalPacientes,
        IReadOnlyList<DashboardKanbanStatusResumoResponse> PacientesPorStatusKanban,
        int AgendamentosHoje,
        int AgendamentosProximos,
        int ContasReceberPendentes,
        int ContasPagarPendentes,
        decimal TotalPendenteReceber,
        decimal TotalPendentePagar,
        IReadOnlyList<DashboardProximoAgendamentoResumoResponse> ProximosAgendamentos);
}
