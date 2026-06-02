using MediatR;
using OdontoCloud.Application.Interfaces;

namespace OdontoCloud.Application.UseCases.IaAtendimento.Queries;

public sealed class GetAllIaLeadsQueryHandler : IRequestHandler<GetAllIaLeadsQuery, IReadOnlyList<IaLeadDto>>
{
    private readonly IIaAtendimentoRepository _repository;

    public GetAllIaLeadsQueryHandler(IIaAtendimentoRepository repository)
    {
        _repository = repository;
    }

    public async Task<IReadOnlyList<IaLeadDto>> Handle(GetAllIaLeadsQuery request, CancellationToken cancellationToken)
    {
        var leads = await _repository.GetAllAsync(cancellationToken);

        return leads.Select(IaLeadDto.FromEntity).ToList();
    }
}
