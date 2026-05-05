using OdontoCloud.Domain.Entities;

namespace OdontoCloud.Application.Interfaces;

public interface IItemPlanoTratamentoRepository
{
    Task<List<ItemPlanoTratamento>> GetByIdsAsync(
        IReadOnlyCollection<Guid> itemPlanoTratamentoIds,
        CancellationToken cancellationToken = default);

    Task<ItemPlanoTratamento?> GetByIdAsync(Guid itemPlanoTratamentoId, CancellationToken cancellationToken = default);

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
