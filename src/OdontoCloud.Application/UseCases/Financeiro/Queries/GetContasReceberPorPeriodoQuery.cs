using MediatR;
using OdontoCloud.Domain.Enums;

namespace OdontoCloud.Application.UseCases.Financeiro.Queries;

public sealed record GetContasReceberPorPeriodoQuery(
    DateTime? DataInicio,
    DateTime? DataFim,
    StatusContaReceber? Status) : IRequest<IReadOnlyList<ContaReceberDto>>;
