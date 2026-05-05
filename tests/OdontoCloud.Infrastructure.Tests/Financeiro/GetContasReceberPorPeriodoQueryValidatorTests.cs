using OdontoCloud.Application.UseCases.Financeiro.Queries;
using OdontoCloud.Domain.Enums;

namespace OdontoCloud.Infrastructure.Tests.Financeiro;

public sealed class GetContasReceberPorPeriodoQueryValidatorTests
{
    private readonly GetContasReceberPorPeriodoQueryValidator _validator = new();

    [Fact]
    public void DeveValidarPeriodoComDataFimAntesDaDataInicio()
    {
        var consulta = new GetContasReceberPorPeriodoQuery(
            DataInicio: DateTime.UtcNow,
            DataFim: DateTime.UtcNow.AddHours(-1),
            Status: null);

        var result = _validator.Validate(consulta);

        Assert.False(result.IsValid);
    }

    [Fact]
    public void DeveAceitarConsultaSemStatusInformado()
    {
        var consulta = new GetContasReceberPorPeriodoQuery(
            DataInicio: DateTime.UtcNow.AddDays(-7),
            DataFim: DateTime.UtcNow,
            Status: null);

        var result = _validator.Validate(consulta);

        Assert.True(result.IsValid);
    }

    [Fact]
    public void DeveAceitarConsultaComStatusValido()
    {
        var consulta = new GetContasReceberPorPeriodoQuery(
            DataInicio: null,
            DataFim: null,
            Status: StatusContaReceber.Pendente);
        var result = _validator.Validate(consulta);

        Assert.True(result.IsValid);
    }
}
