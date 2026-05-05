using MediatR;
using OdontoCloud.Application.UseCases.Prontuario;

namespace OdontoCloud.Application.UseCases.PlanoTratamento.Commands;

public sealed record AprovarItemPlanoCommand(Guid ItemPlanoTratamentoId) : IRequest<ItemPlanoTratamentoDto?>;
