using MediatR;
using OdontoCloud.Application.Interfaces;
using OdontoCloud.Domain.Enums;

namespace OdontoCloud.Application.UseCases.Pacientes.Commands;

public sealed class UpdatePacienteKanbanStatusCommandHandler
    : IRequestHandler<UpdatePacienteKanbanStatusCommand, PacienteDto?>
{
    private readonly IPacienteRepository _pacienteRepository;

    public UpdatePacienteKanbanStatusCommandHandler(IPacienteRepository pacienteRepository)
    {
        _pacienteRepository = pacienteRepository;
    }

    public async Task<PacienteDto?> Handle(
        UpdatePacienteKanbanStatusCommand request,
        CancellationToken cancellationToken)
    {
        var paciente = await _pacienteRepository.GetByIdTrackingAsync(request.PacienteId, cancellationToken);
        if (paciente is null)
        {
            return null;
        }

        var novoStatus = Enum.Parse<CrmKanbanStatus>(request.CrmKanbanStatus, ignoreCase: true);
        paciente.AtualizarStatusCrmKanban(novoStatus);

        await _pacienteRepository.SaveChangesAsync(cancellationToken);
        return PacienteDto.FromEntity(paciente);
    }
}
