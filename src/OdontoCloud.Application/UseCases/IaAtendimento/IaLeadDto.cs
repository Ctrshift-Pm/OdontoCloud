using OdontoCloud.Domain.Entities;

namespace OdontoCloud.Application.UseCases.IaAtendimento;

public sealed record IaLeadDto(
    Guid Id,
    string Nome,
    string TelefoneWhatsapp,
    string MotivoContato,
    string? ResumoInteracao,
    int Urgencia,
    string ProcedimentoInteresse,
    string Status,
    string? Sentimento,
    DateTimeOffset? ProximoFollowUpEm,
    bool AtendimentoAssumido,
    DateTimeOffset CreatedAt,
    IReadOnlyList<IaMensagemDto> Mensagens)
{
    public static IaLeadDto FromEntity(IaLead lead)
    {
        return new IaLeadDto(
            lead.Id,
            lead.Nome,
            lead.TelefoneWhatsapp,
            lead.MotivoContato,
            lead.ResumoInteracao,
            lead.Urgencia,
            lead.ProcedimentoInteresse,
            lead.Status.ToString(),
            lead.Sentimento,
            lead.ProximoFollowUpEm,
            lead.AtendimentoAssumido,
            lead.CreatedAt,
            lead.Mensagens
                .OrderBy(mensagem => mensagem.EnviadaEmUtc)
                .Select(IaMensagemDto.FromEntity)
                .ToList());
    }
}

public sealed record IaMensagemDto(
    Guid Id,
    string Direcao,
    string Conteudo,
    DateTimeOffset EnviadaEmUtc,
    string Canal)
{
    public static IaMensagemDto FromEntity(IaMensagem mensagem)
    {
        return new IaMensagemDto(
            mensagem.Id,
            mensagem.Direcao.ToString(),
            mensagem.Conteudo,
            mensagem.EnviadaEmUtc,
            mensagem.Canal);
    }
}
