using FluentValidation;
using OdontoCloud.Domain.Enums;

namespace OdontoCloud.Application.UseCases.Agendamentos.Commands;

public sealed class CreateAgendamentoCommandValidator : AbstractValidator<CreateAgendamentoCommand>
{
    public CreateAgendamentoCommandValidator()
    {
        RuleFor(command => command.PacienteId)
            .NotEmpty();

        RuleFor(command => command.DentistaId)
            .NotEmpty();

        RuleFor(command => command.DataHora)
            .NotEmpty();

        RuleFor(command => command.DuracaoMinutos)
            .GreaterThan(0)
            .LessThanOrEqualTo(720);

        RuleFor(command => command.Procedimento)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(command => command.Status)
            .NotEmpty()
            .Must(status => Enum.TryParse<StatusAgendamento>(status, true, out _))
            .WithMessage("Status de agendamento inválido.");
    }
}
