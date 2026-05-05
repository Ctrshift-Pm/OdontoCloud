using Microsoft.EntityFrameworkCore;
using OdontoCloud.Application.Interfaces;
using OdontoCloud.Domain.Entities;
using OdontoCloud.Domain.Enums;

namespace OdontoCloud.Infrastructure.Data;

public sealed class ContaPagarRepository : IContaPagarRepository
{
    private readonly OdontoCloudDbContext _dbContext;

    public ContaPagarRepository(OdontoCloudDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task AddAsync(ContaPagar contaPagar, CancellationToken cancellationToken = default)
    {
        return _dbContext.ContasPagar.AddAsync(contaPagar, cancellationToken).AsTask();
    }

    public Task<ContaPagar?> GetByIdAsync(Guid contaPagarId, CancellationToken cancellationToken = default)
    {
        return _dbContext.ContasPagar
            .FirstOrDefaultAsync(conta => conta.Id == contaPagarId, cancellationToken);
    }

    public Task<List<ContaPagar>> GetPendentesEAtrasadasAsync(CancellationToken cancellationToken = default)
    {
        return _dbContext.ContasPagar
            .Where(conta => conta.Status == StatusContaPagar.Pendente || conta.Status == StatusContaPagar.Atrasado)
            .OrderBy(conta => conta.DataVencimento)
            .ToListAsync(cancellationToken);
    }

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return _dbContext.SaveChangesAsync(cancellationToken);
    }
}
