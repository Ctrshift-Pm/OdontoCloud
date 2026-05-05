using FluentValidation;

namespace OdontoCloud.Application.UseCases.PlanoTratamento.Commands;

public sealed class ConcluirItemPlanoCommandValidator : AbstractValidator<ConcluirItemPlanoCommand>
{
    public ConcluirItemPlanoCommandValidator()
    {
        RuleFor(command => command.ItemPlanoTratamentoId)
            .NotEmpty();
    }
}
