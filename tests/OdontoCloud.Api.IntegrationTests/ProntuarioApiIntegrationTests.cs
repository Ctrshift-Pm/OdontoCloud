using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using OdontoCloud.Domain.Entities;
using OdontoCloud.Domain.Enums;
using OdontoCloud.Infrastructure.Data;
using OdontoCloud.Infrastructure.Identity;
using Xunit;

namespace OdontoCloud.Api.IntegrationTests;

public sealed class ProntuarioApiIntegrationTests : IClassFixture<ApiTestFactory>
{
    private readonly ApiTestFactory _factory;
    private static readonly string DentePermanenteTeste = "18";
    private static readonly string DenteDeciduoTeste = "55";

    public ProntuarioApiIntegrationTests(ApiTestFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task GetProntuario_DeveRetornarOdontogramaPadrao()
    {
        var tenant = await CriarTenantAsync();
        var token = await ObterTokenJwtAsync(tenant.Email);

        using var cliente = CriarClienteAutenticado(token);
        var pacienteId = await CriarPacienteAsync(cliente);

        var response = await cliente.GetAsync($"/api/prontuario/{pacienteId}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        using var documento = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal(pacienteId, documento.RootElement.GetProperty("pacienteId").GetGuid());
        Assert.True(documento.RootElement.GetProperty("odontograma").TryGetProperty("18", out var dente18));
        Assert.Equal("ok", dente18.GetString());
    }

    [Fact]
    public async Task GetProntuario_DeveRetornarOdontogramaComDeciduos()
    {
        var tenant = await CriarTenantAsync();
        var token = await ObterTokenJwtAsync(tenant.Email);

        using var cliente = CriarClienteAutenticado(token);
        var pacienteId = await CriarPacienteAsync(cliente);

        var response = await cliente.GetAsync($"/api/prontuario/{pacienteId}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        using var documento = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.True(documento.RootElement.GetProperty("odontograma").TryGetProperty("55", out var denteDeciduo));
        Assert.Equal("ok", denteDeciduo.GetString());
    }

    [Fact]
    public async Task UpdateOdontograma_ComProtese_DevePersistirNoProntuario()
    {
        var tenant = await CriarTenantAsync();
        var token = await ObterTokenJwtAsync(tenant.Email);

        using var cliente = CriarClienteAutenticado(token);
        var pacienteId = await CriarPacienteAsync(cliente);
        var prontuario = await ObterProntuarioAsync(cliente, pacienteId);
        var prontuarioId = prontuario.GetProperty("id").GetGuid();

        var patchResponse = await cliente.PatchAsJsonAsync(
            $"/api/prontuario/{prontuarioId}/odontograma/{DentePermanenteTeste}",
            new { status = "protese" });
        Assert.Equal(HttpStatusCode.OK, patchResponse.StatusCode);

        using var patchDocumento = JsonDocument.Parse(await patchResponse.Content.ReadAsStringAsync());
        Assert.Equal("protese", patchDocumento.RootElement.GetProperty("odontograma").GetProperty("18").GetString());

        var refreshResponse = await cliente.GetAsync($"/api/prontuario/{pacienteId}");
        Assert.Equal(HttpStatusCode.OK, refreshResponse.StatusCode);

        using var refreshDocumento = JsonDocument.Parse(await refreshResponse.Content.ReadAsStringAsync());
        Assert.Equal("protese", refreshDocumento.RootElement.GetProperty("odontograma").GetProperty("18").GetString());
    }

    [Fact]
    public async Task UpdateOdontograma_Deciduo_ComProtese_DevePersistirNoProntuario()
    {
        var tenant = await CriarTenantAsync();
        var token = await ObterTokenJwtAsync(tenant.Email);

        using var cliente = CriarClienteAutenticado(token);
        var pacienteId = await CriarPacienteAsync(cliente);
        var prontuario = await ObterProntuarioAsync(cliente, pacienteId);
        var prontuarioId = prontuario.GetProperty("id").GetGuid();

        var patchResponse = await cliente.PatchAsJsonAsync(
            $"/api/prontuario/{prontuarioId}/odontograma/{DenteDeciduoTeste}",
            new { status = "protese" });
        Assert.Equal(HttpStatusCode.OK, patchResponse.StatusCode);

        using var patchDocumento = JsonDocument.Parse(await patchResponse.Content.ReadAsStringAsync());
        Assert.Equal("protese", patchDocumento.RootElement.GetProperty("odontograma").GetProperty(DenteDeciduoTeste).GetString());

        var refreshResponse = await cliente.GetAsync($"/api/prontuario/{pacienteId}");
        Assert.Equal(HttpStatusCode.OK, refreshResponse.StatusCode);

        using var refreshDocumento = JsonDocument.Parse(await refreshResponse.Content.ReadAsStringAsync());
        Assert.Equal("protese", refreshDocumento.RootElement.GetProperty("odontograma").GetProperty(DenteDeciduoTeste).GetString());
    }

    [Fact]
    public async Task UpdateOdontograma_DeveRecusarAcessoDeTenantDiferente()
    {
        var tenantOrigem = await CriarTenantAsync();
        var tenantDestino = await CriarTenantAsync();

        var tokenOrigem = await ObterTokenJwtAsync(tenantOrigem.Email);
        var tokenDestino = await ObterTokenJwtAsync(tenantDestino.Email);

        using var clienteOrigem = CriarClienteAutenticado(tokenOrigem);
        var pacienteId = await CriarPacienteAsync(clienteOrigem);
        var prontuario = await ObterProntuarioAsync(clienteOrigem, pacienteId);

        using var clienteDestino = CriarClienteAutenticado(tokenDestino);
        var response = await clienteDestino.PatchAsJsonAsync(
            $"/api/prontuario/{prontuario.GetProperty("id").GetGuid()}/odontograma/{DentePermanenteTeste}",
            new { status = "carie" });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    private HttpClient CriarClienteAutenticado(string token)
    {
        var cliente = _factory.CreateClient();
        cliente.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return cliente;
    }

    private async Task<string> ObterTokenJwtAsync(string email, string senha = "123")
    {
        using var cliente = _factory.CreateClient();
        var response = await cliente.PostAsJsonAsync("/api/auth/login", new { Email = email, Senha = senha });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var login = await response.Content.ReadFromJsonAsync<LoginResponse>();
        Assert.NotNull(login);
        Assert.False(string.IsNullOrWhiteSpace(login.Token));
        return login.Token;
    }

    private async Task<Guid> CriarPacienteAsync(HttpClient cliente)
    {
        var response = await cliente.PostAsJsonAsync(
            "/api/pacientes",
            new
            {
                Nome = $"Paciente E2E {Guid.NewGuid():N}",
                Cpf = GerarCpfValido(),
                TelefoneWhatsapp = "11999998877",
                DataNascimento = "1990-01-01"
            });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var paciente = await response.Content.ReadFromJsonAsync<PacienteResponse>();
        Assert.NotNull(paciente);
        return paciente.Id;
    }

    private async Task<JsonElement> ObterProntuarioAsync(HttpClient cliente, Guid pacienteId)
    {
        var response = await cliente.GetAsync($"/api/prontuario/{pacienteId}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        using var documento = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return documento.RootElement.Clone();
    }

    private async Task<TenantSeed> CriarTenantAsync()
    {
        using var escopo = _factory.Services.CreateScope();
        var dbContext = escopo.ServiceProvider.GetRequiredService<OdontoCloudDbContext>();
        var contextoHttp = escopo.ServiceProvider.GetRequiredService<IHttpContextAccessor>();

        var nomeClinica = $"Clinica Teste {Guid.NewGuid():N}";
        var email = $"prontuario-teste-{Guid.NewGuid():N}@odontocloud.local";
        var clinica = new Clinica(nomeClinica, "Pro");

        contextoHttp.HttpContext = CriarHttpContext(Guid.NewGuid());
        try
        {
            dbContext.Clinicas.Add(clinica);
            await dbContext.SaveChangesAsync();

            contextoHttp.HttpContext = CriarHttpContext(clinica.Id);
            var usuario = new Usuario(
                clinica.Id,
                "Usuario Prontuario",
                email,
                "123",
                PerfilUsuario.Admin);

            dbContext.Usuarios.Add(usuario);
            await dbContext.SaveChangesAsync();

            return new TenantSeed(clinica.Id, email);
        }
        finally
        {
            contextoHttp.HttpContext = null;
        }
    }

    private static DefaultHttpContext CriarHttpContext(Guid clinicaId)
    {
        var identidade = new System.Security.Claims.ClaimsIdentity([
            new System.Security.Claims.Claim(AuthClaims.ClinicaId, clinicaId.ToString()),
            new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.NameIdentifier, Guid.NewGuid().ToString())
        ]);

        return new DefaultHttpContext { User = new System.Security.Claims.ClaimsPrincipal(identidade) };
    }

    private static string GerarCpfValido()
    {
        var baseDigits = new int[9];
        for (var i = 0; i < baseDigits.Length; i++)
        {
            baseDigits[i] = Random.Shared.Next(0, 10);
        }

        if (baseDigits.All(digit => digit == baseDigits[0]))
        {
            baseDigits[0] = (baseDigits[0] + 1) % 10;
        }

        var firstDigit = CalcularDigito(baseDigits, baseDigits.Length + 1);
        var secondDigit = CalcularDigito([.. baseDigits, firstDigit], baseDigits.Length + 2);

        return $"{string.Concat(baseDigits)}{firstDigit}{secondDigit}";
    }

    private static int CalcularDigito(int[] digits, int start)
    {
        var total = 0;
        for (var index = 0; index < digits.Length; index++)
        {
            total += digits[index] * (start - index);
        }

        var resto = total % 11;
        return resto < 2 ? 0 : 11 - resto;
    }

    private sealed record PacienteResponse(
        Guid Id,
        string Nome,
        string Cpf,
        string TelefoneWhatsapp);

    private sealed record LoginResponse(string Token);

    private sealed record TenantSeed(Guid ClinicaId, string Email);
}
