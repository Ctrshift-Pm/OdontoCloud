using MediatR;

namespace OdontoCloud.Application.UseCases.IaAtendimento.Queries;

public sealed record GetAllIaLeadsQuery : IRequest<IReadOnlyList<IaLeadDto>>;
