using MediatR;
using OdontoCloud.Application.Interfaces;

namespace OdontoCloud.Application.UseCases.Auth.Profile.GetPerfilMe;

public sealed class GetPerfilMeQueryHandler : IRequestHandler<GetPerfilMeQuery, PerfilMeDto?>
{
    private readonly IUsuarioAuthenticationRepository _usuarioAuthenticationRepository;
    private readonly ITenantService _tenantService;

    public GetPerfilMeQueryHandler(
        IUsuarioAuthenticationRepository usuarioAuthenticationRepository,
        ITenantService tenantService)
    {
        _usuarioAuthenticationRepository = usuarioAuthenticationRepository;
        _tenantService = tenantService;
    }

    public async Task<PerfilMeDto?> Handle(GetPerfilMeQuery request, CancellationToken cancellationToken)
    {
        var usuarioId = _tenantService.GetCurrentUsuarioId();
        var usuario = await _usuarioAuthenticationRepository.GetByIdAsync(usuarioId, cancellationToken);

        if (usuario is null)
        {
            return null;
        }

        return new PerfilMeDto(
            usuario.Id,
            usuario.Nome,
            usuario.Email,
            usuario.Perfil,
            usuario.ClinicaId,
            null);
    }
}
