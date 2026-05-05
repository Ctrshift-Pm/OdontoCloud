using Microsoft.AspNetCore.Authorization;
using OdontoCloud.Domain.Enums;

namespace OdontoCloud.Infrastructure.Identity;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true)]
public sealed class PermissionAttribute : AuthorizeAttribute
{
    public PermissionAttribute(ModuloSistema modulo, AcaoPermissao acao)
    {
        Modulo = modulo;
        Acao = acao;
        Policy = PermissionPolicy.Names.Build(modulo, acao);
    }

    public ModuloSistema Modulo { get; }

    public AcaoPermissao Acao { get; }
}
