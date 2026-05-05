using FluentValidation;

namespace OdontoCloud.Application.UseCases.FinanceiroPagar.Commands;

public sealed class PagarContaPagarCommandValidator : AbstractValidator<PagarContaPagarCommand>
{
    public PagarContaPagarCommandValidator()
    {
        RuleFor(command => command.ContaPagarId)
            .NotEmpty();
    }
}
