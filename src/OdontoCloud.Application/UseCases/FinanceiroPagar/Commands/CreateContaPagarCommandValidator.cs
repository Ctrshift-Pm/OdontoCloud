using FluentValidation;

namespace OdontoCloud.Application.UseCases.FinanceiroPagar.Commands;

public sealed class CreateContaPagarCommandValidator : AbstractValidator<CreateContaPagarCommand>
{
    public CreateContaPagarCommandValidator()
    {
        RuleFor(command => command.FornecedorDestinatario)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(command => command.Categoria)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(command => command.Descricao)
            .NotEmpty()
            .MaximumLength(500);

        RuleFor(command => command.Valor)
            .GreaterThan(0m);
    }
}
