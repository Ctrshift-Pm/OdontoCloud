using FluentValidation;

namespace OdontoCloud.Application.UseCases.Pacientes.Commands;

public sealed class CreatePacienteCommandValidator : AbstractValidator<CreatePacienteCommand>
{
    public CreatePacienteCommandValidator()
    {
        RuleFor(command => command.Nome)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(command => command.Cpf)
            .NotEmpty()
            .Must(CpfUtils.IsValid)
            .WithMessage("CPF inválido.");

        RuleFor(command => command.TelefoneWhatsapp)
            .NotEmpty()
            .MaximumLength(20);
    }
}
