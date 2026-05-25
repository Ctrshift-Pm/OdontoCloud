using System.Globalization;
using FluentValidation;

namespace OdontoCloud.Application.UseCases.Dentistas.Commands;

public sealed class UpdateDentistaAgendaConfigCommandValidator : AbstractValidator<UpdateDentistaAgendaConfigCommand>
{
    public UpdateDentistaAgendaConfigCommandValidator()
    {
        RuleFor(command => command.DentistaId)
            .NotEmpty();

        RuleFor(command => command.Inicio)
            .NotEmpty()
            .Must(IsHoraValida)
            .WithMessage("A propriedade 'inicio' deve usar o formato HH:mm.");

        RuleFor(command => command.Fim)
            .NotEmpty()
            .Must(IsHoraValida)
            .WithMessage("A propriedade 'fim' deve usar o formato HH:mm.");

        RuleFor(command => command.DuracaoPadraoMinutos)
            .GreaterThanOrEqualTo(10)
            .LessThanOrEqualTo(120)
            .WithMessage("A propriedade 'duracaoPadraoMinutos' deve ficar entre 10 e 120.");

        RuleFor(command => command.DiasDaSemana)
            .NotNull()
            .NotEmpty()
            .Must(dias => dias.All(dia => dia >= 0 && dia <= 6))
            .WithMessage("A propriedade 'diasDaSemana' precisa conter apenas valores entre 0 e 6.");
    }

    private static bool IsHoraValida(string value)
    {
        return TimeOnly.TryParseExact(
            value,
            "HH:mm",
            CultureInfo.InvariantCulture,
            DateTimeStyles.None,
            out _);
    }
}
