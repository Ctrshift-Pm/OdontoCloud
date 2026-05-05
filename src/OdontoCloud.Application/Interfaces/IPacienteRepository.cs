using OdontoCloud.Domain.Entities;

namespace OdontoCloud.Application.Interfaces;

public interface IPacienteRepository
{
    Task AddAsync(Paciente paciente, CancellationToken cancellationToken = default);

    Task<List<Paciente>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
