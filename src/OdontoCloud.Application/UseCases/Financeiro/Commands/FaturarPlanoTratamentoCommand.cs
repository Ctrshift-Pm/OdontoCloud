using MediatR;

namespace OdontoCloud.Application.UseCases.Financeiro.Commands;

public sealed record FaturarPlanoTratamentoCommand(
    IReadOnlyList<Guid> ItensPlanoTratamentoIds) : IRequest<ContaReceberDto>;
