using FluentValidation;

namespace OdontoCloud.Application.UseCases.Prontuario.UpdateAnamnese;

public sealed class UpdateAnamneseCommandValidator : AbstractValidator<UpdateAnamneseCommand>
{
    public UpdateAnamneseCommandValidator()
    {
        RuleFor(command => command.ProntuarioId)
            .NotEmpty();
    }
}
