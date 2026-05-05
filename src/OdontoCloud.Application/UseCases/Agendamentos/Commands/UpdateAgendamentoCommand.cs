using MediatR;

namespace OdontoCloud.Application.UseCases.Agendamentos.Commands;

public sealed record UpdateAgendamentoCommand(
    Guid AgendamentoId,
    Guid PacienteId,
    Guid DentistaId,
    DateTime DataHora,
    int DuracaoMinutos,
    string Status,
    string Procedimento,
    string? Observacoes) : IRequest<AgendamentoDto?>;
