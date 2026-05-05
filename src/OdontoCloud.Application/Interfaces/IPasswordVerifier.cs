using OdontoCloud.Domain.Entities;

namespace OdontoCloud.Application.Interfaces;

public interface IPasswordVerifier
{
    bool Verify(Usuario usuario, string plainPassword);

    bool IsHashed(string passwordValue);

    string HashPassword(Usuario usuario, string plainPassword);
}
