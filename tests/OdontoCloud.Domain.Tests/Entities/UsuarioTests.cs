using OdontoCloud.Domain.Entities;
using OdontoCloud.Domain.Enums;
using OdontoCloud.Domain.Permissions;

namespace OdontoCloud.Domain.Tests.Entities;

public sealed class UsuarioTests
{
    private static readonly Guid ClinicaId = Guid.NewGuid();

    [Fact]
    public void DeveCriarUsuarioAutenticavelComPermissoesVaziasPorPadrao()
    {
        var usuario = new Usuario(
            ClinicaId,
            "Juliana Recepção",
            " recepcao@clinicasorrir.com.br ",
            "hash-seguro",
            PerfilUsuario.Recepcionista);

        Assert.Equal(ClinicaId, usuario.ClinicaId);
        Assert.Equal("Juliana Recepção", usuario.Nome);
        Assert.Equal("recepcao@clinicasorrir.com.br", usuario.Email);
        Assert.Equal("hash-seguro", usuario.PasswordHash);
        Assert.Equal(PerfilUsuario.Recepcionista, usuario.Perfil);
        Assert.True(usuario.Ativo);
        Assert.Empty(usuario.Permissoes);
        Assert.NotEqual(Guid.Empty, usuario.Id);
    }

    [Fact]
    public void NaoDevePermitirUsuarioSemClinicaId()
    {
        var action = () => new Usuario(Guid.Empty, "Maria", "maria@clinica.com", "hash", PerfilUsuario.Admin);

        var exception = Assert.Throws<ArgumentException>(action);

        Assert.Equal("clinicaId", exception.ParamName);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    public void NaoDevePermitirUsuarioSemNome(string nomeInvalido)
    {
        var action = () => new Usuario(ClinicaId, nomeInvalido, "maria@clinica.com", "hash", PerfilUsuario.Admin);

        var exception = Assert.Throws<ArgumentException>(action);

        Assert.Equal("nome", exception.ParamName);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData("email-invalido")]
    public void NaoDevePermitirUsuarioComEmailInvalido(string emailInvalido)
    {
        var action = () => new Usuario(ClinicaId, "Maria", emailInvalido, "hash", PerfilUsuario.Admin);

        var exception = Assert.Throws<ArgumentException>(action);

        Assert.Equal("email", exception.ParamName);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    public void NaoDevePermitirUsuarioSemPasswordHash(string passwordHashInvalido)
    {
        var action = () => new Usuario(ClinicaId, "Maria", "maria@clinica.com", passwordHashInvalido, PerfilUsuario.Admin);

        var exception = Assert.Throws<ArgumentException>(action);

        Assert.Equal("passwordHash", exception.ParamName);
    }

    [Fact]
    public void DeveAdicionarEAtualizarPermissoesPorModuloEAcao()
    {
        var usuario = new Usuario(ClinicaId, "Maria", "maria@clinica.com", "hash", PerfilUsuario.Gestor);

        usuario.DefinirPermissao(ModuloSistema.Agenda, AcaoPermissao.Visualizar, true);
        usuario.DefinirPermissao(ModuloSistema.Agenda, AcaoPermissao.Criar, true);
        usuario.DefinirPermissao(ModuloSistema.Agenda, AcaoPermissao.Visualizar, false);

        Assert.Equal(2, usuario.Permissoes.Count);
        Assert.False(usuario.PossuiPermissao(ModuloSistema.Agenda, AcaoPermissao.Visualizar));
        Assert.True(usuario.PossuiPermissao(ModuloSistema.Agenda, AcaoPermissao.Criar));
        Assert.NotNull(usuario.UpdatedAt);
    }

    [Fact]
    public void DeveAceitarCargaInicialDePermissoes()
    {
        var permissoes = new[]
        {
            new UsuarioPermissao(ModuloSistema.Pacientes, AcaoPermissao.Visualizar, true),
            new UsuarioPermissao(ModuloSistema.Pacientes, AcaoPermissao.Editar, false)
        };

        var usuario = new Usuario(
            ClinicaId,
            "Gestor",
            "gestor@clinicasorrir.com.br",
            "hash",
            PerfilUsuario.Gestor,
            permissoes: permissoes);

        Assert.True(usuario.PossuiPermissao(ModuloSistema.Pacientes, AcaoPermissao.Visualizar));
        Assert.False(usuario.PossuiPermissao(ModuloSistema.Pacientes, AcaoPermissao.Editar));
    }
}
