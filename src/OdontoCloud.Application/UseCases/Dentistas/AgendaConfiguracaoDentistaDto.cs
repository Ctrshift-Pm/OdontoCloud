namespace OdontoCloud.Application.UseCases.Dentistas;

public sealed record AgendaConfiguracaoDentistaDto(
    string Inicio,
    string Fim,
    int DuracaoPadraoMinutos,
    int[]? DiasDaSemana);
