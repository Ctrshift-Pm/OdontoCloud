using MediatR;
using OdontoCloud.Application.Interfaces;
using OdontoCloud.Domain.Entities;

namespace OdontoCloud.Application.UseCases.FinanceiroPagar.Commands;

public sealed class CreateContaPagarCommandHandler : IRequestHandler<CreateContaPagarCommand, ContaPagarDto>
{
    private readonly IContaPagarRepository _contaPagarRepository;

    public CreateContaPagarCommandHandler(IContaPagarRepository contaPagarRepository)
    {
        _contaPagarRepository = contaPagarRepository;
    }

    public async Task<ContaPagarDto> Handle(CreateContaPagarCommand request, CancellationToken cancellationToken)
    {
        var contaPagar = new ContaPagar(
            request.FornecedorDestinatario,
            request.Categoria,
            request.Descricao,
            request.Valor,
            request.DataVencimento);

        await _contaPagarRepository.AddAsync(contaPagar, cancellationToken);
        await _contaPagarRepository.SaveChangesAsync(cancellationToken);

        return ContaPagarDto.FromEntity(contaPagar);
    }
}
