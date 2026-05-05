using MediatR;

namespace OdontoCloud.Application.UseCases.Agendamentos.Commands;

public sealed record UpdateAgendamentoStatusCommand(Guid AgendamentoId, string NovoStatus) : IRequest<AgendamentoDto?>;
