using FluentValidation;

namespace OdontoCloud.Application.UseCases.Auth.Profile.UpdateSenha;

public sealed class UpdateSenhaPerfilCommandValidator : AbstractValidator<UpdateSenhaPerfilCommand>
{
    public UpdateSenhaPerfilCommandValidator()
    {
        RuleFor(command => command.SenhaAtual)
            .NotEmpty()
            .WithMessage("A senha atual é obrigatória.");

        RuleFor(command => command.NovaSenha)
            .NotEmpty()
            .WithMessage("A nova senha é obrigatória.")
            .MinimumLength(3)
            .WithMessage("A nova senha deve ter ao menos 3 caracteres.");

        RuleFor(command => command.ConfirmacaoSenha)
            .Equal(command => command.NovaSenha)
            .WithMessage("A confirmacao da senha nao confere.");
    }
}
