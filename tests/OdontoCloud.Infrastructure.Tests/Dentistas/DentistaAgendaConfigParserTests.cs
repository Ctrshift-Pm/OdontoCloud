using FluentValidation;
using OdontoCloud.Application.UseCases.Dentistas;

namespace OdontoCloud.Infrastructure.Tests.Dentistas;

public sealed class DentistaAgendaConfigParserTests
{
    [Fact]
    public void Parse_DeveLerConfiguracaoValida()
    {
        var json = """{"inicio":"09:30","fim":"17:00","duracaoPadraoMinutos":20,"diasDaSemana":[1,3,5]}""";

        var config = DentistaAgendaConfigParser.Parse(json);

        Assert.Equal(new TimeOnly(9, 30), config.HorarioInicio);
        Assert.Equal(new TimeOnly(17, 0), config.HorarioFim);
        Assert.Equal(20, config.DuracaoPadraoMinutos);
        Assert.Equal([1, 3, 5], config.DiasDaSemana);
    }

    [Fact]
    public void Parse_DeveRetornarPadraoQuandoInvalidade()
    {
        var config = DentistaAgendaConfigParser.ParseOrDefault("{ invalid }");

        Assert.Equal(new TimeOnly(8, 0), config.HorarioInicio);
        Assert.Equal(new TimeOnly(18, 0), config.HorarioFim);
        Assert.Equal(30, config.DuracaoPadraoMinutos);
        Assert.Equal([0, 1, 2, 3, 4, 5, 6], config.DiasDaSemana);
    }

    [Fact]
    public void Parse_DeveAceitarFimDeSemana()
    {
        var config = DentistaAgendaConfigParser.Parse(
            """{"inicio":"08:00","fim":"18:00","duracaoPadraoMinutos":30,"diasDaSemana":[0,1,6]}""");

        Assert.Equal([0, 1, 6], config.DiasDaSemana);
        Assert.Equal(new TimeOnly(8, 0), config.HorarioInicio);
        Assert.Equal(new TimeOnly(18, 0), config.HorarioFim);
    }

    [Fact]
    public void Parse_DeveRejeitarInicioMaiorOuIgualFim()
    {
        Assert.Throws<ValidationException>(() => DentistaAgendaConfigParser.Parse("""{"inicio":"18:00","fim":"18:00","duracaoPadraoMinutos":30}"""));
        Assert.Throws<ValidationException>(() => DentistaAgendaConfigParser.Parse("""{"inicio":"19:00","fim":"07:00","duracaoPadraoMinutos":30}"""));
    }

    [Fact]
    public void Parse_DeveRejeitarDuracaoInvalida()
    {
        Assert.Throws<ValidationException>(() => DentistaAgendaConfigParser.Parse("""{"inicio":"08:00","fim":"18:00","duracaoPadraoMinutos":5}"""));
        Assert.Throws<ValidationException>(() => DentistaAgendaConfigParser.Parse("""{"inicio":"08:00","fim":"18:00","duracaoPadraoMinutos":300}"""));
    }

    [Fact]
    public void Parse_DeveRejeitarDiaDaSemanaInvalido()
    {
        Assert.Throws<ValidationException>(() => DentistaAgendaConfigParser.Parse("""{"inicio":"08:00","fim":"18:00","duracaoPadraoMinutos":30,"diasDaSemana":[-1,7]}"""));
    }

    [Fact]
    public void Parse_DeveRejeitarInicioMaiorQueFim()
    {
        var json = """{"inicio":"18:00","fim":"08:00","duracaoPadraoMinutos":30}""";

        Assert.Throws<ValidationException>(() => DentistaAgendaConfigParser.Parse(json));
    }

    [Fact]
    public void Parse_DeveRejeitarDiasDaSemanaComTipoInvalido()
    {
        var json = """{"inicio":"08:00","fim":"18:00","duracaoPadraoMinutos":30,"diasDaSemana":"segunda"}""";

        var exception = Assert.Throws<ValidationException>(() => DentistaAgendaConfigParser.Parse(json));
        Assert.Contains("diasDaSemana", exception.Message);
    }

