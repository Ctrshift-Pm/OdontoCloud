using FluentValidation;
using OdontoCloud.Domain.Enums;

namespace OdontoCloud.Application.UseCases.Pacientes.Commands;

public sealed class UpdatePacienteKanbanStatusCommandValidator : AbstractValidator<UpdatePacienteKanbanStatusCommand>
{
    public UpdatePacienteKanbanStatusCommandValidator()
    {
        RuleFor(command => command.CrmKanbanStatus)
            .NotEmpty()
            .Must(status => Enum.TryParse<CrmKanbanStatus>(status, ignoreCase: true, out _))
            .WithMessage("Status do Kanban inválido.");
    }
}
