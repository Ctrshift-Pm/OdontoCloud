using OdontoCloud.Domain.Entities;

namespace OdontoCloud.Application.Interfaces;

public interface ITokenService
{
    string GenerateToken(Usuario usuario);
}
