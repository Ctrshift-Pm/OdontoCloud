using MediatR;

namespace OdontoCloud.Application.UseCases.IaAtendimento.Commands;

public sealed record AssumirIaLeadCommand(Guid Id) : IRequest<IaLeadDto?>;
