using System.Security.Claims;
using System;
using Microsoft.AspNetCore.Http;
using OdontoCloud.Application.Interfaces;

namespace OdontoCloud.Infrastructure.Identity;

public class TenantService : ITenantService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public TenantService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid GetCurrentClinicaId()
    {
        var clinicaIdClaim = _httpContextAccessor.HttpContext?.User?.FindFirst(AuthClaims.ClinicaId)?.Value;
        if (string.IsNullOrWhiteSpace(clinicaIdClaim))
        {
            throw new UnauthorizedAccessException("Token sem claim de clínica.");
        }

        if (!Guid.TryParse(clinicaIdClaim, out var clinicaId))
        {
            throw new UnauthorizedAccessException("Token com claim ClinicaId inválido.");
        }

        if (clinicaId == Guid.Empty)
        {
            throw new UnauthorizedAccessException("Token com ClinicaId inválido.");
        }

        return clinicaId;
    }

    public Guid GetCurrentUsuarioId()
    {
        var usuarioIdClaim = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrWhiteSpace(usuarioIdClaim))
        {
            throw new UnauthorizedAccessException("Token sem claim de usuário.");
        }

        if (!Guid.TryParse(usuarioIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("Token com claim UserId inválido.");
        }

        return userId;
    }
}
