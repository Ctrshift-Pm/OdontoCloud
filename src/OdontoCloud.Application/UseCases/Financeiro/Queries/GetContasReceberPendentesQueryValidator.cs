using FluentValidation;

namespace OdontoCloud.Application.UseCases.Financeiro.Queries;

public sealed class GetContasReceberPendentesQueryValidator : AbstractValidator<GetContasReceberPendentesQuery>
{
    public GetContasReceberPendentesQueryValidator()
    {
        RuleFor(query => query.PacienteId)
            .NotEmpty();
    }
}
