using MediatR;
using OdontoCloud.Application.Interfaces;

namespace OdontoCloud.Application.UseCases.Financeiro.Queries;

public sealed class GetContasReceberPendentesQueryHandler : IRequestHandler<GetContasReceberPendentesQuery, IReadOnlyList<ContaReceberDto>>
{
    private readonly IContaReceberRepository _contaReceberRepository;

    public GetContasReceberPendentesQueryHandler(IContaReceberRepository contaReceberRepository)
    {
        _contaReceberRepository = contaReceberRepository;
    }

    public async Task<IReadOnlyList<ContaReceberDto>> Handle(GetContasReceberPendentesQuery request, CancellationToken cancellationToken)
    {
        var contas = await _contaReceberRepository.GetPendentesByPacienteIdAsync(request.PacienteId, cancellationToken);

        foreach (var conta in contas)
        {
            conta.MarcarComoAtrasadoSeNecessario(DateTime.UtcNow);
        }

        await _contaReceberRepository.SaveChangesAsync(cancellationToken);

        return contas
            .Select(conta => new ContaReceberDto(
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
                conta.Status))
            .ToList();
    }
}
