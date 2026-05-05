using MediatR;

namespace OdontoCloud.Application.UseCases.Dentistas.Queries;

public sealed record GetDentistasQuery() : IRequest<IReadOnlyList<DentistaDto>>;
