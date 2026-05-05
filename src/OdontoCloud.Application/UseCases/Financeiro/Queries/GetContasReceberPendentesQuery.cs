using MediatR;

namespace OdontoCloud.Application.UseCases.Financeiro.Queries;

public sealed record GetContasReceberPendentesQuery(Guid PacienteId) : IRequest<IReadOnlyList<ContaReceberDto>>;
