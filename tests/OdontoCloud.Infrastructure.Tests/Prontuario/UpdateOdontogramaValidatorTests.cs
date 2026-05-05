using OdontoCloud.Application.UseCases.Prontuario.UpdateOdontograma;
using OdontoCloud.Domain.Enums;
using Xunit;

namespace OdontoCloud.Infrastructure.Tests.Prontuario;

public sealed class UpdateOdontogramaValidatorTests
{
    [Fact]
    public async Task Validador_DeveAceitarStatusProtese()
    {
        var validator = new UpdateDenteOdontogramaCommandValidator();

        var resultado = await validator.ValidateAsync(
            new UpdateDenteOdontogramaCommand(Guid.NewGuid(), "18", "protese"));

        Assert.True(resultado.IsValid, "Status 'protese' deve ser aceito pela regra de validação.");
    }

    [Fact]
    public void EnumDeStatusDeveConterProtese()
    {
        var possuiProtese = Enum.TryParse<StatusDenteOdontograma>("protese", ignoreCase: true, out var status);

        Assert.True(possuiProtese);
        Assert.Equal(StatusDenteOdontograma.protese, status);
    }

    [Fact]
    public void Validador_DeveAceitarDenteDeciduo()
    {
        var validator = new UpdateDenteOdontogramaCommandValidator();

        var resultado = validator.Validate(new UpdateDenteOdontogramaCommand(Guid.NewGuid(), "55", "ok"));

        Assert.True(resultado.IsValid, "Dente decíduo 55 deve ser aceito pela validação.");
    }

    [Fact]
    public void Validador_DeveRejeitarDenteInvalido()
    {
        var validator = new UpdateDenteOdontogramaCommandValidator();

        var resultado = validator.Validate(new UpdateDenteOdontogramaCommand(Guid.NewGuid(), "999", "ok"));

        Assert.False(resultado.IsValid, "Dente fora da codificação FDI não deve ser aceito.");
    }
}
