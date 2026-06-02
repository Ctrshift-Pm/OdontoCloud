using MediatR;
using OdontoCloud.Application.Interfaces;
using OdontoCloud.Domain.Entities;
using OdontoCloud.Domain.Enums;

namespace OdontoCloud.Application.UseCases.IaAtendimento.Commands;

public sealed class CreateIaLeadCommandHandler : IRequestHandler<CreateIaLeadCommand, IaLeadDto>
{
    private readonly IIaAtendimentoRepository _repository;

    public CreateIaLeadCommandHandler(IIaAtendimentoRepository repository)
    {
        _repository = repository;
    }

    public async Task<IaLeadDto> Handle(CreateIaLeadCommand request, CancellationToken cancellationToken)
    {
        var lead = new IaLead(
            request.Nome,
            request.TelefoneWhatsapp.Trim(),
            request.MotivoContato,
            request.Urgencia,
            request.ProcedimentoInteresse,
            request.ResumoInteracao,
            request.Sentimento,
            DateTimeOffset.UtcNow.AddHours(4));

        if (!string.IsNullOrWhiteSpace(request.MensagemInicial))
        {
            lead.AdicionarMensagem(DirecaoMensagemIa.Paciente, request.MensagemInicial);
        }

        await _repository.AddAsync(lead, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        return IaLeadDto.FromEntity(lead);
    }
}
