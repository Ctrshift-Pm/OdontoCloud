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
        Assert.Equal([1, 2, 3, 4, 5], config.DiasDaSemana);
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
        var config = DentistaAgendaConfigParser.Parse("""{"inicio":"08:00","fim":"18:00","duracaoPadraoMinutos":30,"diasDaSemana":[1,2,3,4,5]}""");
        var diaBase = DateTime.UtcNow.Date;
        while (diaBase.DayOfWeek != DayOfWeek.Monday)
        {
            diaBase = diaBase.AddDays(1);
        }

        var segundaFeira = new DateTime(diaBase.Year, diaBase.Month, diaBase.Day, 10, 0, 0, DateTimeKind.Utc);
        var domingo = segundaFeira.AddDays(-1);

        Assert.True(config.EstaDentroDaAgenda(segundaFeira, 60));
        Assert.False(config.EstaDentroDaAgenda(domingo, 60));
    }
}
