using MediatR;
using OdontoCloud.Application.Interfaces;
using OdontoCloud.Domain.Enums;

namespace OdontoCloud.Application.UseCases.Financeiro.Queries;

public sealed class GetContasReceberPorPeriodoQueryHandler : IRequestHandler<GetContasReceberPorPeriodoQuery, IReadOnlyList<ContaReceberDto>>
{
    private readonly IContaReceberRepository _contaReceberRepository;

    public GetContasReceberPorPeriodoQueryHandler(IContaReceberRepository contaReceberRepository)
    {
        _contaReceberRepository = contaReceberRepository;
    }

    public async Task<IReadOnlyList<ContaReceberDto>> Handle(
        GetContasReceberPorPeriodoQuery request,
        CancellationToken cancellationToken)
    {
        DateTime? dataInicioUtc = request.DataInicio.HasValue
            ? EnsureUtc(request.DataInicio.Value).Date
            : null;
        DateTime? dataFimUtc = request.DataFim.HasValue
            ? EnsureUtc(request.DataFim.Value).Date.AddDays(1)
            : null;

        var contas = await _contaReceberRepository.GetPorPeriodoEStatusAsync(
            dataInicioUtc,
            dataFimUtc,
            request.Status,
            cancellationToken);

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

    private static DateTime EnsureUtc(DateTime dateTime)
    {
        return dateTime.Kind switch
        {
            DateTimeKind.Utc => dateTime,
            DateTimeKind.Unspecified => DateTime.SpecifyKind(dateTime, DateTimeKind.Utc),
            _ => dateTime.ToUniversalTime(),
        };
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
