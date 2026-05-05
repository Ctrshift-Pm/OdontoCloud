using MediatR;

namespace OdontoCloud.Application.UseCases.Financeiro.Commands;

public sealed record CreateContaReceberCommand(
    Guid PacienteId,
    Guid? ItemPlanoTratamentoId,
    Guid? DentistaId,
    decimal ValorBase,
    decimal Desconto,
    DateTime DataVencimento) : IRequest<ContaReceberDto>;
