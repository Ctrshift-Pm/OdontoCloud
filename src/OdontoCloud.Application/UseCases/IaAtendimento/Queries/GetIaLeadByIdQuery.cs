using MediatR;

namespace OdontoCloud.Application.UseCases.IaAtendimento.Queries;

public sealed record GetIaLeadByIdQuery(Guid Id) : IRequest<IaLeadDto?>;
