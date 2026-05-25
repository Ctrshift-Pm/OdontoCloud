using Microsoft.AspNetCore.Identity;
using OdontoCloud.Application.Interfaces;
using OdontoCloud.Application.UseCases.Auth.Profile.UpdateSenha;
using OdontoCloud.Domain.Entities;
using OdontoCloud.Domain.Enums;
using OdontoCloud.Infrastructure.Identity;

namespace OdontoCloud.Infrastructure.Tests.Auth;

public sealed class UpdateSenhaPerfilCommandHandlerTests
{
    private const string SenhaAtual = "123";
    private const string SenhaNova = "nova123";

    [Fact]
    public async Task AtualizarSenha_ComSenhaAtualValida_DevePersistirNovoHash()
    {
        var usuario = new Usuario(
            Guid.NewGuid(),
            "Usuario Teste",
            "teste@odontocloud.local",
            SenhaAtual,
            PerfilUsuario.Admin);

        var fakeRepo = new FakeUsuarioAuthenticationRepository(usuario);
        var fakeTenant = new FakeTenantService(usuario.Id);
        var handler = new UpdateSenhaPerfilCommandHandler(
            fakeRepo,
            fakeTenant,
            new LegacyPasswordVerifier(new PasswordHasher<Usuario>()));

        var atualizado = await handler.Handle(
            new UpdateSenhaPerfilCommand(SenhaAtual, SenhaNova, SenhaNova),
            default);

        Assert.True(atualizado);
        Assert.Equal(1, fakeRepo.Atualizacoes);
        Assert.NotEqual(SenhaAtual, fakeRepo.HashAtualizado);
    }

    [Fact]
    public async Task AtualizarSenha_ComSenhaAtualInvalida_NaoDevePersistir()
    {
        var usuario = new Usuario(
            Guid.NewGuid(),
            "Usuario Teste",
            "teste@odontocloud.local",
            SenhaAtual,
            PerfilUsuario.Admin);

        var fakeRepo = new FakeUsuarioAuthenticationRepository(usuario);
        var fakeTenant = new FakeTenantService(usuario.Id);
        var handler = new UpdateSenhaPerfilCommandHandler(
            fakeRepo,
            fakeTenant,
            new LegacyPasswordVerifier(new PasswordHasher<Usuario>()));

        var atualizado = await handler.Handle(new UpdateSenhaPerfilCommand("senha-errada", SenhaNova, SenhaNova), default);

        Assert.False(atualizado);
        Assert.Equal(0, fakeRepo.Atualizacoes);
    }

    private sealed class FakeTenantService : ITenantService
    {
        private readonly Guid _usuarioId;

        public FakeTenantService(Guid usuarioId)
        {
            _usuarioId = usuarioId;
        }

        public Guid GetCurrentClinicaId() => Guid.NewGuid();

        public Guid GetCurrentUsuarioId() => _usuarioId;
    }

    private sealed class FakeUsuarioAuthenticationRepository : IUsuarioAuthenticationRepository
    {
        private readonly Usuario _usuario;

        public FakeUsuarioAuthenticationRepository(Usuario usuario)
        {
            _usuario = usuario;
        }

        public string? HashAtualizado { get; private set; }

        public int Atualizacoes { get; private set; }

        public Task<Usuario?> GetByIdAsync(Guid usuarioId, CancellationToken cancellationToken = default)
        {
            return Task.FromResult(_usuario.Id == usuarioId ? _usuario : null);
        }

        public Task<Usuario?> GetByEmailAsync(string email, Guid? clinicaId = null, CancellationToken cancellationToken = default)
        {
            return Task.FromResult(_usuario.Email == email ? _usuario : null);
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
}
