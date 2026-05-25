using MediatR;

namespace OdontoCloud.Application.UseCases.Financeiro.Commands;

public sealed record UpdateContaReceberCommand(
    Guid ContaReceberId,
    decimal ValorBase,
    decimal Desconto,
    DateTime DataVencimento) : IRequest<ContaReceberDto?>;
