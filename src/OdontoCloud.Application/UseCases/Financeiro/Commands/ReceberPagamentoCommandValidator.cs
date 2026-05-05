using FluentValidation;

namespace OdontoCloud.Application.UseCases.Financeiro.Commands;

public sealed class ReceberPagamentoCommandValidator : AbstractValidator<ReceberPagamentoCommand>
{
    public ReceberPagamentoCommandValidator()
    {
        RuleFor(command => command.ContaReceberId)
            .NotEmpty();

        RuleFor(command => command.ValorPago)
            .GreaterThan(0);

        RuleFor(command => command.FormaPagamento)
            .NotEmpty()
            .MaximumLength(50);
    }
}
