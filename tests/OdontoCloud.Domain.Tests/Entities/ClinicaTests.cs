using OdontoCloud.Domain.Entities;

namespace OdontoCloud.Domain.Tests.Entities;

public sealed class ClinicaTests
{
    [Fact]
    public void DeveCriarClinicaComCamposObrigatorios()
    {
        var clinica = new Clinica(" Clínica Sorrir ", " Pro ", " 12.345.678/0001-90 ");

        Assert.NotEqual(Guid.Empty, clinica.Id);
        Assert.Equal("Clínica Sorrir", clinica.Nome);
        Assert.Equal("Pro", clinica.Plano);
        Assert.Equal("12.345.678/0001-90", clinica.Cnpj);
        Assert.True(clinica.Ativa);
        Assert.True(clinica.CreatedAt <= DateTimeOffset.UtcNow);
        Assert.Null(clinica.UpdatedAt);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    public void NaoDevePermitirClinicaSemNome(string nomeInvalido)
    {
        var action = () => new Clinica(nomeInvalido, "Pro");

        var exception = Assert.Throws<ArgumentException>(action);

        Assert.Equal("nome", exception.ParamName);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    public void NaoDevePermitirClinicaSemPlano(string planoInvalido)
    {
        var action = () => new Clinica("Clínica Sorrir", planoInvalido);

        var exception = Assert.Throws<ArgumentException>(action);

        Assert.Equal("plano", exception.ParamName);
    }

    [Fact]
    public void ClinicaNaoDevePossuirClinicaId()
    {
        var clinicaIdProperty = typeof(Clinica).GetProperty("ClinicaId");

        Assert.Null(clinicaIdProperty);
    }
}
