using MediatR;

namespace OdontoCloud.Application.UseCases.Agendamentos.Commands;

public sealed record DeleteAgendamentoCommand(Guid AgendamentoId) : IRequest<bool>;
