using FluentValidation;
using OdontoCloud.Domain.Enums;

namespace OdontoCloud.Application.UseCases.IaAtendimento.Commands;

public sealed class UpdateIaLeadStatusCommandValidator : AbstractValidator<UpdateIaLeadStatusCommand>
{
    public UpdateIaLeadStatusCommandValidator()
    {
        RuleFor(command => command.Id)
            .NotEmpty();

        RuleFor(command => command.Status)
            .NotEmpty()
            .Must(status => Enum.TryParse<StatusIaLead>(status, ignoreCase: true, out _))
            .WithMessage("Status inválido para lead de IA.");
    }
}
