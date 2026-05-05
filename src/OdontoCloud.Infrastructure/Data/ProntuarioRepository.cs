using Microsoft.EntityFrameworkCore;
using OdontoCloud.Application.Interfaces;
using OdontoCloud.Domain.Entities;

namespace OdontoCloud.Infrastructure.Data;

public sealed class ProntuarioRepository : IProntuarioRepository
{
    private readonly OdontoCloudDbContext _dbContext;

    public ProntuarioRepository(OdontoCloudDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task<Prontuario?> GetByPacienteIdAsync(Guid pacienteId, CancellationToken cancellationToken = default)
    {
        return _dbContext.Prontuarios
            .Include(prontuario => prontuario.ItensPlanoTratamento)
            .Include(prontuario => prontuario.Auditorias)
            .FirstOrDefaultAsync(prontuario => prontuario.PacienteId == pacienteId, cancellationToken);
    }

    public Task<Prontuario?> GetByIdAsync(Guid prontuarioId, CancellationToken cancellationToken = default)
    {
        return _dbContext.Prontuarios
            .Include(prontuario => prontuario.ItensPlanoTratamento)
            .Include(prontuario => prontuario.Auditorias)
            .FirstOrDefaultAsync(prontuario => prontuario.Id == prontuarioId, cancellationToken);
    }

    public Task<Prontuario?> GetByIdForUpdateAsync(Guid prontuarioId, CancellationToken cancellationToken = default)
    {
        return _dbContext.Prontuarios
            .Include(prontuario => prontuario.Paciente)
            .FirstOrDefaultAsync(prontuario => prontuario.Id == prontuarioId, cancellationToken);
    }

    public Task<bool> PacienteExistsAsync(Guid pacienteId, CancellationToken cancellationToken = default)
    {
        return _dbContext.Pacientes.AnyAsync(paciente => paciente.Id == pacienteId, cancellationToken);
    }

    public Task AddAsync(Prontuario prontuario, CancellationToken cancellationToken = default)
    {
        return _dbContext.Prontuarios.AddAsync(prontuario, cancellationToken).AsTask();
    }

    public Task AddAuditoriaAsync(ProntuarioAuditoria auditoria, CancellationToken cancellationToken = default)
    {
        return _dbContext.ProntuarioAuditorias.AddAsync(auditoria, cancellationToken).AsTask();
    }

    public Task AddItemPlanoTratamentoAsync(ItemPlanoTratamento itemPlanoTratamento, CancellationToken cancellationToken = default)
    {
        return _dbContext.ItensPlanoTratamento.AddAsync(itemPlanoTratamento, cancellationToken).AsTask();
    }

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return _dbContext.SaveChangesAsync(cancellationToken);
    }
}
