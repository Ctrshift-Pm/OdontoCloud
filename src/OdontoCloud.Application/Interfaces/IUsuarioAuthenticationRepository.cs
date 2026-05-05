using OdontoCloud.Domain.Entities;

namespace OdontoCloud.Application.Interfaces;

public interface IUsuarioAuthenticationRepository
{
    Task<Usuario?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);

    Task<int> AtualizarSenhaHashAsync(
        Usuario usuario,
        string novoPasswordHash,
        CancellationToken cancellationToken = default);
}
