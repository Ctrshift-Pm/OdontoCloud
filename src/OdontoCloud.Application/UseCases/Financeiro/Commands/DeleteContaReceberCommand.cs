using MediatR;

namespace OdontoCloud.Application.UseCases.Financeiro.Commands;

public sealed record DeleteContaReceberCommand(Guid ContaReceberId) : IRequest<bool>;
