using FluentValidation;

namespace OdontoCloud.Application.UseCases.Financeiro.Queries;

public sealed class GetContasReceberPorPeriodoQueryValidator : AbstractValidator<GetContasReceberPorPeriodoQuery>
{
    public GetContasReceberPorPeriodoQueryValidator()
    {
        RuleFor(query => query.Status)
            .IsInEnum()
            .When(query => query.Status.HasValue);

        RuleFor(query => query.DataFim)
            .GreaterThanOrEqualTo(query => query.DataInicio)
            .When(query => query.DataFim.HasValue && query.DataInicio.HasValue);
    }
}
