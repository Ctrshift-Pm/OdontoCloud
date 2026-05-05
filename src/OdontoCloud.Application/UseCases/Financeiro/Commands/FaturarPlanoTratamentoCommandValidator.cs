using FluentValidation;

namespace OdontoCloud.Application.UseCases.Financeiro.Commands;

public sealed class FaturarPlanoTratamentoCommandValidator : AbstractValidator<FaturarPlanoTratamentoCommand>
{
    public FaturarPlanoTratamentoCommandValidator()
    {
        RuleFor(command => command.ItensPlanoTratamentoIds)
            .NotEmpty();
    }
}
