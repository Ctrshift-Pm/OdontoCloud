using OdontoCloud.Domain.Common;
using OdontoCloud.Domain.Enums;

namespace OdontoCloud.Domain.Entities;

public sealed class IaLead : TenantEntityBase
{
    private IaLead()
    {
    }

    public IaLead(
        string nome,
        string telefoneWhatsapp,
        string motivoContato,
        int urgencia,
        string procedimentoInteresse,
        string? resumoInteracao = null,
        string? sentimento = null,
        DateTimeOffset? proximoFollowUpEm = null)
    {
        Nome = Guard.AgainstNullOrWhiteSpace(nome, nameof(nome));
        TelefoneWhatsapp = Guard.AgainstNullOrWhiteSpace(telefoneWhatsapp, nameof(telefoneWhatsapp));
        MotivoContato = Guard.AgainstNullOrWhiteSpace(motivoContato, nameof(motivoContato));
        ResumoInteracao = Guard.NullIfWhiteSpace(resumoInteracao);
        Urgencia = ValidarUrgencia(urgencia);
        ProcedimentoInteresse = Guard.AgainstNullOrWhiteSpace(procedimentoInteresse, nameof(procedimentoInteresse));
        Sentimento = Guard.NullIfWhiteSpace(sentimento);
        ProximoFollowUpEm = proximoFollowUpEm;
        Status = StatusIaLead.Novo;
    }

    public string Nome { get; private set; } = string.Empty;

    public string TelefoneWhatsapp { get; private set; } = string.Empty;

    public string MotivoContato { get; private set; } = string.Empty;

    public string? ResumoInteracao { get; private set; }

    public int Urgencia { get; private set; }

    public string ProcedimentoInteresse { get; private set; } = string.Empty;

    public StatusIaLead Status { get; private set; }

    public string? Sentimento { get; private set; }

    public DateTimeOffset? ProximoFollowUpEm { get; private set; }

    public bool AtendimentoAssumido { get; private set; }

    public ICollection<IaMensagem> Mensagens { get; private set; } = new List<IaMensagem>();

    public void AtualizarStatus(StatusIaLead status)
    {
        Status = status;
        MarkAsUpdated();
    }

    public void AssumirConversa()
    {
        AtendimentoAssumido = true;
        Status = StatusIaLead.EmQualificacao;
        MarkAsUpdated();
    }

    public IaMensagem AdicionarMensagem(DirecaoMensagemIa direcao, string conteudo, DateTimeOffset? enviadaEmUtc = null)
    {
        var mensagem = new IaMensagem(Id, direcao, conteudo, enviadaEmUtc ?? DateTimeOffset.UtcNow);
        Mensagens.Add(mensagem);
        MarkAsUpdated();

        return mensagem;
    }

    private static int ValidarUrgencia(int urgencia)
    {
        if (urgencia is < 1 or > 5)
        {
            throw new ArgumentOutOfRangeException(nameof(urgencia), "A urgência deve estar entre 1 e 5.");
        }

        return urgencia;
    }
}
