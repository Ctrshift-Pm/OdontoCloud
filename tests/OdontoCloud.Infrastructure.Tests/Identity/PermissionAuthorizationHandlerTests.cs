using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using OdontoCloud.Domain.Enums;
using OdontoCloud.Infrastructure.Identity;

namespace OdontoCloud.Infrastructure.Tests.Identity;

public sealed class PermissionAuthorizationHandlerTests
{
    [Fact]
    public async Task DevePermitirAdminSemPermissaoEspecifica()
    {
        var handler = new PermissionAuthorizationHandler();
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.Role, PerfilUsuario.Admin.ToString()),
            new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString())
        }, "Test"));

        var context = new AuthorizationHandlerContext(
            [new PermissionRequirement(ModuloSistema.Financeiro, AcaoPermissao.Visualizar)],
            user,
            null);

        await handler.HandleAsync(context);

        Assert.True(context.HasSucceeded);
    }

    [Fact]
    public async Task DevePermitirUsuarioComPermissaoFinanceiraEspecifica()
    {
        var handler = new PermissionAuthorizationHandler();
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.Role, PerfilUsuario.Gestor.ToString()),
            new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()),
            new Claim(AuthClaims.Permission, $"{ModuloSistema.Financeiro}:{AcaoPermissao.Visualizar}:True")
        }, "Test"));

        var context = new AuthorizationHandlerContext(
            [new PermissionRequirement(ModuloSistema.Financeiro, AcaoPermissao.Visualizar)],
            user,
            null);

        await handler.HandleAsync(context);

        Assert.True(context.HasSucceeded);
    }

    [Fact]
    public async Task NaoDevePermitirUsuarioSemPermissaoEspecifica()
    {
        var handler = new PermissionAuthorizationHandler();
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.Role, PerfilUsuario.Gestor.ToString()),
            new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString())
        }, "Test"));

        var context = new AuthorizationHandlerContext(
            [new PermissionRequirement(ModuloSistema.Financeiro, AcaoPermissao.Visualizar)],
            user,
            null);

        await handler.HandleAsync(context);

        Assert.False(context.HasSucceeded);
    }
}
