using FluentValidation;

namespace OdontoCloud.Application.UseCases.Financeiro.Commands;

public sealed class CreateContaReceberCommandValidator : AbstractValidator<CreateContaReceberCommand>
{
    public CreateContaReceberCommandValidator()
    {
        RuleFor(command => command.PacienteId)
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
