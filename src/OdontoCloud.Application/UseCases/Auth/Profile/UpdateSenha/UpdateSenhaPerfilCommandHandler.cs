using MediatR;
using OdontoCloud.Application.Interfaces;
using OdontoCloud.Domain.Entities;

namespace OdontoCloud.Application.UseCases.Auth.Profile.UpdateSenha;

public sealed class UpdateSenhaPerfilCommandHandler : IRequestHandler<UpdateSenhaPerfilCommand, bool>
{
    private readonly IUsuarioAuthenticationRepository _usuarioAuthenticationRepository;
    private readonly ITenantService _tenantService;
    private readonly IPasswordVerifier _passwordVerifier;

    public UpdateSenhaPerfilCommandHandler(
        IUsuarioAuthenticationRepository usuarioAuthenticationRepository,
        ITenantService tenantService,
        IPasswordVerifier passwordVerifier)
    {
        _usuarioAuthenticationRepository = usuarioAuthenticationRepository;
        _tenantService = tenantService;
        _passwordVerifier = passwordVerifier;
    }

    public async Task<bool> Handle(UpdateSenhaPerfilCommand request, CancellationToken cancellationToken)
    {
        var usuarioId = _tenantService.GetCurrentUsuarioId();
        var usuario = await _usuarioAuthenticationRepository.GetByIdAsync(usuarioId, cancellationToken);

        if (usuario is null)
        {
            return false;
        }

        if (!_passwordVerifier.Verify(usuario, request.SenhaAtual))
        {
            return false;
        }

        var novoPasswordHash = _passwordVerifier.HashPassword(usuario, request.NovaSenha);
        await _usuarioAuthenticationRepository.AtualizarSenhaHashAsync(usuario, novoPasswordHash, cancellationToken);

        return true;
    }
}
