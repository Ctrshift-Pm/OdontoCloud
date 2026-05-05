using FluentValidation;
using OdontoCloud.Domain.Enums;

namespace OdontoCloud.Application.UseCases.Agendamentos.Commands;

public sealed class UpdateAgendamentoStatusCommandValidator : AbstractValidator<UpdateAgendamentoStatusCommand>
{
    public UpdateAgendamentoStatusCommandValidator()
    {
        RuleFor(command => command.AgendamentoId)
            .NotEmpty();

        RuleFor(command => command.NovoStatus)
            .NotEmpty()
            .Must(status => Enum.TryParse<StatusAgendamento>(status, true, out _))
            .WithMessage("Status de agendamento inválido.");
    }
}
