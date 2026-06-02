using MediatR;
using OdontoCloud.Application.Interfaces;
using OdontoCloud.Domain.Enums;

namespace OdontoCloud.Application.UseCases.IaAtendimento.Commands;

public sealed class AddIaLeadMensagemCommandHandler : IRequestHandler<AddIaLeadMensagemCommand, IaLeadDto?>
{
    private readonly IIaAtendimentoRepository _repository;

    public AddIaLeadMensagemCommandHandler(IIaAtendimentoRepository repository)
    {
        _repository = repository;
    }

    public async Task<IaLeadDto?> Handle(AddIaLeadMensagemCommand request, CancellationToken cancellationToken)
    {
        var lead = await _repository.GetByIdTrackingAsync(request.Id, cancellationToken);

        if (lead is null)
        {
            return null;
        }

        var direcao = Enum.Parse<DirecaoMensagemIa>(request.Direcao, ignoreCase: true);
        var mensagem = lead.AdicionarMensagem(direcao, request.Conteudo);
        await _repository.AddMensagemAsync(mensagem, cancellationToken);

        await _repository.SaveChangesAsync(cancellationToken);

        return IaLeadDto.FromEntity(lead);
    }
}
