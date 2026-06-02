using MediatR;
using OdontoCloud.Application.Interfaces;
using OdontoCloud.Domain.Enums;

namespace OdontoCloud.Application.UseCases.IaAtendimento.Commands;

public sealed class UpdateIaLeadStatusCommandHandler : IRequestHandler<UpdateIaLeadStatusCommand, IaLeadDto?>
{
    private readonly IIaAtendimentoRepository _repository;

    public UpdateIaLeadStatusCommandHandler(IIaAtendimentoRepository repository)
    {
        _repository = repository;
    }

    public async Task<IaLeadDto?> Handle(UpdateIaLeadStatusCommand request, CancellationToken cancellationToken)
    {
        var lead = await _repository.GetByIdTrackingAsync(request.Id, cancellationToken);

        if (lead is null)
        {
            return null;
        }

        var status = Enum.Parse<StatusIaLead>(request.Status, ignoreCase: true);
        lead.AtualizarStatus(status);

        await _repository.SaveChangesAsync(cancellationToken);

        return IaLeadDto.FromEntity(lead);
    }
}
