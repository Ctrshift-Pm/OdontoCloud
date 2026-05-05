using MediatR;

namespace OdontoCloud.Application.UseCases.Agendamentos.Queries;

public sealed record GetAgendamentosQuery(
    DateTime DataInicio,
    DateTime? DataFim = null,
    Guid? DentistaId = null) : IRequest<IReadOnlyList<AgendamentoDto>>;
