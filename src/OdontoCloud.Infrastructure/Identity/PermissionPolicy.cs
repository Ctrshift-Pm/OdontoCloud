using OdontoCloud.Domain.Enums;

namespace OdontoCloud.Infrastructure.Identity;

public static class PermissionPolicy
{
    public const string Prefix = "Permission.";

    public static class Names
    {
        public static string Build(ModuloSistema modulo, AcaoPermissao acao)
            => $"{Prefix}{modulo}.{acao}";
    }
}