    [Fact]
    public void EstaDentroDaAgenda_DeveRespeitarJanelaEDiaDaSemana()
    {
        var config = DentistaAgendaConfigParser.Parse("""{"inicio":"08:00","fim":"18:00","duracaoPadraoMinutos":30,"diasDaSemana":[1]}""");
        var diaBase = DateTime.UtcNow.Date;
        while (diaBase.DayOfWeek != DayOfWeek.Monday)
        {
            diaBase = diaBase.AddDays(1);
        }

        var segundaFeira = new DateTime(diaBase.Year, diaBase.Month, diaBase.Day, 10, 0, 0, DateTimeKind.Unspecified);
        var tercaFeira = segundaFeira.AddDays(1);
        var sabado = segundaFeira.AddDays(5);
        var domingo = segundaFeira.AddDays(6);
        var horarioForaDaJanela = new DateTime(diaBase.Year, diaBase.Month, diaBase.Day, 20, 0, 0, DateTimeKind.Unspecified);

        Assert.True(config.EstaDentroDaAgenda(segundaFeira, 60));
        Assert.False(config.EstaDentroDaAgenda(tercaFeira, 60));
        Assert.False(config.EstaDentroDaAgenda(horarioForaDaJanela, 60));
        Assert.False(config.EstaDentroDaAgenda(sabado, 60));
        Assert.False(config.EstaDentroDaAgenda(domingo, 60));
    }

    [Fact]
    public void EstaDentroDaAgenda_DeveBloquearFimDeSemanaQuandoNaoConfigurado()
    {
        var config = DentistaAgendaConfigParser.Parse("""{"inicio":"08:00","fim":"18:00","duracaoPadraoMinutos":30,"diasDaSemana":[1,2,3,4,5]}""");
        var referencia = DateTime.UtcNow.Date;
        var diasAteSabado = (6 - (int)referencia.DayOfWeek + 7) % 7;
        var sabado = referencia.AddDays(diasAteSabado == 0 ? 7 : diasAteSabado);
        var domingo = sabado.AddDays(1);
        var horarioSabado = new DateTime(sabado.Year, sabado.Month, sabado.Day, 9, 0, 0, DateTimeKind.Unspecified);
        var horarioDomingo = new DateTime(domingo.Year, domingo.Month, domingo.Day, 9, 0, 0, DateTimeKind.Unspecified);

        Assert.False(config.EstaDentroDaAgenda(horarioSabado, 30));
        Assert.False(config.EstaDentroDaAgenda(horarioDomingo, 30));
    }

    [Fact]
    public void EstaDentroDaAgenda_DevePermitirFimDeSemanaQuandoConfigurado()
    {
        var config = DentistaAgendaConfigParser.Parse("""{"inicio":"08:00","fim":"18:00","duracaoPadraoMinutos":30,"diasDaSemana":[0,6]}""");
        var referencia = DateTime.UtcNow.Date;
        var diasAteSabado = (6 - (int)referencia.DayOfWeek + 7) % 7;
        var sabado = referencia.AddDays(diasAteSabado == 0 ? 7 : diasAteSabado);
        var domingo = sabado.AddDays(1);
        var horarioSabado = new DateTime(sabado.Year, sabado.Month, sabado.Day, 9, 0, 0, DateTimeKind.Unspecified);
        var horarioDomingo = new DateTime(domingo.Year, domingo.Month, domingo.Day, 9, 0, 0, DateTimeKind.Unspecified);

        Assert.True(config.EstaDentroDaAgenda(horarioSabado, 30));
        Assert.True(config.EstaDentroDaAgenda(horarioDomingo, 30));
    }

    [Fact]
    public void EstaDentroDaAgenda_DeveValidarUtcComoHorarioLocalDaClinica()
    {
        var config = DentistaAgendaConfigParser.Parse("""{"inicio":"08:00","fim":"18:00","duracaoPadraoMinutos":30,"diasDaSemana":[0,1,2,3,4,5,6]}""");
        var sabado = new DateTime(2026, 5, 16, 18, 0, 0, DateTimeKind.Utc);
        var horarioFora = new DateTime(2026, 5, 16, 21, 0, 0, DateTimeKind.Utc);

        Assert.True(config.EstaDentroDaAgenda(sabado, 30));
        Assert.False(config.EstaDentroDaAgenda(horarioFora, 30));
    }
}
