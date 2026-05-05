namespace OdontoCloud.Application.UseCases.Dentistas;

public sealed record DentistaDto(
    Guid Id,
    string Nome,
    string? Especialidade,
    AgendaConfiguracaoDentistaDto AgendaConfig);
