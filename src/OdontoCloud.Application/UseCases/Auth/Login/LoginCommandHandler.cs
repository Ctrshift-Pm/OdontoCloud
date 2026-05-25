using MediatR;
using OdontoCloud.Application.Exceptions;
using OdontoCloud.Application.Interfaces;
using OdontoCloud.Domain.Entities;

namespace OdontoCloud.Application.UseCases.Auth.Login;

public sealed class LoginCommandHandler : IRequestHandler<LoginCommand, LoginResponse?>
{
    private readonly IUsuarioAuthenticationRepository _usuarioAuthenticationRepository;
    private readonly ITokenService _tokenService;
    private readonly IPasswordVerifier _passwordVerifier;

    public LoginCommandHandler(
        IUsuarioAuthenticationRepository usuarioAuthenticationRepository,
        ITokenService tokenService,
        IPasswordVerifier passwordVerifier)
    {
        _usuarioAuthenticationRepository = usuarioAuthenticationRepository;
        _tokenService = tokenService;
        _passwordVerifier = passwordVerifier;
    }

    public async Task<LoginResponse?> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Senha))
        {
            return null;
        }

        var sanitizedEmail = request.Email.Trim().ToLowerInvariant();
        var usuario = await _usuarioAuthenticationRepository.GetByEmailAsync(
            sanitizedEmail,
            request.ClinicaId,
            cancellationToken);

        if (usuario is null || !usuario.Ativo)
        {
            return null;
        }

        if (!_passwordVerifier.Verify(usuario, request.Senha))
        {
            return null;
        }

        if (!_passwordVerifier.IsHashed(usuario.PasswordHash))
        {
            var hashedPassword = _passwordVerifier.HashPassword(usuario, request.Senha);
            await _usuarioAuthenticationRepository.AtualizarSenhaHashAsync(usuario, hashedPassword, cancellationToken);
        }

        var token = _tokenService.GenerateToken(usuario);
        return new LoginResponse(token);
    }
}
