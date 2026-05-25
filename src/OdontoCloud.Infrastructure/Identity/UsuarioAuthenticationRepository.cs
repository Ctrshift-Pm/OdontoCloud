using Microsoft.EntityFrameworkCore;
using OdontoCloud.Application.Interfaces;
using OdontoCloud.Application.Exceptions;
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

    public async Task<Usuario?> GetByEmailAsync(string email, Guid? clinicaId = null, CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Usuarios
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(usuario => usuario.Email == email);

        if (clinicaId is not null && clinicaId != Guid.Empty)
        {
            return await query.FirstOrDefaultAsync(u => u.ClinicaId == clinicaId, cancellationToken);
        }

        var usuarios = await query.ToListAsync(cancellationToken);

        return usuarios.Count switch
        {
            0 => null,
            1 => usuarios[0],
            _ => throw new LoginEmailAmbiguoException(),
        };
    }

    public Task<Usuario?> GetByIdAsync(Guid usuarioId, CancellationToken cancellationToken = default)
    {
        return _dbContext.Usuarios.FirstOrDefaultAsync(usuario => usuario.Id == usuarioId, cancellationToken);
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
