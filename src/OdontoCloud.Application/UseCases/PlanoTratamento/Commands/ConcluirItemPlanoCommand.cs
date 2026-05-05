using MediatR;
using OdontoCloud.Application.UseCases.Prontuario;

namespace OdontoCloud.Application.UseCases.PlanoTratamento.Commands;

public sealed record ConcluirItemPlanoCommand(Guid ItemPlanoTratamentoId) : IRequest<ItemPlanoTratamentoDto?>;
