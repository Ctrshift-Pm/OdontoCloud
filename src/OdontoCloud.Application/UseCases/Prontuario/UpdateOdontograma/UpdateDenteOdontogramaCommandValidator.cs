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

        RuleFor(command => command.CariePercentual)
            .Custom((cariePercentual, context) =>
            {
                if (!Enum.TryParse<StatusDenteOdontograma>(context.InstanceToValidate.Status, true, out var status))
                {
                    return;
                }

                if (status == StatusDenteOdontograma.carie)
                {
                    if (!OdontogramaHelper.IsValidCariePercentual(cariePercentual))
                    {
                        context.AddFailure("Quando status for carie, o percentual deve ser informado entre 1 e 100 ou omitido para uso do padrão 100.");
                    }

                    return;
                }

                if (status != StatusDenteOdontograma.carie && cariePercentual is not null)
                {
                    context.AddFailure("Percentual de cárie só pode ser informado quando o status for carie.");
                }
            });
    }
}
