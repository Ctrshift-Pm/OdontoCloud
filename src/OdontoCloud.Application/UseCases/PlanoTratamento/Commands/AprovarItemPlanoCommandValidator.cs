using FluentValidation;

namespace OdontoCloud.Application.UseCases.PlanoTratamento.Commands;

public sealed class AprovarItemPlanoCommandValidator : AbstractValidator<AprovarItemPlanoCommand>
{
    public AprovarItemPlanoCommandValidator()
    {
        RuleFor(command => command.ItemPlanoTratamentoId)
            .NotEmpty();
    }
}
