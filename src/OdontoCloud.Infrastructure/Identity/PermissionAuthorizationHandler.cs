using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using OdontoCloud.Domain.Enums;

namespace OdontoCloud.Infrastructure.Identity;

public sealed class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        PermissionRequirement requirement)
    {
        var role = context.User.FindFirst(ClaimTypes.Role)?.Value;
        if (string.Equals(role, PerfilUsuario.Admin.ToString(), StringComparison.OrdinalIgnoreCase))
        {
            context.Succeed(requirement);
            return Task.CompletedTask;
        }

        foreach (var claim in context.User.FindAll(AuthClaims.Permission))
        {
            if (!TryParsePermission(claim.Value, out var modulo, out var acao, out var permitido))
            {
                continue;
            }

            if (modulo == requirement.Modulo && acao == requirement.Acao && permitido)
            {
                context.Succeed(requirement);
                return Task.CompletedTask;
            }
        }

        return Task.CompletedTask;
    }

    private static bool TryParsePermission(
        string claimValue,
        out ModuloSistema modulo,
        out AcaoPermissao acao,
        out bool permitido)
    {
        modulo = default;
        acao = default;
        permitido = false;

        var pieces = claimValue.Split(':', StringSplitOptions.TrimEntries);
        if (pieces.Length != 3)
        {
            return false;
        }

        if (!Enum.TryParse(pieces[0], out modulo))
        {
            return false;
        }

        if (!Enum.TryParse(pieces[1], out acao))
        {
            return false;
        }

        if (!bool.TryParse(pieces[2], out permitido))
        {
            return false;
        }

        return true;
    }
}
