using FluentValidation;
using MediatR;
using OdontoCloud.Application.Interfaces;
using OdontoCloud.Application.UseCases.FinanceiroPagar;
using OdontoCloud.Domain.Entities;
using OdontoCloud.Domain.Enums;

namespace OdontoCloud.Application.UseCases.Financeiro.Commands;

public sealed class ReceberPagamentoCommandHandler : IRequestHandler<ReceberPagamentoCommand, ContaReceberDto?>
{
    private readonly IContaReceberRepository _contaReceberRepository;
    private readonly IContaPagarRepository _contaPagarRepository;
    private readonly IDentistaRepository _dentistaRepository;
    private readonly ITenantService _tenantService;

    public ReceberPagamentoCommandHandler(
        IContaReceberRepository contaReceberRepository,
        IContaPagarRepository contaPagarRepository,
        IDentistaRepository dentistaRepository,
        ITenantService tenantService)
    {
        _contaReceberRepository = contaReceberRepository;
        _contaPagarRepository = contaPagarRepository;
        _dentistaRepository = dentistaRepository;
        _tenantService = tenantService;
    }

    public async Task<ContaReceberDto?> Handle(ReceberPagamentoCommand request, CancellationToken cancellationToken)
    {
        var conta = await _contaReceberRepository.GetByIdAsync(request.ContaReceberId, cancellationToken);
        if (conta is null)
        {
            return null;
        }

        if (request.ValorPago > conta.ValorFinal)
        {
            throw new ValidationException("O valor pago nao pode ser maior que o saldo em aberto.");
        }

        var usuarioId = _tenantService.GetCurrentUsuarioId();

        conta.RegistrarPagamento(
            request.ValorPago,
            request.FormaPagamento,
            usuarioId,
            DateTime.UtcNow);

        if (string.Equals(conta.Status, StatusContaReceber.Pago.ToString(), StringComparison.Ordinal))
        {
            await GerarComissaoAsync(conta, cancellationToken);
        }

        await _contaReceberRepository.SaveChangesAsync(cancellationToken);

        return new ContaReceberDto(
            conta.Id,
            conta.PacienteId,
            conta.ItemPlanoTratamentoId,
            conta.ValorBase,
            conta.Desconto,
            conta.ValorFinal,
            conta.DataVencimento,
            conta.DataPagamento,
            conta.FormaPagamento,
            conta.UsuarioBaixaId,
            conta.Status);
    }

    private async Task GerarComissaoAsync(
        ContaReceber conta,
        CancellationToken cancellationToken)
    {
        var dentistaId = conta.DentistaId ?? conta.ItemPlanoTratamento?.DentistaId;
        if (!dentistaId.HasValue)
        {
            return;
        }

        var dentista = await _dentistaRepository.GetByIdAsync(dentistaId.Value, cancellationToken);
        if (dentista is null)
        {
            throw new ValidationException("Dentista vinculado a comissao nao encontrado.");
        }

        var percentual = ComissaoRuleParser.ParsePercentualFixo(dentista.RegraComissaoJson);
        var baseComissao = Math.Max(conta.ValorBase - conta.Desconto, 0m);
        var valorComissao = Math.Round(baseComissao * (percentual / 100m), 2, MidpointRounding.AwayFromZero);

        if (valorComissao <= 0m)
        {
            return;
        }

        var contaPagar = new ContaPagar(
            dentista.Nome,
            "Comissao",
            $"Comissao da conta a receber {conta.Id}",
            valorComissao,
            DateTime.SpecifyKind(DateTime.UtcNow.Date, DateTimeKind.Utc),
            dentista.Id);

        await _contaPagarRepository.AddAsync(contaPagar, cancellationToken);
    }
}
