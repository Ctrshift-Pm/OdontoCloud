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

public sealed class AgendamentosApiIntegrationTests : IClassFixture<ApiTestFactory>
{
    private readonly ApiTestFactory _factory;
    private const string RegraComissaoPadrao = """{"tipo":"PercentualFixo","percentual":30}""";
    private static readonly DateTime ReferenciaAgenda = DateTime.UtcNow.Date;

    public AgendamentosApiIntegrationTests(ApiTestFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task CriarAgendamento_ComConfiguracaoPersonalizadaDeDentista_DentroDoHorario_DeveCriar()
    {
        var tenant = await CriarTenantAsync();
        var token = await ObterTokenJwtAsync(tenant.Email);
        var pacienteId = await CriarPacienteAsync(tenant.ClinicaId);
        var dentistaId = await CriarDentistaAsync(
            tenant.ClinicaId,
            "Dr. Agenda Custom",
            """{"inicio":"09:00","fim":"12:00","duracaoPadraoMinutos":20,"diasDaSemana":[1,2,3,4,5]}""");

        using var client = CriarClienteAutenticado(token);
        var payload = new CreateAgendamentoRequest(
            pacienteId,
            dentistaId,
            HorarioClinicaUtc(ProximoDiaUtil(ReferenciaAgenda), 9),
            20,
            StatusAgendamento.Agendado.ToString(),
            "Consulta");

        var response = await client.PostAsJsonAsync("/api/agendamentos", payload);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var responseBody = await response.Content.ReadFromJsonAsync<AgendamentoResponse>();
        Assert.NotNull(responseBody);
        Assert.Equal(pacienteId, responseBody.PacienteId);
        Assert.Equal(dentistaId, responseBody.DentistaId);
        Assert.Equal(payload.DataHora, responseBody.DataHora);
    }

    [Fact]
    public async Task CriarAgendamento_ForaDaConfiguracaoDeDentista_DeveRetornarBadRequest()
    {
        var tenant = await CriarTenantAsync();
        var token = await ObterTokenJwtAsync(tenant.Email);
        var pacienteId = await CriarPacienteAsync(tenant.ClinicaId);
        var dentistaId = await CriarDentistaAsync(
            tenant.ClinicaId,
            "Dr. Agenda Custom",
            """{"inicio":"09:00","fim":"18:00","duracaoPadraoMinutos":30,"diasDaSemana":[1,2,3,4,5]}""");

        using var client = CriarClienteAutenticado(token);
        var payload = new CreateAgendamentoRequest(
            pacienteId,
            dentistaId,
            HorarioClinicaUtc(ProximoDiaUtil(ReferenciaAgenda), 8),
            30,
            StatusAgendamento.Agendado.ToString(),
            "Consulta");

        var response = await client.PostAsJsonAsync("/api/agendamentos", payload);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task AtualizarAgendamento_ComConfiguracaoPersonalizadaDeDentista_DentroDoHorario_DeveAtualizar()
    {
        var tenant = await CriarTenantAsync();
        var token = await ObterTokenJwtAsync(tenant.Email);
        var pacienteId = await CriarPacienteAsync(tenant.ClinicaId);
        var dentistaId = await CriarDentistaAsync(
            tenant.ClinicaId,
            "Dr. Agenda Custom",
            """{"inicio":"09:00","fim":"18:00","duracaoPadraoMinutos":30,"diasDaSemana":[1,2,3,4,5]}""");
        var agendamentoId = await CriarAgendamentoViaDbAsync(
            tenant.ClinicaId,
            pacienteId,
            dentistaId,
            HorarioClinicaUtc(ProximoDiaUtil(ReferenciaAgenda), 10),
            30);

        using var client = CriarClienteAutenticado(token);
        var updatePayload = new UpdateAgendamentoRequest(
            pacienteId,
            dentistaId,
            HorarioClinicaUtc(ProximoDiaUtil(ReferenciaAgenda), 10, 30),
            30,
            StatusAgendamento.Remarcado.ToString(),
            "Consulta atualizada");

        var response = await client.PutAsJsonAsync($"/api/agendamentos/{agendamentoId}", updatePayload);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var responseBody = await response.Content.ReadFromJsonAsync<AgendamentoResponse>();
        Assert.NotNull(responseBody);
        Assert.Equal(agendamentoId, responseBody.Id);
        Assert.Equal(updatePayload.DataHora, responseBody.DataHora);
        Assert.Equal(StatusAgendamento.Remarcado.ToString(), responseBody.Status);
    }

    [Fact]
    public async Task AtualizarAgendamento_ForaDaConfiguracaoDeDentista_DeveRetornarBadRequest()
    {
        var tenant = await CriarTenantAsync();
        var token = await ObterTokenJwtAsync(tenant.Email);
        var pacienteId = await CriarPacienteAsync(tenant.ClinicaId);
        var dentistaId = await CriarDentistaAsync(
            tenant.ClinicaId,
            "Dr. Agenda Custom",
            """{"inicio":"09:00","fim":"18:00","duracaoPadraoMinutos":30,"diasDaSemana":[1,2,3,4,5]}""");
        var agendamentoId = await CriarAgendamentoViaDbAsync(
            tenant.ClinicaId,
            pacienteId,
            dentistaId,
            HorarioClinicaUtc(ProximoDiaUtil(ReferenciaAgenda), 10),
            30);

        using var client = CriarClienteAutenticado(token);
        var updatePayload = new UpdateAgendamentoRequest(
            pacienteId,
            dentistaId,
            HorarioClinicaUtc(ProximoDiaUtil(ReferenciaAgenda), 7),
            30,
            StatusAgendamento.Agendado.ToString(),
            "Consulta atualizada");

        var response = await client.PutAsJsonAsync($"/api/agendamentos/{agendamentoId}", updatePayload);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CriarAgendamento_FimDeSemana_DeveRejeitarQuandoNaoConfigurado()
    {
        var tenant = await CriarTenantAsync();
        var token = await ObterTokenJwtAsync(tenant.Email);
        var pacienteId = await CriarPacienteAsync(tenant.ClinicaId);
        var dentistaId = await CriarDentistaAsync(
            tenant.ClinicaId,
            "Dr. Agenda Config SemFimDeSemana",
            """{"inicio":"09:00","fim":"18:00","duracaoPadraoMinutos":30,"diasDaSemana":[1,2,3,4,5]}""");

        using var client = CriarClienteAutenticado(token);
        var dataSabado = HorarioClinicaUtc(ProximoDiaDaSemana(ReferenciaAgenda, DayOfWeek.Saturday), 9);
        var payload = new CreateAgendamentoRequest(
            pacienteId,
            dentistaId,
            dataSabado,
            30,
            StatusAgendamento.Agendado.ToString(),
            "Consulta no fim de semana");

        var response = await client.PostAsJsonAsync("/api/agendamentos", payload);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var message = await response.Content.ReadAsStringAsync();
        Assert.Contains("agenda", message.ToLowerInvariant());
    }

    [Fact]
    public async Task AtualizarAgendamento_FimDeSemana_DeveRejeitarQuandoNaoConfigurado()
    {
        var tenant = await CriarTenantAsync();
        var token = await ObterTokenJwtAsync(tenant.Email);
        var pacienteId = await CriarPacienteAsync(tenant.ClinicaId);
        var dentistaId = await CriarDentistaAsync(
            tenant.ClinicaId,
            "Dr. Agenda Config SemFimDeSemana",
            """{"inicio":"09:00","fim":"18:00","duracaoPadraoMinutos":30,"diasDaSemana":[1,2,3,4,5]}""");
        var agendamentoId = await CriarAgendamentoViaDbAsync(
            tenant.ClinicaId,
            pacienteId,
            dentistaId,
            HorarioClinicaUtc(ProximoDiaUtil(ReferenciaAgenda), 10),
            30);

        using var client = CriarClienteAutenticado(token);
        var dataDomingo = HorarioClinicaUtc(ProximoDiaDaSemana(ReferenciaAgenda, DayOfWeek.Sunday), 10);
        var updatePayload = new UpdateAgendamentoRequest(
            pacienteId,
            dentistaId,
            dataDomingo,
            30,
            StatusAgendamento.Remarcado.ToString(),
            "Consulta remarcada para domingo");

        var response = await client.PutAsJsonAsync($"/api/agendamentos/{agendamentoId}", updatePayload);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var message = await response.Content.ReadAsStringAsync();
        Assert.Contains("agenda", message.ToLowerInvariant());
    }

    [Fact]
    public async Task ConfiguracaoInvalida_DeveUsarFallbackParaPermitirAgendamentoNoPadrao()
    {
        var tenant = await CriarTenantAsync();
        var token = await ObterTokenJwtAsync(tenant.Email);
        var pacienteId = await CriarPacienteAsync(tenant.ClinicaId);
        var dentistaId = await CriarDentistaAsync(
            tenant.ClinicaId,
            "Dr. Agenda Config Inválida",
            """{"inicio":"invalid","fim":"invalid","duracaoPadraoMinutos":"invalid","diasDaSemana":"invalid"}""");

        using var client = CriarClienteAutenticado(token);
        var payloadValidoNoPadrao = new CreateAgendamentoRequest(
            pacienteId,
            dentistaId,
            HorarioClinicaUtc(ProximoDiaUtil(ReferenciaAgenda), 9),
            30,
            StatusAgendamento.Agendado.ToString(),
            "Consulta");

        var responseValido = await client.PostAsJsonAsync("/api/agendamentos", payloadValidoNoPadrao);
        Assert.Equal(HttpStatusCode.OK, responseValido.StatusCode);

        var payloadInvalidoNoPadrao = new CreateAgendamentoRequest(
            pacienteId,
            dentistaId,
            HorarioClinicaUtc(ProximoDiaUtil(ReferenciaAgenda), 7),
            30,
            StatusAgendamento.Agendado.ToString(),
            "Consulta");

        var responseInvalido = await client.PostAsJsonAsync("/api/agendamentos", payloadInvalidoNoPadrao);
        Assert.Equal(HttpStatusCode.BadRequest, responseInvalido.StatusCode);
    }

    [Fact]
    public async Task RotaAgendamentosSemPermissao_DeveRetornarForbidden()
    {
        var tenant = await CriarTenantAsync(PerfilUsuario.Gestor);
        var token = await ObterTokenJwtAsync(tenant.Email);

        using var client = CriarClienteAutenticado(token);
        var response = await client.GetAsync("/api/agendamentos");

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
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<OdontoCloudDbContext>();
        var contextAccessor = scope.ServiceProvider.GetRequiredService<IHttpContextAccessor>();

        var nomeClinica = $"Clinica Teste Agenda {Guid.NewGuid():N}";
        var email = $"agenda-teste-{Guid.NewGuid():N}@odontocloud.local";
        var clinica = new Clinica(nomeClinica, "Pro");

        contextAccessor.HttpContext = CriaHttpContext(Guid.NewGuid());

        try
        {
            dbContext.Clinicas.Add(clinica);
            await dbContext.SaveChangesAsync();

            contextAccessor.HttpContext = CriaHttpContext(clinica.Id);

            var usuario = new Usuario(
                clinica.Id,
                "Usuario Agenda",
                email,
                "123",
                perfil);

            dbContext.Usuarios.Add(usuario);
            await dbContext.SaveChangesAsync();

            return new TenantSeed(clinica.Id, email, usuario.Id);
        }
        finally
        {
            contextAccessor.HttpContext = null;
        }
    }

    private async Task<Guid> CriarPacienteAsync(Guid clinicaId)
    {
        var paciente = await ExecutarNoTenantContext(clinicaId, context =>
        {
            var novo = new Paciente(
                $"Paciente {Guid.NewGuid():N}",
                GerarCpf(),
                "11999999999");

            context.Pacientes.Add(novo);
            return novo;
        });

        return paciente.Id;
    }

    private async Task<Guid> CriarDentistaAsync(
        Guid clinicaId,
        string nome,
        string agendaConfigJson)
    {
        var dentista = await ExecutarNoTenantContext(clinicaId, context =>
        {
            var dentista = new Dentista(
                clinicaId,
                nome,
                regraComissaoJson: RegraComissaoPadrao,
                agendaConfigJson: agendaConfigJson);

            context.Dentistas.Add(dentista);
            return dentista;
        });

        return dentista.Id;
    }

    private async Task<Guid> CriarAgendamentoViaDbAsync(
        Guid clinicaId,
        Guid pacienteId,
        Guid dentistaId,
        DateTime dataHora,
        int duracaoMinutos)
    {
        var agendamento = await ExecutarNoTenantContext(clinicaId, context =>
        {
            var novo = new Agendamento(
                pacienteId,
                dentistaId,
                dataHora,
                duracaoMinutos,
                StatusAgendamento.Agendado.ToString(),
                "Consulta inicial");

            context.Agendamentos.Add(novo);
            return novo;
        });

        return agendamento.Id;
    }

    private async Task<T> ExecutarNoTenantContext<T>(Guid clinicaId, Func<OdontoCloudDbContext, T> acao)
    {
        using var scope = _factory.Services.CreateScope();
        var contextAccessor = scope.ServiceProvider.GetRequiredService<IHttpContextAccessor>();
        contextAccessor.HttpContext = CriaHttpContext(clinicaId);

        try
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<OdontoCloudDbContext>();
            var resultado = acao(dbContext);
            await dbContext.SaveChangesAsync();
            return resultado;
        }
        finally
        {
            contextAccessor.HttpContext = null;
        }
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

    private static string GerarCpf()
    {
        var chars = new char[11];
        for (var i = 0; i < chars.Length; i++)
        {
            chars[i] = (char)('0' + Random.Shared.Next(0, 10));
        }

        return new string(chars);
    }

    private static DateTime ProximoDiaUtil(DateTime referencia)
    {
        var proximo = referencia.AddDays(1);
        while ((int)proximo.DayOfWeek < 1 || (int)proximo.DayOfWeek > 5)
        {
            proximo = proximo.AddDays(1);
        }

        return proximo;
    }

    private static DateTime ProximoDiaDaSemana(DateTime referencia, DayOfWeek diaDaSemana)
    {
        var proximo = referencia.AddDays(1);
        while (proximo.DayOfWeek != diaDaSemana)
        {
            proximo = proximo.AddDays(1);
        }

        return proximo;
    }

    private static DateTime HorarioClinicaUtc(DateTime data, int hora, int minuto = 0)
    {
        var local = new DateTime(data.Year, data.Month, data.Day, hora, minuto, 0, DateTimeKind.Unspecified);
        return TimeZoneInfo.ConvertTimeToUtc(local, ResolveClinicTimeZone());
    }

    private static TimeZoneInfo ResolveClinicTimeZone()
    {
        foreach (var timeZoneId in new[] { "America/Sao_Paulo", "E. South America Standard Time" })
        {
            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById(timeZoneId);
            }
            catch (TimeZoneNotFoundException)
            {
            }
            catch (InvalidTimeZoneException)
            {
            }
        }

        return TimeZoneInfo.Local;
    }

    private sealed record TenantSeed(Guid ClinicaId, string Email, Guid UsuarioId);
    private sealed record LoginResponse(string Token);
    private sealed record AgendamentoResponse(
        Guid Id,
        Guid PacienteId,
        string PacienteNome,
        Guid DentistaId,
        string DentistaNome,
        DateTime DataHora,
        int DuracaoMinutos,
        string Status,
        string Procedimento,
        string? Observacoes);
    private sealed record CreateAgendamentoRequest(
        Guid PacienteId,
        Guid DentistaId,
        DateTime DataHora,
        int DuracaoMinutos,
        string Status,
        string Procedimento);
    private sealed record UpdateAgendamentoRequest(
        Guid PacienteId,
        Guid DentistaId,
        DateTime DataHora,
        int DuracaoMinutos,
        string Status,
        string Procedimento,
        string? Observacoes = null);
}
