using OdontoCloud.Domain.Common;
using OdontoCloud.Domain.Enums;

namespace OdontoCloud.Domain.Entities;

public sealed class IaMensagem : TenantEntityBase
{
    private IaMensagem()
    {
    }

    public IaMensagem(Guid iaLeadId, DirecaoMensagemIa direcao, string conteudo, DateTimeOffset enviadaEmUtc)
    {
        IaLeadId = Guard.AgainstDefault(iaLeadId, nameof(iaLeadId));
        Direcao = direcao;
        Conteudo = Guard.AgainstNullOrWhiteSpace(conteudo, nameof(conteudo));
        EnviadaEmUtc = enviadaEmUtc;
        Canal = "WhatsApp";
    }

    public Guid IaLeadId { get; private set; }

    public IaLead Lead { get; private set; } = null!;

    public DirecaoMensagemIa Direcao { get; private set; }

    public string Conteudo { get; private set; } = string.Empty;

    public DateTimeOffset EnviadaEmUtc { get; private set; }

    public string Canal { get; private set; } = string.Empty;
}
