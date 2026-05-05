using MediatR;

namespace OdontoCloud.Application.UseCases.FinanceiroPagar.Commands;

public sealed record PagarContaPagarCommand(Guid ContaPagarId) : IRequest<ContaPagarDto?>;
