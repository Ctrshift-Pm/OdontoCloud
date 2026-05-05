using MediatR;
using OdontoCloud.Application.Interfaces;

namespace OdontoCloud.Application.UseCases.Dentistas.Queries;

public sealed class GetDentistasQueryHandler : IRequestHandler<GetDentistasQuery, IReadOnlyList<DentistaDto>>
{
    private readonly IDentistaRepository _dentistaRepository;

    public GetDentistasQueryHandler(IDentistaRepository dentistaRepository)
    {
        _dentistaRepository = dentistaRepository;
    }

    public async Task<IReadOnlyList<DentistaDto>> Handle(GetDentistasQuery request, CancellationToken cancellationToken)
    {
        var dentistas = await _dentistaRepository.GetAllAsync(cancellationToken);

        return dentistas
            .Select(dentista =>
            {
                var config = DentistaAgendaConfigParser.ParseOrDefault(dentista.AgendaConfigJson);

                return new DentistaDto(
                    dentista.Id,
                    dentista.Nome,
                    dentista.Especialidade,
                    new AgendaConfiguracaoDentistaDto(
                        config.HorarioInicio.ToString("HH:mm"),
                        config.HorarioFim.ToString("HH:mm"),
                        config.DuracaoPadraoMinutos,
                        [.. config.DiasDaSemana]));
            })
            .ToList();
    }
}
