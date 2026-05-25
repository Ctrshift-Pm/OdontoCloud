using MediatR;
using OdontoCloud.Application.Interfaces;
using OdontoCloud.Domain.Enums;

namespace OdontoCloud.Application.UseCases.FinanceiroPagar.Queries;

public sealed class GetContasPagarPendentesQueryHandler : IRequestHandler<GetContasPagarPendentesQuery, IReadOnlyList<ContaPagarDto>>
{
    private readonly IContaPagarRepository _contaPagarRepository;

    public GetContasPagarPendentesQueryHandler(IContaPagarRepository contaPagarRepository)
    {
        _contaPagarRepository = contaPagarRepository;
    }

    public async Task<IReadOnlyList<ContaPagarDto>> Handle(
        GetContasPagarPendentesQuery request,
        CancellationToken cancellationToken)
    {
        var contas = await _contaPagarRepository.GetPendentesEAtrasadasAsync(cancellationToken);

        var agoraUtc = DateTime.UtcNow;

        return contas
            .Select(conta => new ContaPagarDto(
                conta.Id,
                conta.FornecedorDestinatario,
                conta.Categoria,
                conta.Descricao,
                conta.Valor,
                conta.DataVencimento,
                conta.DataPagamento,
                conta.UsuarioBaixaId,
                conta.DentistaId,
                ((conta.Status == StatusContaPagar.Pendente && agoraUtc.Date > conta.DataVencimento.Date)
                        ? StatusContaPagar.Atrasado
                        : conta.Status)
                    .ToString()))
            .ToList();
    }
}
