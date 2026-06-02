using MediatR;

namespace OdontoCloud.Application.UseCases.IaAtendimento.Commands;

public sealed record AddIaLeadMensagemCommand(Guid Id, string Direcao, string Conteudo) : IRequest<IaLeadDto?>;
