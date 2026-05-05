using MediatR;

namespace OdontoCloud.Application.UseCases.FinanceiroPagar.Queries;

public sealed record GetContasPagarPendentesQuery : IRequest<IReadOnlyList<ContaPagarDto>>;
