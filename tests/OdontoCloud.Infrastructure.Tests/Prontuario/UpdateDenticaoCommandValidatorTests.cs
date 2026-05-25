using OdontoCloud.Application.UseCases.Prontuario.UseCases.Prontuario.Denticao;
using Xunit;

namespace OdontoCloud.Infrastructure.Tests.Prontuario;

public sealed class UpdateDenticaoCommandValidatorTests
{
    [Fact]
    public void Validador_DeveAceitarPermanente()
    {
        var validator = new UpdateDenticaoCommandValidator();

        var resultado = validator.Validate(new UpdateDenticaoCommand(System.Guid.NewGuid(), "Permanente"));

        Assert.True(resultado.IsValid);
    }

    [Fact]
    public void Validador_DeveAceitarDecidua()
    {
        var validator = new UpdateDenticaoCommandValidator();

        var resultado = validator.Validate(new UpdateDenticaoCommand(System.Guid.NewGuid(), "Decidua"));

        Assert.True(resultado.IsValid);
    }

    [Fact]
    public void Validador_DeveAceitarMista()
    {
        var validator = new UpdateDenticaoCommandValidator();

        var resultado = validator.Validate(new UpdateDenticaoCommand(System.Guid.NewGuid(), "Mista"));

        Assert.True(resultado.IsValid);
    }

    [Fact]
    public void Validador_DeveRejeitarValorInvalido()
    {
        var validator = new UpdateDenticaoCommandValidator();

        var resultado = validator.Validate(new UpdateDenticaoCommand(System.Guid.NewGuid(), "misto"));

        Assert.False(resultado.IsValid);
    }

    [Fact]
    public void Validador_DeveRejeitarIdVazio()
    {
        var validator = new UpdateDenticaoCommandValidator();

        var resultado = validator.Validate(new UpdateDenticaoCommand(System.Guid.Empty, "Decidua"));

        Assert.False(resultado.IsValid);
    }
}

