using Microsoft.EntityFrameworkCore;
using OdontoCloud.Application.Interfaces;
using OdontoCloud.Domain.Entities;
using OdontoCloud.Domain.Enums;

namespace OdontoCloud.Infrastructure.Data;

public sealed class AgendamentoRepository : IAgendamentoRepository
{
    private readonly OdontoCloudDbContext _dbContext;

    public AgendamentoRepository(OdontoCloudDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task AddAsync(Agendamento agendamento, CancellationToken cancellationToken = default)
    {
        return _dbContext.Agendamentos.AddAsync(agendamento, cancellationToken).AsTask();
    }

    public void Remove(Agendamento agendamento)
    {
        _dbContext.Agendamentos.Remove(agendamento);
    }

    public Task<Agendamento?> GetByIdAsync(Guid agendamentoId, CancellationToken cancellationToken = default)
    {
        return _dbContext.Agendamentos
            .Include(agendamento => agendamento.Paciente)
            .Include(agendamento => agendamento.Dentista)
            .FirstOrDefaultAsync(agendamento => agendamento.Id == agendamentoId, cancellationToken);
    }

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return _dbContext.SaveChangesAsync(cancellationToken);
    }

    public Task<List<Agendamento>> GetFromRangeAsync(
        DateTime dataInicio,
        DateTime dataFim,
        Guid? dentistaId = null,
        CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Agendamentos
            .AsNoTracking()
            .Include(agendamento => agendamento.Paciente)
            .Include(agendamento => agendamento.Dentista)
            .Where(agendamento => agendamento.DataHora >= dataInicio && agendamento.DataHora < dataFim)
            .AsQueryable();

        if (dentistaId.HasValue && dentistaId.Value != Guid.Empty)
        {
            query = query.Where(agendamento => agendamento.DentistaId == dentistaId.Value);
        }

        return query
            .OrderBy(agendamento => agendamento.DataHora)
            .ToListAsync(cancellationToken);
    }

    public Task<bool> HasOverlappingAppointmentAsync(
        Guid dentistaId,
        DateTime dataHora,
        int duracaoMinutos,
        Guid? agendamentoIgnoradoId = null,
        CancellationToken cancellationToken = default)
    {
        var dataFim = dataHora.AddMinutes(duracaoMinutos);
        var cancelado = StatusAgendamento.Cancelado.ToString();
        var falta = StatusAgendamento.Falta.ToString();

        var query = _dbContext.Agendamentos.Where(agendamento =>
            agendamento.DentistaId == dentistaId &&
            agendamento.Status != cancelado &&
            agendamento.Status != falta &&
            agendamento.DataHora < dataFim &&
            agendamento.DataHora.AddMinutes(agendamento.DuracaoMinutos) > dataHora);

        if (agendamentoIgnoradoId.HasValue && agendamentoIgnoradoId.Value != Guid.Empty)
        {
            query = query.Where(agendamento => agendamento.Id != agendamentoIgnoradoId.Value);
        }

        return query.AnyAsync(cancellationToken);
    }
}
