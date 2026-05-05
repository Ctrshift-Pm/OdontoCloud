using Microsoft.AspNetCore.Authorization;
using OdontoCloud.Domain.Enums;

namespace OdontoCloud.Infrastructure.Identity;

public sealed class PermissionRequirement(ModuloSistema modulo, AcaoPermissao acao) : IAuthorizationRequirement
{
    public ModuloSistema Modulo { get; } = modulo;
    public AcaoPermissao Acao { get; } = acao;
}
