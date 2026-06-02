using MediatR;

namespace OdontoCloud.Application.UseCases.IaAtendimento.Commands;

public sealed record CreateIaLeadCommand(
    string Nome,
    string TelefoneWhatsapp,
    string MotivoContato,
    int Urgencia,
    string ProcedimentoInteresse,
    string? ResumoInteracao,
    string? Sentimento,
    string? MensagemInicial) : IRequest<IaLeadDto>;
