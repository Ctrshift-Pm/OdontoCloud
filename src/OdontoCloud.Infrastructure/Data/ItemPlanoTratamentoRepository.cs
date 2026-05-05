using Microsoft.EntityFrameworkCore;
using OdontoCloud.Application.Interfaces;
using OdontoCloud.Domain.Entities;

namespace OdontoCloud.Infrastructure.Data;

public sealed class ItemPlanoTratamentoRepository : IItemPlanoTratamentoRepository
{
    private readonly OdontoCloudDbContext _dbContext;

    public ItemPlanoTratamentoRepository(OdontoCloudDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task<List<ItemPlanoTratamento>> GetByIdsAsync(
        IReadOnlyCollection<Guid> itemPlanoTratamentoIds,
        CancellationToken cancellationToken = default)
    {
        return _dbContext.ItensPlanoTratamento
            .Where(item => itemPlanoTratamentoIds.Contains(item.Id))
            .ToListAsync(cancellationToken);
    }

    public Task<ItemPlanoTratamento?> GetByIdAsync(Guid itemPlanoTratamentoId, CancellationToken cancellationToken = default)
    {
        return _dbContext.ItensPlanoTratamento
            .FirstOrDefaultAsync(item => item.Id == itemPlanoTratamentoId, cancellationToken);
    }

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return _dbContext.SaveChangesAsync(cancellationToken);
    }
}
