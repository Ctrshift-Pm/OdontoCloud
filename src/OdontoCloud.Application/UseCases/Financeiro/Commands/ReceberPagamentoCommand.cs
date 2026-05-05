using MediatR;

namespace OdontoCloud.Application.UseCases.Financeiro.Commands;

public sealed record ReceberPagamentoCommand(
    Guid ContaReceberId,
    decimal ValorPago,
    string FormaPagamento) : IRequest<ContaReceberDto?>;
