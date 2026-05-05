using FluentValidation;
using MediatR;
using OdontoCloud.Application.Interfaces;
using OdontoCloud.Domain.Entities;
using OdontoCloud.Domain.Enums;

namespace OdontoCloud.Application.UseCases.Financeiro.Commands;

public sealed class FaturarPlanoTratamentoCommandHandler : IRequestHandler<FaturarPlanoTratamentoCommand, ContaReceberDto>
{
    private readonly IContaReceberRepository _contaReceberRepository;
    private readonly IItemPlanoTratamentoRepository _itemPlanoTratamentoRepository;

    public FaturarPlanoTratamentoCommandHandler(
        IContaReceberRepository contaReceberRepository,
        IItemPlanoTratamentoRepository itemPlanoTratamentoRepository)
    {
        _contaReceberRepository = contaReceberRepository;
        _itemPlanoTratamentoRepository = itemPlanoTratamentoRepository;
    }

    public async Task<ContaReceberDto> Handle(FaturarPlanoTratamentoCommand request, CancellationToken cancellationToken)
    {
        var itens = await _itemPlanoTratamentoRepository.GetByIdsAsync(request.ItensPlanoTratamentoIds, cancellationToken);

        if (itens.Count == 0)
        {
            throw new ValidationException("Nenhum item de plano de tratamento foi encontrado.");
        }

        var pacienteId = itens[0].PacienteId;
        if (itens.Any(item => item.PacienteId != pacienteId))
        {
            throw new ValidationException("Todos os itens faturados devem pertencer ao mesmo paciente.");
        }

        var dentistasAssociados = itens
            .Where(item => item.DentistaId.HasValue)
            .Select(item => item.DentistaId!.Value)
            .Distinct()
            .ToList();

        if (dentistasAssociados.Count > 1)
        {
            throw new ValidationException("Todos os itens faturados devem pertencer ao mesmo dentista para gerar comissao automatica.");
        }

        var valorBase = itens.Sum(item => item.ValorBase);
        Guid? itemPlanoTratamentoId = itens.Count == 1 ? itens[0].Id : null;
        Guid? dentistaId = dentistasAssociados.Count == 1 ? dentistasAssociados[0] : null;

        foreach (var item in itens)
        {
            if (string.Equals(item.Status, StatusItemPlano.Orcado.ToString(), StringComparison.Ordinal))
            {
                item.Aprovar();
            }
        }

        var contaReceber = new ContaReceber(
            pacienteId,
            itemPlanoTratamentoId,
            dentistaId,
            valorBase,
            desconto: 0m,
            dataVencimento: DateTime.SpecifyKind(DateTime.UtcNow.Date, DateTimeKind.Utc));

        await _contaReceberRepository.AddAsync(contaReceber, cancellationToken);
        await _contaReceberRepository.SaveChangesAsync(cancellationToken);

        return new ContaReceberDto(
            contaReceber.Id,
            contaReceber.PacienteId,
            contaReceber.ItemPlanoTratamentoId,
            contaReceber.ValorBase,
            contaReceber.Desconto,
            contaReceber.ValorFinal,
            contaReceber.DataVencimento,
            contaReceber.DataPagamento,
            contaReceber.FormaPagamento,
            contaReceber.UsuarioBaixaId,
            contaReceber.Status);
    }
}
