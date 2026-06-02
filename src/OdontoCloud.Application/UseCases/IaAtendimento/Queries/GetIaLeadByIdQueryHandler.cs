using MediatR;
using OdontoCloud.Application.Interfaces;

namespace OdontoCloud.Application.UseCases.IaAtendimento.Queries;

public sealed class GetIaLeadByIdQueryHandler : IRequestHandler<GetIaLeadByIdQuery, IaLeadDto?>
{
    private readonly IIaAtendimentoRepository _repository;

    public GetIaLeadByIdQueryHandler(IIaAtendimentoRepository repository)
    {
        _repository = repository;
    }

    public async Task<IaLeadDto?> Handle(GetIaLeadByIdQuery request, CancellationToken cancellationToken)
    {
        var lead = await _repository.GetByIdAsync(request.Id, cancellationToken);

        return lead is null ? null : IaLeadDto.FromEntity(lead);
    }
}
