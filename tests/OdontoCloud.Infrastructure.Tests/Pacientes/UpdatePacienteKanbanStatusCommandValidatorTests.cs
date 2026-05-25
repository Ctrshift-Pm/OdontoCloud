using OdontoCloud.Application.UseCases.Pacientes.Commands;
using OdontoCloud.Domain.Enums;
using Xunit;

namespace OdontoCloud.Infrastructure.Tests.Pacientes;

public sealed class UpdatePacienteKanbanStatusCommandValidatorTests
{
    [Fact]
    public void Validador_DeveAceitarStatusValidos()
    {
        var validator = new UpdatePacienteKanbanStatusCommandValidator();

        var resultado = validator.Validate(
            new UpdatePacienteKanbanStatusCommand(Guid.NewGuid(), CrmKanbanStatus.Contato.ToString()));

        Assert.True(resultado.IsValid, "Status existente no enum deve ser aceito.");
    }

    [Fact]
    public void Validador_DeveRejeitarStatusInvalido()
    {
        var validator = new UpdatePacienteKanbanStatusCommandValidator();

        var resultado = validator.Validate(new UpdatePacienteKanbanStatusCommand(Guid.NewGuid(), "desconhecido"));
        Assert.False(resultado.IsValid);
    }
}
