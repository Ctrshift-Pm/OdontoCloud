using OdontoCloud.Domain.Entities;
using OdontoCloud.Domain.Enums;

namespace OdontoCloud.Domain.Tests.Entities;

public sealed class PacienteTests
{
    private static readonly Guid ClinicaId = Guid.NewGuid();

    [Fact]
    public void DeveCriarPacienteComShapeDeCrmEssencial()
    {
        var dentistaResponsavelId = Guid.NewGuid();
        var nascimento = new DateOnly(1992, 3, 12);

        var paciente = new Paciente(
            ClinicaId,
            " Ana Lima ",
            "123.456.789-00",
            "(11) 99234-1234",
            nascimento,
            " ANA.LIMA@email.com ",
            " Particular ",
            StatusPaciente.Retorno,
            " São Paulo ",
            dentistaResponsavelId);

        Assert.Equal(ClinicaId, paciente.ClinicaId);
        Assert.Equal("Ana Lima", paciente.Nome);
        Assert.Equal("123.456.789-00", paciente.Cpf);
        Assert.Equal("(11) 99234-1234", paciente.TelefoneWhatsapp);
        Assert.Equal(nascimento, paciente.DataNascimento);
        Assert.Equal("ana.lima@email.com", paciente.Email);
        Assert.Equal("Particular", paciente.Convenio);
        Assert.Equal(StatusPaciente.Retorno, paciente.Status);
        Assert.Equal("São Paulo", paciente.Cidade);
        Assert.Equal(dentistaResponsavelId, paciente.DentistaResponsavelId);
    }

    [Fact]
    public void NaoDevePermitirPacienteSemClinicaId()
    {
        var action = () => new Paciente(Guid.Empty, "Ana", "123", "(11) 99999-9999");

        var exception = Assert.Throws<ArgumentException>(action);

        Assert.Equal("clinicaId", exception.ParamName);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    public void NaoDevePermitirPacienteSemNome(string nomeInvalido)
    {
        var action = () => new Paciente(ClinicaId, nomeInvalido, "123", "(11) 99999-9999");

        var exception = Assert.Throws<ArgumentException>(action);

        Assert.Equal("nome", exception.ParamName);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    public void NaoDevePermitirPacienteSemCpf(string cpfInvalido)
    {
        var action = () => new Paciente(ClinicaId, "Ana", cpfInvalido, "(11) 99999-9999");

        var exception = Assert.Throws<ArgumentException>(action);

        Assert.Equal("cpf", exception.ParamName);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    public void NaoDevePermitirPacienteSemTelefoneWhatsapp(string telefoneInvalido)
    {
        var action = () => new Paciente(ClinicaId, "Ana", "123", telefoneInvalido);

        var exception = Assert.Throws<ArgumentException>(action);

        Assert.Equal("telefoneWhatsapp", exception.ParamName);
    }

    [Fact]
    public void DeveAssumirStatusAtivoPorPadrao()
    {
        var paciente = new Paciente(ClinicaId, "Ana", "123", "(11) 99999-9999");

        Assert.Equal(StatusPaciente.Ativo, paciente.Status);
    }

    [Fact]
    public void NaoDevePermitirDentistaResponsavelVazio()
    {
        var action = () => new Paciente(
            ClinicaId,
            "Ana",
            "123",
            "(11) 99999-9999",
            dentistaResponsavelId: Guid.Empty);

        var exception = Assert.Throws<ArgumentException>(action);

        Assert.Equal("dentistaResponsavelId", exception.ParamName);
    }
}
