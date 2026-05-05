using MediatR;
using OdontoCloud.Application.Interfaces;

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

        foreach (var conta in contas)
        {
            conta.MarcarComoAtrasadoSeNecessario(DateTime.UtcNow);
        }

        await _contaPagarRepository.SaveChangesAsync(cancellationToken);

        return contas
            .Select(ContaPagarDto.FromEntity)
            .ToList();
    }
}
