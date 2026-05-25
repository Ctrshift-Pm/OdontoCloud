using Microsoft.AspNetCore.Identity;
using OdontoCloud.Application.Exceptions;
using OdontoCloud.Application.Interfaces;
using OdontoCloud.Application.UseCases.Auth.Login;
using OdontoCloud.Domain.Entities;
using OdontoCloud.Domain.Enums;
using OdontoCloud.Infrastructure.Identity;

namespace OdontoCloud.Infrastructure.Tests.Auth;

public sealed class LoginCommandHandlerTests
{
    [Fact]
    public async Task Login_DeveMigrarSenhaLegadaParaHash()
    {
        const string senha = "123";
        var usuario = new Usuario(
            Guid.NewGuid(),
            "Usuario Legacy",
            "legacy@odontocloud.local",
            senha,
            PerfilUsuario.Admin);

        var fakeRepo = new FakeUsuarioAuthenticationRepository(usuario);
        var fakeTokenService = new FakeTokenService();
        var passwordHasher = new PasswordHasher<Usuario>();
        var passwordVerifier = new LegacyPasswordVerifier(passwordHasher);
        var handler = new LoginCommandHandler(fakeRepo, fakeTokenService, passwordVerifier);

        var response = await handler.Handle(new LoginCommand(usuario.Email, senha), default);

        Assert.NotNull(response);
        Assert.NotNull(fakeRepo.HashAtualizado);
        Assert.NotEqual(senha, fakeRepo.HashAtualizado);
        Assert.True(passwordVerifier.IsHashed(fakeRepo.HashAtualizado!));
        Assert.Equal(fakeTokenService.Token, response.Token);
    }

    [Fact]
    public async Task Login_ComSenhaHasheadaNaoDeveMigrarNovamente()
    {
        const string senha = "123";
        var passwordHasher = new PasswordHasher<Usuario>();
        var usuario = new Usuario(
            Guid.NewGuid(),
            "Usuario Hash",
            "hash@odontocloud.local",
            "hash-temporario",
            PerfilUsuario.Admin);
        usuario.AtualizarSenhaHash(passwordHasher.HashPassword(usuario, senha));

        var fakeRepo = new FakeUsuarioAuthenticationRepository(usuario);
        var fakeTokenService = new FakeTokenService();
        var passwordVerifier = new LegacyPasswordVerifier(passwordHasher);
        var handler = new LoginCommandHandler(fakeRepo, fakeTokenService, passwordVerifier);

        var response = await handler.Handle(new LoginCommand(usuario.Email, senha), default);

        Assert.NotNull(response);
        Assert.Equal(0, fakeRepo.Atualizacoes);
        Assert.Equal(fakeTokenService.Token, response.Token);
    }

    [Fact]
    public async Task Login_ComSenhaInvalidaNaoDeveGerarTokenNemMigrar()
    {
        const string senha = "123";
        var usuario = new Usuario(
            Guid.NewGuid(),
            "Usuario Senha Errada",
            "nao-autorizado@odontocloud.local",
            senha,
            PerfilUsuario.Admin);

        var fakeRepo = new FakeUsuarioAuthenticationRepository(usuario);
        var fakeTokenService = new FakeTokenService();
        var handler = new LoginCommandHandler(
            fakeRepo,
            fakeTokenService,
            new LegacyPasswordVerifier(new PasswordHasher<Usuario>()));

        var response = await handler.Handle(new LoginCommand(usuario.Email, "321"), default);

        Assert.Null(response);
        Assert.Equal(0, fakeRepo.Atualizacoes);
    }

    [Fact]
    public async Task Login_ComEmailDuplicadoSemClinicaId_DeveLancarExcecaoDeLoginAmbiguo()
    {
        const string senha = "123";
        var usuario = new Usuario(
            Guid.NewGuid(),
            "Usuario Duplicado",
            "duplicado@odontocloud.local",
            senha,
            PerfilUsuario.Admin);
        var fakeRepo = new FakeUsuarioAuthenticationRepository(usuario, simularAmbiguidade: true);

        var handler = new LoginCommandHandler(
            fakeRepo,
            new FakeTokenService(),
            new LegacyPasswordVerifier(new PasswordHasher<Usuario>()));

        await Assert.ThrowsAsync<LoginEmailAmbiguoException>(() =>
            handler.Handle(new LoginCommand(usuario.Email, senha), default));
    }

    private sealed class FakeUsuarioAuthenticationRepository : IUsuarioAuthenticationRepository
    {
        private readonly Usuario _usuario;
        private readonly bool _simularAmbiguidade;

        public FakeUsuarioAuthenticationRepository(Usuario usuario, bool simularAmbiguidade = false)
        {
            _usuario = usuario;
            _simularAmbiguidade = simularAmbiguidade;
        }

        public string? HashAtualizado { get; private set; }

        public int Atualizacoes { get; private set; }

        public Task<Usuario?> GetByEmailAsync(
            string email,
            Guid? clinicaId = null,
            CancellationToken cancellationToken = default)
        {
            if (_simularAmbiguidade && clinicaId is null)
            {
                throw new LoginEmailAmbiguoException();
            }

            return Task.FromResult(_usuario.Email == email ? _usuario : null);
        }

        public Task<Usuario?> GetByIdAsync(Guid usuarioId, CancellationToken cancellationToken = default)
        {
            return Task.FromResult(_usuario.Id == usuarioId ? _usuario : null);
        }

        public Task<int> AtualizarSenhaHashAsync(
            Usuario usuario,
            string novoPasswordHash,
            CancellationToken cancellationToken = default)
        {
            HashAtualizado = novoPasswordHash;
            Atualizacoes++;
            return Task.FromResult(1);
        }
    }

    private sealed class FakeTokenService : ITokenService
    {
        public string Token => "token-teste";

        public string GenerateToken(Usuario usuario) => Token;
    }
}
