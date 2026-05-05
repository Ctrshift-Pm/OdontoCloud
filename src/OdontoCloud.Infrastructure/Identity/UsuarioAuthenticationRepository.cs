using Microsoft.EntityFrameworkCore;
using OdontoCloud.Application.Interfaces;
using OdontoCloud.Domain.Entities;
using OdontoCloud.Infrastructure.Data;

namespace OdontoCloud.Infrastructure.Identity;

public sealed class UsuarioAuthenticationRepository : IUsuarioAuthenticationRepository
{
    private readonly OdontoCloudDbContext _dbContext;

    public UsuarioAuthenticationRepository(OdontoCloudDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Usuario?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        var usuarios = await _dbContext.Usuarios
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(usuario => usuario.Email == email)
            .ToListAsync(cancellationToken);

        return usuarios.Count == 1
            ? usuarios[0]
            : null;
    }

    public Task<int> AtualizarSenhaHashAsync(
        Usuario usuario,
        string novoPasswordHash,
        CancellationToken cancellationToken = default)
    {
        return _dbContext.Database.ExecuteSqlInterpolatedAsync(
            $"UPDATE \"Usuarios\" SET \"PasswordHash\" = {novoPasswordHash}, \"UpdatedAt\" = {DateTimeOffset.UtcNow} WHERE \"Id\" = {usuario.Id}",
            cancellationToken);
    }
}
