using MediatR;

namespace OdontoCloud.Application.UseCases.FinanceiroPagar.Commands;

public sealed record DeleteContaPagarCommand(Guid ContaPagarId) : IRequest<bool>;
