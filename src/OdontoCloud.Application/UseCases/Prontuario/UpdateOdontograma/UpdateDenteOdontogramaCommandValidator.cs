using FluentValidation;
using OdontoCloud.Domain.Enums;

namespace OdontoCloud.Application.UseCases.Prontuario.UpdateOdontograma;

public sealed class UpdateDenteOdontogramaCommandValidator : AbstractValidator<UpdateDenteOdontogramaCommand>
{
    public UpdateDenteOdontogramaCommandValidator()
    {
        RuleFor(command => command.ProntuarioId)
            .NotEmpty();

        RuleFor(command => command.Dente)
            .NotEmpty()
            .Must(OdontogramaHelper.IsValidTooth)
            .WithMessage("Dente FDI inválido.");

        RuleFor(command => command.Status)
            .NotEmpty()
            .Must(status => Enum.TryParse<StatusDenteOdontograma>(status, true, out _))
            .WithMessage("Status do odontograma inválido.");
    }
}
