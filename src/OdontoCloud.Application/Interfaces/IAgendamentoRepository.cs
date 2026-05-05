using OdontoCloud.Domain.Entities;

namespace OdontoCloud.Application.Interfaces;

public interface IAgendamentoRepository
{
    Task AddAsync(Agendamento agendamento, CancellationToken cancellationToken = default);

    void Remove(Agendamento agendamento);

    Task<Agendamento?> GetByIdAsync(Guid agendamentoId, CancellationToken cancellationToken = default);

    Task<bool> HasOverlappingAppointmentAsync(
        Guid dentistaId,
        DateTime dataHora,
        int duracaoMinutos,
        Guid? agendamentoIgnoradoId = null,
        CancellationToken cancellationToken = default);

    Task<List<Agendamento>> GetFromRangeAsync(
        DateTime dataInicio,
        DateTime dataFim,
        Guid? dentistaId = null,
        CancellationToken cancellationToken = default);

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
