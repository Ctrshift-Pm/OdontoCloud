using OdontoCloud.Domain.Common;

namespace OdontoCloud.Domain.Entities;

public sealed class Clinica : EntityBase
{
    private Clinica()
    {
    }

    public Clinica(string nome, string plano, string? cnpj = null, bool ativa = true)
    {
        Nome = Guard.AgainstNullOrWhiteSpace(nome, nameof(nome));
        Plano = Guard.AgainstNullOrWhiteSpace(plano, nameof(plano));
        Cnpj = Guard.NullIfWhiteSpace(cnpj);
        Ativa = ativa;
    }

    public string Nome { get; private set; } = string.Empty;

    public string? Cnpj { get; private set; }

    public string Plano { get; private set; } = string.Empty;

    public bool Ativa { get; private set; }
}
