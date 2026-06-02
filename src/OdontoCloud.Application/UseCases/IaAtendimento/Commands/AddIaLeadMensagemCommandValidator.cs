using FluentValidation;
using OdontoCloud.Domain.Enums;

namespace OdontoCloud.Application.UseCases.IaAtendimento.Commands;

public sealed class AddIaLeadMensagemCommandValidator : AbstractValidator<AddIaLeadMensagemCommand>
{
    public AddIaLeadMensagemCommandValidator()
    {
        RuleFor(command => command.Id)
            .NotEmpty();

        RuleFor(command => command.Direcao)
            .NotEmpty()
            .Must(direcao => Enum.TryParse<DirecaoMensagemIa>(direcao, ignoreCase: true, out _))
            .WithMessage("Direção inválida para mensagem de IA.");

        RuleFor(command => command.Conteudo)
            .NotEmpty()
            .MaximumLength(4000);
    }
}
