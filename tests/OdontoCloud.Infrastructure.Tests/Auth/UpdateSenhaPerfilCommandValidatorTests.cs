using OdontoCloud.Application.UseCases.Auth.Profile.UpdateSenha;
using Xunit;

namespace OdontoCloud.Infrastructure.Tests.Auth;

public sealed class UpdateSenhaPerfilCommandValidatorTests
{
    [Fact]
    public void Validador_DeveAceitarDadosValidos()
    {
        var validator = new UpdateSenhaPerfilCommandValidator();

        var resultado = validator.Validate(new UpdateSenhaPerfilCommand("123", "nova123", "nova123"));

        Assert.True(resultado.IsValid);
    }

    [Fact]
    public void Validador_DeveRejeitarConfirmacaoDiferente()
    {
        var validator = new UpdateSenhaPerfilCommandValidator();

        var resultado = validator.Validate(new UpdateSenhaPerfilCommand("123", "nova123", "diferente"));

        Assert.False(resultado.IsValid);
    }

    [Fact]
    public void Validador_DeveRejeitarNovaSenhaCurta()
    {
        var validator = new UpdateSenhaPerfilCommandValidator();

        var resultado = validator.Validate(new UpdateSenhaPerfilCommand("123", "12", "12"));

        Assert.False(resultado.IsValid);
    }
}
