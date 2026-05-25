using Microsoft.EntityFrameworkCore;
using OdontoCloud.Application.Interfaces;
using OdontoCloud.Domain.Entities;
using OdontoCloud.Domain.Enums;

namespace OdontoCloud.Infrastructure.Data;

public sealed class ContaReceberRepository : IContaReceberRepository
{
    private readonly OdontoCloudDbContext _dbContext;

    public ContaReceberRepository(OdontoCloudDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task<List<ItemPlanoTratamento>> GetItensPlanoTratamentoAsync(
        IReadOnlyCollection<Guid> itemPlanoTratamentoIds,
        CancellationToken cancellationToken = default)
    {
        return _dbContext.ItensPlanoTratamento
            .Where(item => itemPlanoTratamentoIds.Contains(item.Id))
            .ToListAsync(cancellationToken);
    }

    public Task AddAsync(ContaReceber contaReceber, CancellationToken cancellationToken = default)
    {
        return _dbContext.ContasReceber.AddAsync(contaReceber, cancellationToken).AsTask();
    }

    public void Remove(ContaReceber contaReceber)
    {
        _dbContext.ContasReceber.Remove(contaReceber);
    }

    public Task<ContaReceber?> GetByIdAsync(Guid contaReceberId, CancellationToken cancellationToken = default)
    {
        return _dbContext.ContasReceber
            .Include(conta => conta.ItemPlanoTratamento)
            .Include(conta => conta.Dentista)
            .FirstOrDefaultAsync(conta => conta.Id == contaReceberId, cancellationToken);
    }

    public Task<List<ContaReceber>> GetPendentesByPacienteIdAsync(Guid pacienteId, CancellationToken cancellationToken = default)
    {
        var statuses = new[]
        {
            StatusContaReceber.Pendente.ToString(),
            StatusContaReceber.Parcial.ToString(),
            StatusContaReceber.Atrasado.ToString()
        };

        return _dbContext.ContasReceber
            .Where(conta => conta.PacienteId == pacienteId && statuses.Contains(conta.Status))
            .OrderBy(conta => conta.DataVencimento)
            .ToListAsync(cancellationToken);
    }

    public Task<List<ContaReceber>> GetPorPeriodoEStatusAsync(
        DateTime? dataInicioUtc,
        DateTime? dataFimUtc,
        StatusContaReceber? status,
        CancellationToken cancellationToken = default)
    {
        var query = _dbContext.ContasReceber.AsQueryable();

        if (dataInicioUtc.HasValue)
        {
            query = query.Where(conta => conta.DataVencimento >= dataInicioUtc.Value);
        }

        if (dataFimUtc.HasValue)
        {
            query = query.Where(conta => conta.DataVencimento < dataFimUtc.Value);
        }

        if (status.HasValue)
        {
            query = query.Where(conta => conta.Status == status.Value.ToString());
        }

        return query
            .OrderBy(conta => conta.DataVencimento)
            .ToListAsync(cancellationToken);
    }

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return _dbContext.SaveChangesAsync(cancellationToken);
    }
}
