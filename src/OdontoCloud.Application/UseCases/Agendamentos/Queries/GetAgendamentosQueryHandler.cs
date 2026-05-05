using MediatR;
using OdontoCloud.Application.Interfaces;

namespace OdontoCloud.Application.UseCases.Agendamentos.Queries;

public sealed class GetAgendamentosQueryHandler : IRequestHandler<GetAgendamentosQuery, IReadOnlyList<AgendamentoDto>>
{
    private readonly IAgendamentoRepository _agendamentoRepository;

    public GetAgendamentosQueryHandler(IAgendamentoRepository agendamentoRepository)
    {
        _agendamentoRepository = agendamentoRepository;
    }

    public async Task<IReadOnlyList<AgendamentoDto>> Handle(GetAgendamentosQuery request, CancellationToken cancellationToken)
    {
        var dataInicio = EnsureUtc(request.DataInicio);
        var dataFim = request.DataFim.HasValue
            ? EnsureUtc(request.DataFim.Value)
            : dataInicio.AddDays(7);

        var agendamentos = await _agendamentoRepository.GetFromRangeAsync(
            dataInicio,
            dataFim,
            request.DentistaId,
            cancellationToken);

        return agendamentos
            .Select(agendamento => new AgendamentoDto(
                agendamento.Id,
                agendamento.PacienteId,
                agendamento.Paciente?.Nome ?? string.Empty,
                agendamento.DentistaId,
                agendamento.Dentista?.Nome ?? string.Empty,
                agendamento.DataHora,
                agendamento.DuracaoMinutos,
                agendamento.Status,
                agendamento.Procedimento,
                agendamento.Observacoes))
            .ToList();
    }

    private static DateTime EnsureUtc(DateTime value)
    {
        return value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Unspecified => DateTime.SpecifyKind(value, DateTimeKind.Utc),
            _ => value.ToUniversalTime(),
        };
    }
}
