using FluentValidation;
using MediatR;
using OdontoCloud.Application.Interfaces;

namespace OdontoCloud.Application.UseCases.FinanceiroPagar.Commands;

public sealed class UpdateContaPagarCommandHandler : IRequestHandler<UpdateContaPagarCommand, ContaPagarDto?>
{
    private readonly IContaPagarRepository _contaPagarRepository;

    public UpdateContaPagarCommandHandler(IContaPagarRepository contaPagarRepository)
    {
        _contaPagarRepository = contaPagarRepository;
    }

    public async Task<ContaPagarDto?> Handle(UpdateContaPagarCommand request, CancellationToken cancellationToken)
    {
        var conta = await _contaPagarRepository.GetByIdAsync(request.ContaPagarId, cancellationToken);
        if (conta is null)
        {
            return null;
        }

        if (!conta.PodeSerEditadaOuExcluidaNoCrud())
        {
            throw new ValidationException("A conta a pagar so pode ser editada em status pendente ou atrasado.");
        }

        conta.AtualizarDados(
            request.FornecedorDestinatario,
            request.Categoria,
            request.Descricao,
            request.Valor,
            request.DataVencimento);

        await _contaPagarRepository.SaveChangesAsync(cancellationToken);

        return new ContaPagarDto(
            conta.Id,
            conta.FornecedorDestinatario,
            conta.Categoria,
            conta.Descricao,
            conta.Valor,
            conta.DataVencimento,
            conta.DataPagamento,
            conta.UsuarioBaixaId,
            conta.DentistaId,
            conta.Status.ToString());
    }
}
