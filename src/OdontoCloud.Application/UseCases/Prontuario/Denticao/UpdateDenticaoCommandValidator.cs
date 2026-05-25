using FluentValidation;
using OdontoCloud.Domain.Enums;

namespace OdontoCloud.Application.UseCases.Prontuario.UseCases.Prontuario.Denticao;

public sealed class UpdateDenticaoCommandValidator : AbstractValidator<UpdateDenticaoCommand>
{
    public UpdateDenticaoCommandValidator()
    {
        RuleFor(command => command.ProntuarioId)
            .NotEmpty();

        RuleFor(command => command.DenticaoAtiva)
            .NotEmpty()
            .Must(denticao => Enum.TryParse<TipoDenticao>(denticao, true, out _))
            .WithMessage("DenticaoAtiva deve ser Permanente, Decidua ou Mista.");
    }
}
