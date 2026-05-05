using MediatR;
using OdontoCloud.Application.Interfaces;

namespace OdontoCloud.Application.UseCases.Agendamentos.Commands;

public sealed class DeleteAgendamentoCommandHandler : IRequestHandler<DeleteAgendamentoCommand, bool>
{
    private readonly IAgendamentoRepository _agendamentoRepository;

    public DeleteAgendamentoCommandHandler(IAgendamentoRepository agendamentoRepository)
    {
        _agendamentoRepository = agendamentoRepository;
    }

    public async Task<bool> Handle(DeleteAgendamentoCommand request, CancellationToken cancellationToken)
    {
        var agendamento = await _agendamentoRepository.GetByIdAsync(request.AgendamentoId, cancellationToken);
        if (agendamento is null)
        {
            return false;
        }

        _agendamentoRepository.Remove(agendamento);
        await _agendamentoRepository.SaveChangesAsync(cancellationToken);
        return true;
    }
}
