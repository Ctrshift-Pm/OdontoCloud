using FluentValidation;
using MediatR;
using OdontoCloud.Application.Interfaces;

namespace OdontoCloud.Application.UseCases.FinanceiroPagar.Commands;

public sealed class DeleteContaPagarCommandHandler : IRequestHandler<DeleteContaPagarCommand, bool>
{
    private readonly IContaPagarRepository _contaPagarRepository;

    public DeleteContaPagarCommandHandler(IContaPagarRepository contaPagarRepository)
    {
        _contaPagarRepository = contaPagarRepository;
    }

    public async Task<bool> Handle(DeleteContaPagarCommand request, CancellationToken cancellationToken)
    {
        var conta = await _contaPagarRepository.GetByIdAsync(request.ContaPagarId, cancellationToken);
        if (conta is null)
        {
            return false;
        }

        if (!conta.PodeSerEditadaOuExcluidaNoCrud())
        {
            throw new ValidationException("A conta a pagar so pode ser excluida em status pendente ou atrasado.");
        }

        _contaPagarRepository.Remove(conta);
        await _contaPagarRepository.SaveChangesAsync(cancellationToken);
        return true;
    }
}
