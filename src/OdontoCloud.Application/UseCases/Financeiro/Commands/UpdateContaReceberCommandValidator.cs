using FluentValidation;

namespace OdontoCloud.Application.UseCases.Financeiro.Commands;

public sealed class UpdateContaReceberCommandValidator : AbstractValidator<UpdateContaReceberCommand>
{
    public UpdateContaReceberCommandValidator()
    {
        RuleFor(command => command.ContaReceberId)
            .NotEmpty();

        RuleFor(command => command.ValorBase)
            .GreaterThan(0m);

        RuleFor(command => command.Desconto)
            .GreaterThanOrEqualTo(0m)
            .LessThanOrEqualTo(command => command.ValorBase);

        RuleFor(command => command.DataVencimento)
            .NotEqual(default(DateTime));
    }
}
