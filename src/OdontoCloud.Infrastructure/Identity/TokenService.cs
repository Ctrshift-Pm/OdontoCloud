using System.IdentityModel.Tokens.Jwt;
using System.IO;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using OdontoCloud.Application.Interfaces;
using OdontoCloud.Domain.Entities;

namespace OdontoCloud.Infrastructure.Identity;

public sealed class TokenService : ITokenService
{
    private readonly IConfiguration _configuration;

    public TokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateToken(Usuario usuario)
    {
        var issuer = _configuration["Jwt:Issuer"] ?? "OdontoCloud";
        var audience = _configuration["Jwt:Audience"] ?? "OdontoCloud.Client";
        var key = ResolveJwtSigningKey(_configuration["Jwt:Key"], _configuration["Jwt:KeyFilePath"]);
        var expirationInMinutes = int.TryParse(_configuration["Jwt:ExpirationInMinutes"], out var value)
            ? value
            : 120;

        if (usuario.ClinicaId == Guid.Empty)
        {
            throw new InvalidOperationException("Usuário sem clínica associada.");
        }

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
            new(AuthClaims.ClinicaId, usuario.ClinicaId.ToString()),
            new(ClaimTypes.Email, usuario.Email),
            new(ClaimTypes.Name, usuario.Nome),
            new(ClaimTypes.Role, usuario.Perfil.ToString())
        };

        foreach (var permissao in usuario.Permissoes)
        {
            claims.Add(new(AuthClaims.Permission, $"{permissao.Modulo}:{permissao.Acao}:{permissao.Permitido}"));
        }

        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expirationInMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string ResolveJwtSigningKey(string? configuredKey, string? keyFilePath)
    {
        if (!string.IsNullOrWhiteSpace(keyFilePath) && File.Exists(keyFilePath))
        {
            var fileKey = File.ReadAllText(keyFilePath).Trim();
            if (!string.IsNullOrWhiteSpace(fileKey))
            {
                if (fileKey.Length < 32)
                {
                    throw new InvalidOperationException("A chave JWT deve ter pelo menos 32 caracteres.");
                }

                return fileKey;
            }
        }

        var key = configuredKey ?? throw new InvalidOperationException("A chave JWT não foi configurada.");

        if (key.Length < 32)
        {
            throw new InvalidOperationException("A chave JWT deve ter pelo menos 32 caracteres.");
        }

        return key;
    }
}
