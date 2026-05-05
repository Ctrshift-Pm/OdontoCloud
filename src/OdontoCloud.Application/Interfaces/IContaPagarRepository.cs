using OdontoCloud.Domain.Entities;

namespace OdontoCloud.Application.Interfaces;

public interface IContaPagarRepository
{
    Task AddAsync(ContaPagar contaPagar, CancellationToken cancellationToken = default);

    Task<ContaPagar?> GetByIdAsync(Guid contaPagarId, CancellationToken cancellationToken = default);

    Task<List<ContaPagar>> GetPendentesEAtrasadasAsync(CancellationToken cancellationToken = default);

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
