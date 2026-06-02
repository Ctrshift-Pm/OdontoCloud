using FluentValidation;

namespace OdontoCloud.Application.UseCases.IaAtendimento.Commands;

public sealed class CreateIaLeadCommandValidator : AbstractValidator<CreateIaLeadCommand>
{
    public CreateIaLeadCommandValidator()
    {
        RuleFor(command => command.Nome)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(command => command.TelefoneWhatsapp)
            .NotEmpty()
            .MaximumLength(20);

        RuleFor(command => command.MotivoContato)
            .NotEmpty()
            .MaximumLength(300);

        RuleFor(command => command.Urgencia)
            .InclusiveBetween(1, 5);

        RuleFor(command => command.ProcedimentoInteresse)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(command => command.ResumoInteracao)
            .MaximumLength(1000);

        RuleFor(command => command.Sentimento)
            .MaximumLength(150);

        RuleFor(command => command.MensagemInicial)
            .MaximumLength(4000);
    }
}
