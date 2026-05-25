using MediatR;

namespace OdontoCloud.Application.UseCases.Pacientes.Commands;

public sealed record UpdatePacienteKanbanStatusCommand(
    Guid PacienteId,
    string CrmKanbanStatus) : IRequest<PacienteDto>;
