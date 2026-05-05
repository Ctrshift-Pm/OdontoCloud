using OdontoCloud.Domain.Common;
using OdontoCloud.Domain.Enums;
using OdontoCloud.Domain.Permissions;

namespace OdontoCloud.Domain.Entities;

public sealed class Usuario : TenantEntityBase
{
    private readonly List<UsuarioPermissao> _permissoes = [];

    private Usuario()
    {
    }

    public Usuario(
        Guid clinicaId,
        string nome,
        string email,
        string passwordHash,
        PerfilUsuario perfil,
        bool ativo = true,
        IEnumerable<UsuarioPermissao>? permissoes = null)
        : base(clinicaId)
    {
        Nome = Guard.AgainstNullOrWhiteSpace(nome, nameof(nome));
        Email = Guard.NormalizeEmail(email, nameof(email));
        PasswordHash = Guard.AgainstNullOrWhiteSpace(passwordHash, nameof(passwordHash));
        Perfil = perfil;
        Ativo = ativo;

        if (permissoes is null)
        {
            return;
        }

        foreach (var permissao in permissoes)
        {
            DefinirPermissao(permissao.Modulo, permissao.Acao, permissao.Permitido);
        }
    }

    public string Nome { get; private set; } = string.Empty;

    public string Email { get; private set; } = string.Empty;

    public string PasswordHash { get; private set; } = string.Empty;

    public PerfilUsuario Perfil { get; private set; }

    public bool Ativo { get; private set; }

    public ICollection<UsuarioPermissao> Permissoes => _permissoes;

    public void DefinirPermissao(ModuloSistema modulo, AcaoPermissao acao, bool permitido)
    {
        var permissaoExistente = _permissoes.FirstOrDefault(p => p.Modulo == modulo && p.Acao == acao);

        if (permissaoExistente is null)
        {
            _permissoes.Add(new UsuarioPermissao(modulo, acao, permitido));
        }
        else
        {
            permissaoExistente.Atualizar(permitido);
        }

        MarkAsUpdated();
    }

    public bool PossuiPermissao(ModuloSistema modulo, AcaoPermissao acao)
    {
        return _permissoes.FirstOrDefault(p => p.Modulo == modulo && p.Acao == acao)?.Permitido ?? false;
    }

    public void AtualizarSenhaHash(string novoPasswordHash)
    {
        PasswordHash = Guard.AgainstNullOrWhiteSpace(novoPasswordHash, nameof(novoPasswordHash));
        MarkAsUpdated();
    }

    public void Ativar()
    {
        if (Ativo)
        {
            return;
        }

        Ativo = true;
        MarkAsUpdated();
    }

    public void Desativar()
    {
        if (!Ativo)
        {
            return;
        }

        Ativo = false;
        MarkAsUpdated();
    }
}
