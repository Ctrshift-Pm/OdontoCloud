using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using OdontoCloud.Domain.Entities;
using OdontoCloud.Domain.Enums;
using OdontoCloud.Infrastructure.Data;
using OdontoCloud.Infrastructure.Identity;

namespace OdontoCloud.Api.IntegrationTests;

public sealed class FinanceiroApiIntegrationTests : IClassFixture<ApiTestFactory>
{
    private static readonly DateTime DefaultDate = DateTime.UtcNow.Date;
    private const string JwtIssuer = "OdontoCloud.Api";
    private const string JwtAudience = "OdontoCloud.Client";
    private const string JwtKey = "OdontoCloud.Jwt.SecretKey.2026.Segura.Com.32.Chars";
    private readonly ApiTestFactory _factory;

    public FinanceiroApiIntegrationTests(ApiTestFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task GetReceber_Autenticado_DeveRetornarContas()
    {
        var tenant = await CriarTenantAsync();
        var token = await ObterTokenJwtAsync(tenant.Email);

        var pacienteId = await CriarPacienteAsync(tenant.ClinicaId);
        var contaReceberId = await CriarContaReceberPendenteAsync(tenant.ClinicaId, pacienteId);

        using var client = CriarClienteAutenticado(token);
        var response = await client.GetAsync("/api/financeiro/receber");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var contas = await response.Content.ReadFromJsonAsync<List<ContaReceberResponse>>();
        Assert.NotNull(contas);
        Assert.Contains(contaReceberId, contas.Select(item => item.Id));
    }

    [Fact]
    public async Task GetContasReceber_PendenteVencidaNaoDevePersistirStatusAtrasado()
    {
        var tenant = await CriarTenantAsync();
        var token = await ObterTokenJwtAsync(tenant.Email);

        var pacienteId = await CriarPacienteAsync(tenant.ClinicaId);
        var contaReceberId = await CriarContaReceberPendenteAsync(
            tenant.ClinicaId,
            pacienteId,
            dataVencimento: DateTime.UtcNow.Date.AddDays(-2));

        using var client = CriarClienteAutenticado(token);
        var response = await client.GetAsync("/api/financeiro/pendentes?pacienteId=" + pacienteId);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var contas = await response.Content.ReadFromJsonAsync<List<ContaReceberResponse>>();
        Assert.NotNull(contas);
        var retorno = Assert.Single(contas, conta => conta.Id == contaReceberId);
        Assert.Equal(StatusContaReceber.Atrasado.ToString(), retorno.Status);

        var statusDb = await ObterStatusContaReceberAsync(tenant.ClinicaId, contaReceberId);
        Assert.Equal(StatusContaReceber.Pendente.ToString(), statusDb);
    }

    [Fact]
    public async Task CreateReceber_ComDadosValidos_DeveCadastrarContaPendente()
    {
        var tenant = await CriarTenantAsync();
        var token = await ObterTokenJwtAsync(tenant.Email);

        var pacienteId = await CriarPacienteAsync(tenant.ClinicaId);
        using var client = CriarClienteAutenticado(token);

        var payload = new CreateContaReceberRequest(
            pacienteId,
            null,
            null,
            250m,
            30m,
            DateTime.UtcNow.Date.AddDays(2));

        var response = await client.PostAsJsonAsync("/api/financeiro/receber", payload);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var contaCriada = await response.Content.ReadFromJsonAsync<ContaReceberResponse>();
        Assert.NotNull(contaCriada);
        Assert.Equal(pacienteId, contaCriada.PacienteId);
        Assert.Equal(220m, contaCriada.ValorFinal);
        Assert.Equal(StatusContaReceber.Pendente.ToString(), contaCriada.Status);

        var listarResponse = await client.GetAsync("/api/financeiro/receber?status=Pendente");
        Assert.Equal(HttpStatusCode.OK, listarResponse.StatusCode);

        var contas = await listarResponse.Content.ReadFromJsonAsync<List<ContaReceberResponse>>();
        Assert.NotNull(contas);
        Assert.Contains(contaCriada.Id, contas.Select(item => item.Id));
    }

    [Fact]
    public async Task UpdateReceber_Pendente_DeveAtualizarDados()
    {
        var tenant = await CriarTenantAsync();
        var token = await ObterTokenJwtAsync(tenant.Email);

        var pacienteId = await CriarPacienteAsync(tenant.ClinicaId);
        var contaReceberId = await CriarContaReceberPendenteAsync(
            tenant.ClinicaId,
            pacienteId,
            valorBase: 180m,
            desconto: 10m);

        using var client = CriarClienteAutenticado(token);
        var payload = new
        {
            ValorBase = 220m,
            Desconto = 30m,
            DataVencimento = DateTime.UtcNow.Date.AddDays(8),
        };

        using var request = new HttpRequestMessage(HttpMethod.Put, $"/api/financeiro/receber/{contaReceberId}")
        {
            Content = JsonContent.Create(payload)
        };

        var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var contaAtualizada = await response.Content.ReadFromJsonAsync<ContaReceberResponse>();
        Assert.NotNull(contaAtualizada);
        Assert.Equal(190m, contaAtualizada.ValorFinal);
        Assert.Equal(220m, contaAtualizada.ValorBase);
        Assert.Equal(30m, contaAtualizada.Desconto);
    }

    [Fact]
    public async Task DeleteReceber_Pendente_DeveRemoverConta()
    {
        var tenant = await CriarTenantAsync();
        var token = await ObterTokenJwtAsync(tenant.Email);

        var pacienteId = await CriarPacienteAsync(tenant.ClinicaId);
        var contaReceberId = await CriarContaReceberPendenteAsync(
            tenant.ClinicaId,
            pacienteId,
            valorBase: 145m);

        using var client = CriarClienteAutenticado(token);
        var response = await client.DeleteAsync($"/api/financeiro/receber/{contaReceberId}");
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        var listarResponse = await client.GetAsync("/api/financeiro/receber?status=Pendente");
        var contas = await listarResponse.Content.ReadFromJsonAsync<List<ContaReceberResponse>>();
        Assert.NotNull(contas);
        Assert.DoesNotContain(contas, conta => conta.Id == contaReceberId);
    }

    [Fact]
    public async Task UpdateReceber_Pago_DeveRetornarErro400()
    {
        var tenant = await CriarTenantAsync();
        var token = await ObterTokenJwtAsync(tenant.Email);

        var pacienteId = await CriarPacienteAsync(tenant.ClinicaId);
        var contaReceberId = await CriarContaReceberPendenteAsync(
            tenant.ClinicaId,
            pacienteId,
            valorBase: 150m);

        using var clientePagador = CriarClienteAutenticado(token);
        var baixa = await clientePagador.PatchAsJsonAsync(
            $"/api/financeiro/receber/{contaReceberId}",
            new ReceberRequest(150m, "Dinheiro"));
        Assert.Equal(HttpStatusCode.OK, baixa.StatusCode);

        var payload = new
        {
            ValorBase = 300m,
            Desconto = 0m,
            DataVencimento = DateTime.UtcNow.Date.AddDays(4),
        };

        using var updateRequest = new HttpRequestMessage(HttpMethod.Put, $"/api/financeiro/receber/{contaReceberId}")
        {
            Content = JsonContent.Create(payload)
        };

        var response = await clientePagador.SendAsync(updateRequest);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task DeleteReceber_Pago_DeveRetornarErro400()
    {
        var tenant = await CriarTenantAsync();
        var token = await ObterTokenJwtAsync(tenant.Email);

        var pacienteId = await CriarPacienteAsync(tenant.ClinicaId);
        var contaReceberId = await CriarContaReceberPendenteAsync(
            tenant.ClinicaId,
            pacienteId,
            valorBase: 120m);

        using var clientePagador = CriarClienteAutenticado(token);
        var baixa = await clientePagador.PatchAsJsonAsync(
            $"/api/financeiro/receber/{contaReceberId}",
            new ReceberRequest(120m, "Pix"));
        Assert.Equal(HttpStatusCode.OK, baixa.StatusCode);

        var response = await clientePagador.DeleteAsync($"/api/financeiro/receber/{contaReceberId}");
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetReceber_DeveFiltrarPorPeriodoEStatus()
    {
        var tenant = await CriarTenantAsync();
        var token = await ObterTokenJwtAsync(tenant.Email);
        var pacienteId = await CriarPacienteAsync(tenant.ClinicaId);

        var contaPendenteDentroDoPeriodo = await CriarContaReceberPendenteAsync(
            tenant.ClinicaId,
            pacienteId,
            dataVencimento: DefaultDate.AddDays(2),
            valorBase: 320m);

        var contaPendenteForaDoPeriodo = await CriarContaReceberPendenteAsync(
            tenant.ClinicaId,
            pacienteId,
            dataVencimento: DefaultDate.AddDays(30),
            valorBase: 500m);

        await CriarContaReceberParcialAsync(
            tenant.ClinicaId,
            pacienteId,
            tenant.UsuarioId,
            dataVencimento: DefaultDate.AddDays(3),
            120m);

        using var client = CriarClienteAutenticado(token);
        var resposta = await client.GetAsync(
            $"/api/financeiro/receber?dataInicio={DefaultDate.AddDays(1):yyyy-MM-dd}&dataFim={DefaultDate.AddDays(4):yyyy-MM-dd}&status={StatusContaReceber.Pendente}");

        Assert.Equal(HttpStatusCode.OK, resposta.StatusCode);

        var contas = await resposta.Content.ReadFromJsonAsync<List<ContaReceberResponse>>();
        Assert.NotNull(contas);

        var ids = contas.Select(item => item.Id).ToHashSet();
        Assert.Contains(contaPendenteDentroDoPeriodo, ids);
        Assert.DoesNotContain(contaPendenteForaDoPeriodo, ids);
    }

    [Fact]
    public async Task GetContasPagarPendentes_Autenticado_DeveRetornarSomentePendentes()
    {
        var tenant = await CriarTenantAsync();
        var token = await ObterTokenJwtAsync(tenant.Email);

        var contaPagarPendenteId = await CriarContaPagarAsync(tenant.ClinicaId, 250m, DefaultDate.AddDays(3), pagar: false);
        var contaPagarAtrasadaId = await CriarContaPagarAsync(tenant.ClinicaId, 200m, DefaultDate.AddDays(-2), pagar: false);
        await CriarContaPagarAsync(tenant.ClinicaId, 150m, DefaultDate.AddDays(2), pagar: true, tenant.UsuarioId);

        using var client = CriarClienteAutenticado(token);
        var resposta = await client.GetAsync("/api/financeiro/contas-pagar/pendentes");

        Assert.Equal(HttpStatusCode.OK, resposta.StatusCode);

        var contasPagar = await resposta.Content.ReadFromJsonAsync<List<ContaPagarResponse>>();
        Assert.NotNull(contasPagar);

        var ids = contasPagar.Select(item => item.Id).ToHashSet();
        Assert.Contains(contaPagarPendenteId, ids);
        Assert.Contains(contaPagarAtrasadaId, ids);
    }

    [Fact]
    public async Task GetContasPagarPendentes_AtrasadasNaoDevemPersistirStatusAtrasado()
    {
        var tenant = await CriarTenantAsync();
        var token = await ObterTokenJwtAsync(tenant.Email);
        var contaPagarAtrasadaId = await CriarContaPagarAsync(
            tenant.ClinicaId,
            320m,
            DefaultDate.AddDays(-3),
            pagar: false);

        using var client = CriarClienteAutenticado(token);
        var resposta = await client.GetAsync("/api/financeiro/contas-pagar/pendentes");

        Assert.Equal(HttpStatusCode.OK, resposta.StatusCode);
        var contasPagar = await resposta.Content.ReadFromJsonAsync<List<ContaPagarResponse>>();
        Assert.NotNull(contasPagar);
        var retorno = Assert.Single(contasPagar, conta => conta.Id == contaPagarAtrasadaId);
        Assert.Equal(StatusContaPagar.Atrasado.ToString(), retorno.Status);

        var statusDb = await ObterStatusContaPagarAsync(tenant.ClinicaId, contaPagarAtrasadaId);
        Assert.Equal(StatusContaPagar.Pendente.ToString(), statusDb);
    }

    [Fact]
    public async Task PagarContaPagar_Pendente_DeveRetornarPagoENaoAparecerEmPendentes()
    {
        var tenant = await CriarTenantAsync();
        var token = await ObterTokenJwtAsync(tenant.Email);

        var contaPagarId = await CriarContaPagarAsync(tenant.ClinicaId, 220m, DefaultDate.AddDays(2), pagar: false);

        using var client = CriarClienteAutenticado(token);
        using var request = new HttpRequestMessage(HttpMethod.Patch, $"/api/financeiro/contas-pagar/{contaPagarId}/pagar");
        var pagarResponse = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.OK, pagarResponse.StatusCode);

        var contaPagarPaga = await pagarResponse.Content.ReadFromJsonAsync<ContaPagarResponse>();
        Assert.NotNull(contaPagarPaga);
        Assert.Equal(contaPagarId, contaPagarPaga.Id);
        Assert.Equal(StatusContaPagar.Pago.ToString(), contaPagarPaga.Status);

        var contasPagarResponse = await client.GetAsync("/api/financeiro/contas-pagar/pendentes");
        Assert.Equal(HttpStatusCode.OK, contasPagarResponse.StatusCode);

        var contasPagar = await contasPagarResponse.Content.ReadFromJsonAsync<List<ContaPagarResponse>>();
        Assert.NotNull(contasPagar);
        Assert.DoesNotContain(contasPagar, conta => conta.Id == contaPagarId);
    }

    [Fact]
    public async Task UpdateContaPagar_Pendente_DeveAtualizarDados()
    {
        var tenant = await CriarTenantAsync();
        var token = await ObterTokenJwtAsync(tenant.Email);

        var contaPagarId = await CriarContaPagarAsync(tenant.ClinicaId, 250m, DefaultDate.AddDays(2), pagar: false);

        using var client = CriarClienteAutenticado(token);
        var payload = new
        {
            FornecedorDestinatario = "Laboratorio Atualizado",
            Categoria = "Teste",
            Descricao = "Conta alterada em teste",
            Valor = 333m,
            DataVencimento = DefaultDate.AddDays(9),
        };

        using var request = new HttpRequestMessage(HttpMethod.Put, $"/api/financeiro/contas-pagar/{contaPagarId}")
        {
            Content = JsonContent.Create(payload)
        };

        var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var contaAtualizada = await response.Content.ReadFromJsonAsync<ContaPagarResponse>();
        Assert.NotNull(contaAtualizada);
        Assert.Equal("Laboratorio Atualizado", contaAtualizada.FornecedorDestinatario);
        Assert.Equal("Teste", contaAtualizada.Categoria);
        Assert.Equal(333m, contaAtualizada.Valor);
    }

    [Fact]
    public async Task DeleteContaPagar_Pendente_DeveRemoverConta()
    {
        var tenant = await CriarTenantAsync();
        var token = await ObterTokenJwtAsync(tenant.Email);

        var contaPagarId = await CriarContaPagarAsync(tenant.ClinicaId, 190m, DefaultDate.AddDays(2), pagar: false);

        using var client = CriarClienteAutenticado(token);
        var response = await client.DeleteAsync($"/api/financeiro/contas-pagar/{contaPagarId}");
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        var contasPagarResponse = await client.GetAsync("/api/financeiro/contas-pagar/pendentes");
        var contasPagar = await contasPagarResponse.Content.ReadFromJsonAsync<List<ContaPagarResponse>>();
        Assert.NotNull(contasPagar);
        Assert.DoesNotContain(contasPagar, conta => conta.Id == contaPagarId);
    }

    [Fact]
    public async Task UpdateContaPagar_Pago_DeveRetornarErro400()
    {
        var tenant = await CriarTenantAsync();
        var token = await ObterTokenJwtAsync(tenant.Email);
        var contaPagarId = await CriarContaPagarAsync(tenant.ClinicaId, 400m, DefaultDate.AddDays(2), pagar: true, usuarioBaixaId: tenant.UsuarioId);

        using var client = CriarClienteAutenticado(token);
        var payload = new
        {
            FornecedorDestinatario = "Laboratorio Bloqueado",
            Categoria = "Comissao",
            Descricao = "Tentativa de alteracao indevida",
            Valor = 500m,
            DataVencimento = DefaultDate.AddDays(11),
        };

        using var request = new HttpRequestMessage(HttpMethod.Put, $"/api/financeiro/contas-pagar/{contaPagarId}")
        {
            Content = JsonContent.Create(payload)
        };

        var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task DeleteContaPagar_Pago_DeveRetornarErro400()
    {
        var tenant = await CriarTenantAsync();
        var token = await ObterTokenJwtAsync(tenant.Email);
        var contaPagarId = await CriarContaPagarAsync(tenant.ClinicaId, 400m, DefaultDate.AddDays(2), pagar: true, usuarioBaixaId: tenant.UsuarioId);

        using var client = CriarClienteAutenticado(token);
        var response = await client.DeleteAsync($"/api/financeiro/contas-pagar/{contaPagarId}");
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Receber_ComissaoValida_DeveGerarContaPagarParaComissao()
    {
        var tenant = await CriarTenantAsync();
        var token = await ObterTokenJwtAsync(tenant.Email);

        var pacienteId = await CriarPacienteAsync(tenant.ClinicaId);
        var dentistaId = await CriarDentistaAsync(
            tenant.ClinicaId,
            "Dr. Ana Comissão",
            """{"tipo":"PercentualFixo","percentual":10}""");
        var contaReceberId = await CriarContaReceberPendenteAsync(
            tenant.ClinicaId,
            pacienteId,
            dentistaId: dentistaId,
            valorBase: 1000m);

        using var client = CriarClienteAutenticado(token);
        var baixaResponse = await client.PatchAsJsonAsync(
            $"/api/financeiro/receber/{contaReceberId}",
            new ReceberRequest(1000m, "pix"));

        Assert.Equal(HttpStatusCode.OK, baixaResponse.StatusCode);

        var contaReceber = await baixaResponse.Content.ReadFromJsonAsync<ContaReceberResponse>();
        Assert.NotNull(contaReceber);
        Assert.Equal(StatusContaReceber.Pago.ToString(), contaReceber.Status);

        var contasPagarResponse = await client.GetAsync("/api/financeiro/contas-pagar/pendentes");
        Assert.Equal(HttpStatusCode.OK, contasPagarResponse.StatusCode);

        var contasPagar = await contasPagarResponse.Content.ReadFromJsonAsync<List<ContaPagarResponse>>();
        Assert.NotNull(contasPagar);

        var contaComissao = contasPagar.SingleOrDefault(
            conta => conta.Descricao.Contains(contaReceberId.ToString(), StringComparison.Ordinal));
        Assert.NotNull(contaComissao);
        Assert.Equal("Comissao", contaComissao.Categoria);
        Assert.Equal(dentistaId, contaComissao.DentistaId);
        Assert.Equal(100m, contaComissao.Valor);
        Assert.Equal(StatusContaPagar.Pendente.ToString(), contaComissao.Status);
    }

    [Fact]
    public async Task Receber_FalhaNaGeracaoDeComissao_Nao_DevePersistirContaPagar_NemTrocarStatus()
    {
        var tenant = await CriarTenantAsync();
        var token = await ObterTokenJwtAsync(tenant.Email);

        var pacienteId = await CriarPacienteAsync(tenant.ClinicaId);
        var dentistaId = await CriarDentistaAsync(
            tenant.ClinicaId,
            "Dr. Regra Inválida",
            """{"tipo":"PercentualFixo","percentual":0}""");
        var contaReceberId = await CriarContaReceberPendenteAsync(
            tenant.ClinicaId,
            pacienteId,
            dentistaId: dentistaId,
            valorBase: 500m);

        using var client = CriarClienteAutenticado(token);
        var baixaResponse = await client.PatchAsJsonAsync(
            $"/api/financeiro/receber/{contaReceberId}",
            new ReceberRequest(500m, "pix"));

        Assert.Equal(HttpStatusCode.BadRequest, baixaResponse.StatusCode);

        var recebimentosResponse = await client.GetAsync($"/api/financeiro/pendentes?pacienteId={pacienteId}");
        Assert.Equal(HttpStatusCode.OK, recebimentosResponse.StatusCode);

        var contasReceber = await recebimentosResponse.Content.ReadFromJsonAsync<List<ContaReceberResponse>>();
        Assert.NotNull(contasReceber);
        var conta = Assert.Single(contasReceber, c => c.Id == contaReceberId);
        Assert.Equal(StatusContaReceber.Pendente.ToString(), conta.Status);

        var contasPagarResponse = await client.GetAsync("/api/financeiro/contas-pagar/pendentes");
        Assert.Equal(HttpStatusCode.OK, contasPagarResponse.StatusCode);

        var contasPagar = await contasPagarResponse.Content.ReadFromJsonAsync<List<ContaPagarResponse>>();
        Assert.NotNull(contasPagar);
        Assert.DoesNotContain(contasPagar, contaPagar => contaPagar.Descricao.Contains(contaReceberId.ToString(), StringComparison.Ordinal));
    }

    [Fact]
    public async Task Faturar_Plano_ComDentistasDiferentes_DeveRetornarFalha()
    {
        var tenant = await CriarTenantAsync();
        var token = await ObterTokenJwtAsync(tenant.Email);

        var pacienteId = await CriarPacienteAsync(tenant.ClinicaId);
        var prontuarioId = await CriarProntuarioAsync(tenant.ClinicaId, pacienteId);
        var dentistaId = await CriarDentistaAsync(
            tenant.ClinicaId,
            "Dr. Branco",
            """{"tipo":"PercentualFixo","percentual":20}""");
        var dentistaOutroId = await CriarDentistaAsync(
            tenant.ClinicaId,
            "Dr. Preto",
            """{"tipo":"PercentualFixo","percentual":35}""");

        var item1Id = await CriarItemPlanoTratamentoAsync(
            tenant.ClinicaId,
            prontuarioId,
            pacienteId,
            dentistaId);
        var item2Id = await CriarItemPlanoTratamentoAsync(
            tenant.ClinicaId,
            prontuarioId,
            pacienteId,
            dentistaOutroId);

        using var client = CriarClienteAutenticado(token);
        var faturarResponse = await client.PostAsJsonAsync(
            "/api/financeiro/faturar-plano",
            new { ItensPlanoTratamentoIds = new[] { item1Id, item2Id } });

        Assert.Equal(HttpStatusCode.BadRequest, faturarResponse.StatusCode);

        var pendentesResponse = await client.GetAsync($"/api/financeiro/pendentes?pacienteId={pacienteId}");
        Assert.Equal(HttpStatusCode.OK, pendentesResponse.StatusCode);

        var contasReceber = await pendentesResponse.Content.ReadFromJsonAsync<List<ContaReceberResponse>>();
        Assert.NotNull(contasReceber);
        Assert.Empty(contasReceber);
    }

    [Fact]
    public async Task RotasFinanceiras_Nao_DeveriamAceitarAcessoSemJwt()
    {
        using var client = _factory.CreateClient();

        var recebiResponse = await client.GetAsync("/api/financeiro/receber");
        var contasPagarResponse = await client.GetAsync("/api/financeiro/contas-pagar/pendentes");

        Assert.Equal(HttpStatusCode.Unauthorized, recebiResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, contasPagarResponse.StatusCode);
    }

    [Fact]
    public async Task RotasFinanceiras_Nao_DeveriamAceitarClinicaIdAusente()
    {
        using var client = _factory.CreateClient();

        var token = GerarTokenJwt(Guid.NewGuid(), PerfilUsuario.Gestor, includeClinicaId: false);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.GetAsync("/api/financeiro/pendentes?pacienteId=00000000-0000-0000-0000-000000000001");

        Assert.True(
            response.StatusCode is HttpStatusCode.Forbidden or HttpStatusCode.Unauthorized,
            $"Status esperado 401/403; recebido {response.StatusCode}.");
    }

    [Fact]
    public async Task RotasFinanceiras_Nao_DeveriamAceitarGestorSemPermissaoFinanceira()
    {
        using var client = _factory.CreateClient();

        var token = GerarTokenJwt(Guid.NewGuid(), PerfilUsuario.Gestor, includePermission: false);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.GetAsync("/api/financeiro/pendentes?pacienteId=00000000-0000-0000-0000-000000000002");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task EndpointsFinanceiros_DevemRespeitarFiltroMultiTenant()
    {
        var tenantA = await CriarTenantAsync();
        var tenantB = await CriarTenantAsync();

        var pacienteA = await CriarPacienteAsync(tenantA.ClinicaId);
        var pacienteB = await CriarPacienteAsync(tenantB.ClinicaId);

        var contaReceberA = await CriarContaReceberPendenteAsync(tenantA.ClinicaId, pacienteA);
        var contaReceberB = await CriarContaReceberPendenteAsync(tenantB.ClinicaId, pacienteB);

        var contaPagarA = await CriarContaPagarAsync(tenantA.ClinicaId, 110m, DefaultDate.AddDays(5), pagar: false);
        var contaPagarB = await CriarContaPagarAsync(tenantB.ClinicaId, 120m, DefaultDate.AddDays(5), pagar: false);

        var tokenA = await ObterTokenJwtAsync(tenantA.Email);

        using var clientA = CriarClienteAutenticado(tokenA);
        var receberResponseA = await clientA.GetAsync("/api/financeiro/receber?status=Pendente");
        var contasPagarResponseA = await clientA.GetAsync("/api/financeiro/contas-pagar/pendentes");

        Assert.Equal(HttpStatusCode.OK, receberResponseA.StatusCode);
        Assert.Equal(HttpStatusCode.OK, contasPagarResponseA.StatusCode);

        var contasReceberA = await receberResponseA.Content.ReadFromJsonAsync<List<ContaReceberResponse>>();
        var contasPagarA = await contasPagarResponseA.Content.ReadFromJsonAsync<List<ContaPagarResponse>>();

        Assert.NotNull(contasReceberA);
        Assert.NotNull(contasPagarA);

        var contaReceberAIds = contasReceberA.Select(item => item.Id).ToHashSet();
        var contaPagarAIds = contasPagarA.Select(item => item.Id).ToHashSet();

        Assert.Contains(contaReceberA, contaReceberAIds);
        Assert.DoesNotContain(contaReceberB, contaReceberAIds);
        Assert.Contains(contaPagarA, contaPagarAIds);
        Assert.DoesNotContain(contaPagarB, contaPagarAIds);
    }

    [Fact]
    public async Task EndpointsCrudFinanceiros_DevemRespeitarFiltroMultiTenant()
    {
        var tenantA = await CriarTenantAsync();
        var tenantB = await CriarTenantAsync();
        var tokenA = await ObterTokenJwtAsync(tenantA.Email);

        var pacienteA = await CriarPacienteAsync(tenantA.ClinicaId);
        var contaReceberA = await CriarContaReceberPendenteAsync(tenantA.ClinicaId, pacienteA, valorBase: 180m);
        var contaPagarA = await CriarContaPagarAsync(tenantA.ClinicaId, 210m, DefaultDate.AddDays(7), pagar: false);

        var pacienteB = await CriarPacienteAsync(tenantB.ClinicaId);
        var contaReceberB = await CriarContaReceberPendenteAsync(tenantB.ClinicaId, pacienteB, valorBase: 220m);
        var contaPagarB = await CriarContaPagarAsync(tenantB.ClinicaId, 230m, DefaultDate.AddDays(7), pagar: false);

        using var clienteA = CriarClienteAutenticado(tokenA);
        var recebResponse = await clienteA.PutAsJsonAsync(
            $"/api/financeiro/receber/{contaReceberA}",
            new
            {
                ValorBase = 200m,
                Desconto = 0m,
                DataVencimento = DateTime.UtcNow.Date.AddDays(8)
            });

        Assert.Equal(HttpStatusCode.OK, recebResponse.StatusCode);

        var recebBResponse = await clienteA.PutAsJsonAsync(
            $"/api/financeiro/receber/{contaReceberB}",
            new
            {
                ValorBase = 260m,
                Desconto = 0m,
                DataVencimento = DateTime.UtcNow.Date.AddDays(8)
            });
        Assert.Equal(HttpStatusCode.NotFound, recebBResponse.StatusCode);

        var deletarReceberB = await clienteA.DeleteAsync($"/api/financeiro/receber/{contaReceberB}");
        Assert.Equal(HttpStatusCode.NotFound, deletarReceberB.StatusCode);

        var pagarResponse = await clienteA.PutAsJsonAsync(
            $"/api/financeiro/contas-pagar/{contaPagarA}",
            new
            {
                FornecedorDestinatario = "Pagar atualizacao tenant",
                Categoria = "Teste",
                Descricao = "Valido no tenant A",
                Valor = 230m,
                DataVencimento = DateTime.UtcNow.Date.AddDays(7),
            });
        Assert.Equal(HttpStatusCode.OK, pagarResponse.StatusCode);

        var pagarBResponse = await clienteA.PutAsJsonAsync(
            $"/api/financeiro/contas-pagar/{contaPagarB}",
            new
            {
                FornecedorDestinatario = "Pagar bloqueado",
                Categoria = "Teste",
                Descricao = "Não deveria ser atualizado",
                Valor = 250m,
                DataVencimento = DateTime.UtcNow.Date.AddDays(7),
            });
        Assert.Equal(HttpStatusCode.NotFound, pagarBResponse.StatusCode);

        var deleteResponseB = await clienteA.DeleteAsync($"/api/financeiro/contas-pagar/{contaPagarB}");
        Assert.True(deleteResponseB.StatusCode == HttpStatusCode.NotFound || deleteResponseB.StatusCode == HttpStatusCode.BadRequest);
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
        Assert.False(string.IsNullOrWhiteSpace(login.Token));
        return login.Token;
    }

    private async Task<TenantSeed> CriarTenantAsync()
    {
        using var escopo = _factory.Services.CreateScope();
        var dbContext = escopo.ServiceProvider.GetRequiredService<OdontoCloudDbContext>();
        var contextAccessor = escopo.ServiceProvider.GetRequiredService<IHttpContextAccessor>();

        var nomeClinica = $"Clinica Teste {Guid.NewGuid():N}";
        var email = $"financeiro-teste-{Guid.NewGuid():N}@odontocloud.local";
        var clinica = new Clinica(nomeClinica, "Pro");

        contextAccessor.HttpContext = CriaHttpContext(Guid.NewGuid());

        try
        {
            dbContext.Clinicas.Add(clinica);
            await dbContext.SaveChangesAsync();

            contextAccessor.HttpContext = CriaHttpContext(clinica.Id);

            var usuario = new Usuario(
                clinica.Id,
                "Usuario Financeiro",
                email,
                "123",
                PerfilUsuario.Admin);

            dbContext.Usuarios.Add(usuario);
            await dbContext.SaveChangesAsync();

            return new TenantSeed(clinica.Id, email, usuario.Id);
        }
        finally
        {
            contextAccessor.HttpContext = null;
        }
    }

    private async Task<string> ObterStatusContaReceberAsync(Guid clinicaId, Guid contaId)
    {
        return await ExecutarNoTenantContext(clinicaId, context =>
        {
            var conta = context.ContasReceber.FirstOrDefault(c => c.Id == contaId);
            return conta?.Status ?? string.Empty;
        });
    }

    private async Task<string> ObterStatusContaPagarAsync(Guid clinicaId, Guid contaId)
    {
        return await ExecutarNoTenantContext(clinicaId, context =>
        {
            var conta = context.ContasPagar.FirstOrDefault(c => c.Id == contaId);
            return conta?.Status.ToString() ?? string.Empty;
        });
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

    private async Task<Guid> CriarContaReceberPendenteAsync(
        Guid clinicaId,
        Guid pacienteId,
        Guid? dentistaId = null,
        DateTime? dataVencimento = null,
        decimal valorBase = 100m,
        decimal desconto = 0m)
    {
        var conta = await ExecutarNoTenantContext(clinicaId, context =>
        {
            var novaConta = new ContaReceber(
                pacienteId,
                null,
                dentistaId,
                valorBase,
                desconto,
                dataVencimento ?? DateTime.UtcNow.AddDays(2));

            context.ContasReceber.Add(novaConta);
            return novaConta;
        });

        return conta.Id;
    }

    private async Task<Guid> CriarDentistaAsync(
        Guid clinicaId,
        string nome,
        string regraComissaoJson)
    {
        var dentista = await ExecutarNoTenantContext(clinicaId, context =>
        {
            var dentista = new Dentista(clinicaId, nome, regraComissaoJson: regraComissaoJson);
            context.Dentistas.Add(dentista);
            return dentista;
        });

        return dentista.Id;
    }

    private async Task<Guid> CriarProntuarioAsync(
        Guid clinicaId,
        Guid pacienteId)
    {
        var prontuario = await ExecutarNoTenantContext(clinicaId, context =>
        {
            var prontuario = new Prontuario(pacienteId, "{}", "{}");
            context.Prontuarios.Add(prontuario);
            return prontuario;
        });

        return prontuario.Id;
    }

    private async Task<Guid> CriarItemPlanoTratamentoAsync(
        Guid clinicaId,
        Guid prontuarioId,
        Guid pacienteId,
        Guid dentistaId)
    {
        var item = await ExecutarNoTenantContext(clinicaId, context =>
        {
            var item = new ItemPlanoTratamento(
                prontuarioId,
                pacienteId,
                "18",
                18,
                dentistaId,
                "ok",
                "Consulta",
                120m);

            context.ItensPlanoTratamento.Add(item);
            return item;
        });

        return item.Id;
    }

    private async Task CriarContaReceberParcialAsync(
        Guid clinicaId,
        Guid pacienteId,
        Guid usuarioId,
        DateTime? dataVencimento = null,
        decimal valorBase = 100m)
    {
        await ExecutarNoTenantContext(clinicaId, context =>
        {
            var novaConta = new ContaReceber(
                pacienteId,
                null,
                null,
                valorBase,
                desconto: 0m,
                dataVencimento ?? DateTime.UtcNow.AddDays(2));

            novaConta.RegistrarPagamento(10m, "pix", usuarioId, DateTime.UtcNow);
            context.ContasReceber.Add(novaConta);
            return novaConta;
        });
    }

    private async Task<Guid> CriarContaPagarAsync(
        Guid clinicaId,
        decimal valor,
        DateTime? dataVencimento = null,
        bool pagar = false,
        Guid? usuarioBaixaId = null)
    {
        var conta = await ExecutarNoTenantContext(clinicaId, context =>
        {
            var novaConta = new ContaPagar(
                $"Fornecedor {Guid.NewGuid():N}",
                "Teste",
                "Despesa de teste",
                valor,
                dataVencimento ?? DateTime.UtcNow.AddDays(2));

            if (pagar)
            {
                novaConta.RegistrarPagamento(usuarioBaixaId!.Value, DateTime.UtcNow);
            }

            context.ContasPagar.Add(novaConta);
            return novaConta;
        });

        return conta.Id;
    }

    private async Task<T> ExecutarNoTenantContext<T>(Guid clinicaId, Func<OdontoCloudDbContext, T> acao)
    {
        using var escopo = _factory.Services.CreateScope();
        var contextoHttp = escopo.ServiceProvider.GetRequiredService<IHttpContextAccessor>();
        contextoHttp.HttpContext = CriaHttpContext(clinicaId);

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

    private static string GerarTokenJwt(
        Guid clinicaId,
        PerfilUsuario perfil,
        bool includePermission = false,
        bool includeClinicaId = true)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()),
            new(ClaimTypes.Name, "Usuario Teste"),
            new(ClaimTypes.Email, $"test+{Guid.NewGuid():N}@odontocloud.local"),
            new(ClaimTypes.Role, perfil.ToString())
        };

        if (includeClinicaId)
        {
            claims.Add(new(AuthClaims.ClinicaId, clinicaId.ToString()));
        }

        if (includePermission)
        {
            claims.Add(new(
                AuthClaims.Permission,
                $"{ModuloSistema.Financeiro}:{AcaoPermissao.Visualizar}:True"));
        }

        var handler = new JwtSecurityTokenHandler();
        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(JwtKey));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var token = handler.CreateJwtSecurityToken(
            issuer: JwtIssuer,
            audience: JwtAudience,
            subject: new ClaimsIdentity(claims),
            expires: DateTime.UtcNow.AddHours(1),
            signingCredentials: credentials);

        return handler.WriteToken(token);
    }

    private sealed record LoginResponse(string Token);
    private sealed record TenantSeed(Guid ClinicaId, string Email, Guid UsuarioId);
    private sealed record ReceberRequest(decimal ValorPago, string FormaPagamento);
    private sealed record ContaReceberResponse(
        Guid Id,
        Guid PacienteId,
        Guid? ItemPlanoTratamentoId,
        decimal ValorBase,
        decimal Desconto,
        decimal ValorFinal,
        DateTime DataVencimento,
        DateTime? DataPagamento,
        string? FormaPagamento,
        Guid? UsuarioBaixaId,
        string Status);
    private sealed record CreateContaReceberRequest(
        Guid PacienteId,
        Guid? ItemPlanoTratamentoId,
        Guid? DentistaId,
        decimal ValorBase,
        decimal Desconto,
        DateTime DataVencimento);
    private sealed record ContaPagarResponse(
        Guid Id,
        string FornecedorDestinatario,
        string Categoria,
        string Descricao,
        decimal Valor,
        DateTime DataVencimento,
        DateTime? DataPagamento,
        Guid? UsuarioBaixaId,
        Guid? DentistaId,
        string Status);
}
