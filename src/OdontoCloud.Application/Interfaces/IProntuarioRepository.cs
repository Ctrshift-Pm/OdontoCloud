using OdontoCloud.Domain.Entities;

namespace OdontoCloud.Application.Interfaces;

public interface IProntuarioRepository
{
    Task<Prontuario?> GetByPacienteIdAsync(Guid pacienteId, CancellationToken cancellationToken = default);

    Task<Prontuario?> GetByIdAsync(Guid prontuarioId, CancellationToken cancellationToken = default);

    Task<Prontuario?> GetByIdForUpdateAsync(Guid prontuarioId, CancellationToken cancellationToken = default);

    Task<bool> PacienteExistsAsync(Guid pacienteId, CancellationToken cancellationToken = default);

    Task AddAsync(Prontuario prontuario, CancellationToken cancellationToken = default);

    Task AddAuditoriaAsync(ProntuarioAuditoria auditoria, CancellationToken cancellationToken = default);

    Task AddItemPlanoTratamentoAsync(ItemPlanoTratamento itemPlanoTratamento, CancellationToken cancellationToken = default);

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
