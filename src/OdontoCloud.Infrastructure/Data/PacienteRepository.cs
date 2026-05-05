using Microsoft.EntityFrameworkCore;
using OdontoCloud.Application.Interfaces;
using OdontoCloud.Domain.Entities;

namespace OdontoCloud.Infrastructure.Data;

public sealed class PacienteRepository : IPacienteRepository
{
    private readonly OdontoCloudDbContext _dbContext;

    public PacienteRepository(OdontoCloudDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task AddAsync(Paciente paciente, CancellationToken cancellationToken = default)
    {
        return _dbContext.Pacientes.AddAsync(paciente, cancellationToken).AsTask();
    }

    public Task<List<Paciente>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return _dbContext.Pacientes
            .AsNoTracking()
            .OrderBy(paciente => paciente.Nome)
            .ToListAsync(cancellationToken);
    }

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return _dbContext.SaveChangesAsync(cancellationToken);
    }
}
