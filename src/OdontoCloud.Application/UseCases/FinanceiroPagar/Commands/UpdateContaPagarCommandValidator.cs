using FluentValidation;

namespace OdontoCloud.Application.UseCases.FinanceiroPagar.Commands;

public sealed class UpdateContaPagarCommandValidator : AbstractValidator<UpdateContaPagarCommand>
{
    public UpdateContaPagarCommandValidator()
    {
        RuleFor(command => command.ContaPagarId)
            .NotEmpty();

        RuleFor(command => command.FornecedorDestinatario)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(command => command.Categoria)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(command => command.Descricao)
            .NotEmpty()
            .MaximumLength(400);

        RuleFor(command => command.Valor)
            .GreaterThan(0m);

        RuleFor(command => command.DataVencimento)
            .NotEqual(default(DateTime));
    }
}
