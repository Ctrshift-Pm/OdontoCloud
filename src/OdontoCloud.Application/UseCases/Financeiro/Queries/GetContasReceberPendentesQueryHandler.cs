using MediatR;
using OdontoCloud.Application.Interfaces;
using OdontoCloud.Domain.Enums;

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

        var agoraUtc = DateTime.UtcNow;

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
                (conta.Status != StatusContaReceber.Pendente.ToString() && conta.Status != StatusContaReceber.Parcial.ToString()
                    ? conta.Status
                    : ResolverStatusVisual(conta, agoraUtc))))
            .ToList();
    }

    private static string ResolverStatusVisual(Domain.Entities.ContaReceber conta, DateTime agoraUtc)
    {
        if ((conta.Status == StatusContaReceber.Pendente.ToString() || conta.Status == StatusContaReceber.Parcial.ToString()) &&
            agoraUtc.Date > conta.DataVencimento.Date)
        {
            return StatusContaReceber.Atrasado.ToString();
        }

        return conta.Status;
    }
}
