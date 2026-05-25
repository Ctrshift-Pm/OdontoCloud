using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace OdontoCloud.Infrastructure.Identity;

public static class JwtSigningKeyResolver
{
    public const string PlaceholderKey = "__SET_JWT_KEY_VIA_ENV_OR_USER_SECRETS__";

    public static string Resolve(IConfiguration configuration, IHostEnvironment? environment = null)
    {
        var keyFilePath = configuration["Jwt:KeyFilePath"];
        if (!string.IsNullOrWhiteSpace(keyFilePath) && File.Exists(keyFilePath))
        {
            var fileKey = File.ReadAllText(keyFilePath).Trim();
            ValidateKey(fileKey, environment);
            return fileKey;
        }

        var configuredKey = configuration["Jwt:Key"]
            ?? throw new InvalidOperationException("A chave JWT não foi configurada.");

        ValidateKey(configuredKey, environment);
        return configuredKey;
    }

    private static void ValidateKey(string key, IHostEnvironment? environment)
    {
        if (string.IsNullOrWhiteSpace(key))
        {
            throw new InvalidOperationException("A chave JWT não foi configurada.");
        }

        if (key.Length < 32)
        {
            throw new InvalidOperationException("A chave JWT deve ter pelo menos 32 caracteres.");
        }

        if (string.Equals(key, PlaceholderKey, StringComparison.Ordinal)
            && !string.Equals(environment?.EnvironmentName, Environments.Development, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Defina Jwt:Key por variável de ambiente ou secret antes de subir fora de Development.");
        }
    }
}
