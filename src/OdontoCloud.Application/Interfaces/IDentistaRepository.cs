using OdontoCloud.Domain.Entities;

namespace OdontoCloud.Application.Interfaces;

public interface IDentistaRepository
{
    Task<IReadOnlyList<Dentista>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<Dentista?> GetByIdAsync(Guid dentistaId, CancellationToken cancellationToken = default);
}
