using MediatR;
using OdontoCloud.Application.Interfaces;

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

    private static DateTime EnsureUtc(DateTime dateTime)
    {
        return dateTime.Kind switch
        {
            DateTimeKind.Utc => dateTime,
            DateTimeKind.Unspecified => DateTime.SpecifyKind(dateTime, DateTimeKind.Utc),
            _ => dateTime.ToUniversalTime(),
        };
    }
}
