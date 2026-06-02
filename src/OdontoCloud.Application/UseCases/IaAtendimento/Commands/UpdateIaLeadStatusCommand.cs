using MediatR;

namespace OdontoCloud.Application.UseCases.IaAtendimento.Commands;

public sealed record UpdateIaLeadStatusCommand(Guid Id, string Status) : IRequest<IaLeadDto?>;
