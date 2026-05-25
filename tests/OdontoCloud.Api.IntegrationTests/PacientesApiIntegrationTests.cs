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

public sealed class PacientesApiIntegrationTests : IClassFixture<ApiTestFactory>
{
    private readonly ApiTestFactory _factory;

    public PacientesApiIntegrationTests(ApiTestFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task AtualizarKanban_DevePersistirStatusNoTenant()
    {
        var tenant = await CriarTenantAsync();
        var token = await ObterTokenJwtAsync(tenant.Email);

        using var client = CriarClienteAutenticado(token);
        var criarResponse = await client.PostAsJsonAsync(
            "/api/pacientes",
            new CriarPacienteRequest(
                $"Paciente {Guid.NewGuid():N}",
                GerarCpfValido(),
                "11999990000"));
        Assert.Equal(HttpStatusCode.OK, criarResponse.StatusCode);

        var pacienteCriado = await criarResponse.Content.ReadFromJsonAsync<PacienteResponse>();
        Assert.NotNull(pacienteCriado);

        var atualizarResponse = await client.PatchAsJsonAsync(
            $"/api/pacientes/{pacienteCriado!.Id}/crm-kanban",
            new { crmKanbanStatus = "Contato" });
        Assert.Equal(HttpStatusCode.OK, atualizarResponse.StatusCode);

        var atualizado = await atualizarResponse.Content.ReadFromJsonAsync<PacienteResponse>();
        Assert.NotNull(atualizado);
        Assert.Equal("Contato", atualizado!.CrmKanbanStatus);
    }

    [Fact]
    public async Task AtualizarKanban_DeveRejeitarStatusInvalido()
    {
        var tenant = await CriarTenantAsync();
        var token = await ObterTokenJwtAsync(tenant.Email);

        using var client = CriarClienteAutenticado(token);
        var criarResponse = await client.PostAsJsonAsync(
            "/api/pacientes",
            new CriarPacienteRequest(
                $"Paciente {Guid.NewGuid():N}",
                GerarCpfValido(),
                "11999990001"));
        Assert.Equal(HttpStatusCode.OK, criarResponse.StatusCode);
        var pacienteCriado = await criarResponse.Content.ReadFromJsonAsync<PacienteResponse>();
        Assert.NotNull(pacienteCriado);

        var atualizarResponse = await client.PatchAsJsonAsync(
            $"/api/pacientes/{pacienteCriado!.Id}/crm-kanban",
            new { crmKanbanStatus = "NaoExistente" });
        Assert.Equal(HttpStatusCode.BadRequest, atualizarResponse.StatusCode);
    }

    [Fact]
    public async Task EndpointsPacientes_DevemRespeitarFiltroMultiTenant()
    {
        var tenantA = await CriarTenantAsync();
        var tenantB = await CriarTenantAsync();
        var tokenA = await ObterTokenJwtAsync(tenantA.Email);
        var tokenB = await ObterTokenJwtAsync(tenantB.Email);

        using var clientA = CriarClienteAutenticado(tokenA);
        var criarResponse = await clientA.PostAsJsonAsync(
            "/api/pacientes",
            new CriarPacienteRequest(
                $"Paciente TenantA {Guid.NewGuid():N}",
                GerarCpfValido(),
                "11999990002"));
        Assert.Equal(HttpStatusCode.OK, criarResponse.StatusCode);

        var pacienteTenantA = await criarResponse.Content.ReadFromJsonAsync<PacienteResponse>();
        Assert.NotNull(pacienteTenantA);

        using var clientB = CriarClienteAutenticado(tokenB);
        var atualizarResponse = await clientB.PatchAsJsonAsync(
            $"/api/pacientes/{pacienteTenantA!.Id}/crm-kanban",
            new { crmKanbanStatus = "Contato" });
        Assert.Equal(HttpStatusCode.NotFound, atualizarResponse.StatusCode);
    }

    [Fact]
    public async Task RotaPacientesSemPermissao_DeveRetornarForbidden()
    {
        var tenant = await CriarTenantAsync(PerfilUsuario.Gestor);
        var token = await ObterTokenJwtAsync(tenant.Email);

        using var client = CriarClienteAutenticado(token);
        var response = await client.PostAsJsonAsync(
            "/api/pacientes",
            new CriarPacienteRequest($"Paciente {Guid.NewGuid():N}", GerarCpfValido(), "11999990003"));

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

        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new { Email = email, Senha = senha });
        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);

        var login = await loginResponse.Content.ReadFromJsonAsync<LoginResponse>();
        Assert.NotNull(login);
        Assert.False(string.IsNullOrWhiteSpace(login.Token));
        return login.Token;
    }

    private async Task<TenantSeed> CriarTenantAsync(PerfilUsuario perfil = PerfilUsuario.Admin)
    {
        using var escopo = _factory.Services.CreateScope();
        var dbContext = escopo.ServiceProvider.GetRequiredService<OdontoCloudDbContext>();
        var contextAccessor = escopo.ServiceProvider.GetRequiredService<IHttpContextAccessor>();

        var nomeClinica = $"Clinica Teste {Guid.NewGuid():N}";
        var email = $"paciente-teste-{Guid.NewGuid():N}@odontocloud.local";
        var clinica = new Clinica(nomeClinica, "Pro");

        contextAccessor.HttpContext = CriarHttpContext(Guid.NewGuid());
        await dbContext.Clinicas.AddAsync(clinica);
        await dbContext.SaveChangesAsync();

        contextAccessor.HttpContext = CriarHttpContext(clinica.Id);
        var usuario = new Usuario(
            clinica.Id,
            "Usuario Paciente",
            email,
            "123",
            perfil);
        dbContext.Usuarios.Add(usuario);
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
                    new[]
                    {
                        new Claim(AuthClaims.ClinicaId, clinicaId.ToString()),
                        new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString())
                    },
                    "IntegrationTests"))
        };
    }

    private static int[] GerarBaseCpf()
    {
        var digits = new int[9];
        for (var i = 0; i < digits.Length; i++)
        {
            digits[i] = Random.Shared.Next(0, 10);
        }

        if (digits.All(digit => digit == digits[0]))
        {
            digits[0] = (digits[0] + 1) % 10;
        }

        return digits;
    }

    private static int CalcularDigitoCpf(int[] digits, int pesoInicial)
    {
        var soma = 0;
        for (var i = 0; i < digits.Length; i++)
        {
            soma += digits[i] * (pesoInicial - i);
        }

        var resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    }

    private static string GerarCpfValido()
    {
        var baseDigits = GerarBaseCpf();
        var primeiro = CalcularDigitoCpf(baseDigits, baseDigits.Length + 1);
        var segundo = CalcularDigitoCpf([.. baseDigits, primeiro], baseDigits.Length + 2);
        return $"{string.Concat(baseDigits)}{primeiro}{segundo}";
    }

    private sealed record CriarPacienteRequest(string Nome, string Cpf, string TelefoneWhatsapp);
    private sealed record PacienteResponse(
        Guid Id,
        string Nome,
        string Cpf,
        string TelefoneWhatsapp,
        DateOnly? DataNascimento,
        string CrmKanbanStatus);
    private sealed record LoginResponse(string Token);
    private sealed record TenantSeed(Guid ClinicaId, string Email);
}
