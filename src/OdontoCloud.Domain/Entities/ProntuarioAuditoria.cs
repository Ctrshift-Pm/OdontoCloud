using OdontoCloud.Domain.Common;

namespace OdontoCloud.Domain.Entities;

public sealed class ProntuarioAuditoria : TenantEntityBase
{
    private ProntuarioAuditoria()
    {
    }

    public ProntuarioAuditoria(
        Guid prontuarioId,
        Guid usuarioId,
        string tipoAlteracao,
        DateTimeOffset alteradoEmUtc,
        string detalhesJson)
    {
        ProntuarioId = Guard.AgainstDefault(prontuarioId, nameof(prontuarioId));
        UsuarioId = Guard.AgainstDefault(usuarioId, nameof(usuarioId));
        TipoAlteracao = Guard.AgainstNullOrWhiteSpace(tipoAlteracao, nameof(tipoAlteracao));
        AlteradoEmUtc = alteradoEmUtc;
        DetalhesJson = Guard.AgainstNullOrWhiteSpace(detalhesJson, nameof(detalhesJson));
    }

    public Guid ProntuarioId { get; private set; }

    public Guid UsuarioId { get; private set; }

    public string TipoAlteracao { get; private set; } = string.Empty;

    public DateTimeOffset AlteradoEmUtc { get; private set; }

    public string DetalhesJson { get; private set; } = "{}";

    public Prontuario? Prontuario { get; private set; }
}
