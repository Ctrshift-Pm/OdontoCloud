using OdontoCloud.Domain.Enums;

namespace OdontoCloud.Domain.Permissions;

public sealed class UsuarioPermissao
{
    private UsuarioPermissao()
    {
    }

    public UsuarioPermissao(ModuloSistema modulo, AcaoPermissao acao, bool permitido)
    {
        Modulo = modulo;
        Acao = acao;
        Permitido = permitido;
    }

    public ModuloSistema Modulo { get; private set; }

    public AcaoPermissao Acao { get; private set; }

    public bool Permitido { get; private set; }

    public void Atualizar(bool permitido)
    {
        Permitido = permitido;
    }
}
