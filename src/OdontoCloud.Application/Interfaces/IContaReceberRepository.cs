using OdontoCloud.Domain.Entities;
using OdontoCloud.Domain.Enums;

namespace OdontoCloud.Application.Interfaces;

public interface IContaReceberRepository
{
    Task<List<ItemPlanoTratamento>> GetItensPlanoTratamentoAsync(
        IReadOnlyCollection<Guid> itemPlanoTratamentoIds,
        CancellationToken cancellationToken = default);

    Task AddAsync(ContaReceber contaReceber, CancellationToken cancellationToken = default);

    Task<ContaReceber?> GetByIdAsync(Guid contaReceberId, CancellationToken cancellationToken = default);

    Task<List<ContaReceber>> GetPendentesByPacienteIdAsync(Guid pacienteId, CancellationToken cancellationToken = default);

    Task<List<ContaReceber>> GetPorPeriodoEStatusAsync(
        DateTime? dataInicioUtc,
        DateTime? dataFimUtc,
        StatusContaReceber? status,
        CancellationToken cancellationToken = default);

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
