using MediatR;
using OdontoCloud.Application.UseCases.Dentistas;

namespace OdontoCloud.Application.UseCases.Dentistas.Commands;

public sealed record UpdateDentistaAgendaConfigCommand(
    Guid DentistaId,
    string Inicio,
    string Fim,
    int DuracaoPadraoMinutos,
    int[] DiasDaSemana) : IRequest<DentistaDto?>;
