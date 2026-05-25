using OdontoCloud.Domain.Entities;

namespace OdontoCloud.Application.Interfaces;

public interface IUsuarioAuthenticationRepository
{
    Task<Usuario?> GetByIdAsync(Guid usuarioId, CancellationToken cancellationToken = default);

    Task<Usuario?> GetByEmailAsync(string email, Guid? clinicaId = null, CancellationToken cancellationToken = default);

    Task<int> AtualizarSenhaHashAsync(
        Usuario usuario,
        string novoPasswordHash,
        CancellationToken cancellationToken = default);
}
