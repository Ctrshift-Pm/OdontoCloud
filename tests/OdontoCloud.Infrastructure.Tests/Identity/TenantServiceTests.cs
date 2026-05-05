using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using OdontoCloud.Infrastructure.Identity;

namespace OdontoCloud.Infrastructure.Tests.Identity;

public sealed class TenantServiceTests
{
    [Fact]
    public void DeveRetornarClinicaDoToken()
    {
        var clinicaId = Guid.NewGuid();
        var usuarioId = Guid.NewGuid();

        var tenantService = new TenantService(new HttpContextAccessor
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(
                    new ClaimsIdentity(
                        new[]
                        {
                            new Claim(AuthClaims.ClinicaId, clinicaId.ToString()),
                            new Claim(ClaimTypes.NameIdentifier, usuarioId.ToString())
                        }))
            }
        });

        var resultado = tenantService.GetCurrentClinicaId();

        Assert.Equal(clinicaId, resultado);
    }

    [Fact]
    public void DeveRejeitarClinicaIdAusenteOuInvalido()
    {
        var tenantService = new TenantService(new HttpContextAccessor
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity())
            }
        });

        Assert.Throws<UnauthorizedAccessException>(() => tenantService.GetCurrentClinicaId());
    }
}
