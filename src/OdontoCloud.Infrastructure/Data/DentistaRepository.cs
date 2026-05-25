using Microsoft.EntityFrameworkCore;
using OdontoCloud.Application.Interfaces;
using OdontoCloud.Domain.Entities;

namespace OdontoCloud.Infrastructure.Data;

public sealed class DentistaRepository : IDentistaRepository
{
    private readonly OdontoCloudDbContext _dbContext;

    public DentistaRepository(OdontoCloudDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<Dentista>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.Dentistas
            .AsNoTracking()
            .OrderBy(dentista => dentista.Nome)
            .ToListAsync(cancellationToken);
    }

    public Task<Dentista?> GetByIdAsync(Guid dentistaId, CancellationToken cancellationToken = default)
    {
        return _dbContext.Dentistas
            .FirstOrDefaultAsync(dentista => dentista.Id == dentistaId, cancellationToken);
    }

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return _dbContext.SaveChangesAsync(cancellationToken);
    }
}
