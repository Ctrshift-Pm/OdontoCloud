using System.Text.Json;
using FluentValidation;
using MediatR;
using OdontoCloud.Application.Interfaces;
using OdontoCloud.Application.UseCases.Dentistas;

namespace OdontoCloud.Application.UseCases.Dentistas.Commands;

public sealed class UpdateDentistaAgendaConfigCommandHandler
    : IRequestHandler<UpdateDentistaAgendaConfigCommand, DentistaDto?>
{
    private readonly IDentistaRepository _dentistaRepository;

    public UpdateDentistaAgendaConfigCommandHandler(IDentistaRepository dentistaRepository)
    {
        _dentistaRepository = dentistaRepository;
    }

    public async Task<DentistaDto?> Handle(UpdateDentistaAgendaConfigCommand request, CancellationToken cancellationToken)
    {
        var dentista = await _dentistaRepository.GetByIdAsync(request.DentistaId, cancellationToken);
        if (dentista is null)
        {
            return null;
        }

        var config = DentistaAgendaConfigParser.Parse(
            JsonSerializer.Serialize(
                new
                {
                    inicio = request.Inicio,
                    fim = request.Fim,
                    duracaoPadraoMinutos = request.DuracaoPadraoMinutos,
                    diasDaSemana = request.DiasDaSemana,
                }));

        var configAtualizadaJson = JsonSerializer.Serialize(
            new
            {
                inicio = request.Inicio,
                fim = request.Fim,
                duracaoPadraoMinutos = request.DuracaoPadraoMinutos,
                diasDaSemana = config.DiasDaSemana,
            });

        dentista.AtualizarAgendaConfig(configAtualizadaJson);
        await _dentistaRepository.SaveChangesAsync(cancellationToken);

        return new DentistaDto(
            dentista.Id,
            dentista.Nome,
            dentista.Especialidade,
            new AgendaConfiguracaoDentistaDto(
                config.HorarioInicio.ToString("HH:mm"),
                config.HorarioFim.ToString("HH:mm"),
                config.DuracaoPadraoMinutos,
                [.. config.DiasDaSemana]));
    }
}
