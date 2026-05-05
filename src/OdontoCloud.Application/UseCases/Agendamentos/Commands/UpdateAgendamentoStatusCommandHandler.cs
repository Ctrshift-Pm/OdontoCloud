using MediatR;
using OdontoCloud.Application.Interfaces;

namespace OdontoCloud.Application.UseCases.Agendamentos.Commands;

public sealed class UpdateAgendamentoStatusCommandHandler : IRequestHandler<UpdateAgendamentoStatusCommand, AgendamentoDto?>
{
    private readonly IAgendamentoRepository _agendamentoRepository;

    public UpdateAgendamentoStatusCommandHandler(IAgendamentoRepository agendamentoRepository)
    {
        _agendamentoRepository = agendamentoRepository;
    }

    public async Task<AgendamentoDto?> Handle(UpdateAgendamentoStatusCommand request, CancellationToken cancellationToken)
    {
        var agendamento = await _agendamentoRepository.GetByIdAsync(request.AgendamentoId, cancellationToken);
        if (agendamento is null)
        {
            return null;
        }

        agendamento.AtualizarStatus(request.NovoStatus);
        await _agendamentoRepository.SaveChangesAsync(cancellationToken);

        return new AgendamentoDto(
            agendamento.Id,
            agendamento.PacienteId,
            agendamento.Paciente?.Nome ?? string.Empty,
            agendamento.DentistaId,
            agendamento.Dentista?.Nome ?? string.Empty,
            agendamento.DataHora,
            agendamento.DuracaoMinutos,
            agendamento.Status,
            agendamento.Procedimento,
            agendamento.Observacoes);
    }
}
