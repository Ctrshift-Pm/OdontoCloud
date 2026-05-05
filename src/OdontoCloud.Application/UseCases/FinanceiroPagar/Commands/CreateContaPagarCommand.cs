using MediatR;

namespace OdontoCloud.Application.UseCases.FinanceiroPagar.Commands;

public sealed record CreateContaPagarCommand(
    string FornecedorDestinatario,
    string Categoria,
    string Descricao,
    decimal Valor,
    DateTime DataVencimento) : IRequest<ContaPagarDto>;
