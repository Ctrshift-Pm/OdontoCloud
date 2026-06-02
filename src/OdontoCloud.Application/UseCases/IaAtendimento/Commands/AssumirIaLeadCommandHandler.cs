using MediatR;
using OdontoCloud.Application.Interfaces;

namespace OdontoCloud.Application.UseCases.IaAtendimento.Commands;

public sealed class AssumirIaLeadCommandHandler : IRequestHandler<AssumirIaLeadCommand, IaLeadDto?>
{
    private readonly IIaAtendimentoRepository _repository;

    public AssumirIaLeadCommandHandler(IIaAtendimentoRepository repository)
    {
        _repository = repository;
    }

    public async Task<IaLeadDto?> Handle(AssumirIaLeadCommand request, CancellationToken cancellationToken)
    {
        var lead = await _repository.GetByIdTrackingAsync(request.Id, cancellationToken);

        if (lead is null)
        {
            return null;
        }

        lead.AssumirConversa();
        await _repository.SaveChangesAsync(cancellationToken);

        return IaLeadDto.FromEntity(lead);
    }
}
