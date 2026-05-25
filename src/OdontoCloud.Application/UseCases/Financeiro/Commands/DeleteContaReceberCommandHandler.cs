using FluentValidation;
using MediatR;
using OdontoCloud.Application.Interfaces;

namespace OdontoCloud.Application.UseCases.Financeiro.Commands;

public sealed class DeleteContaReceberCommandHandler : IRequestHandler<DeleteContaReceberCommand, bool>
{
    private readonly IContaReceberRepository _contaReceberRepository;

    public DeleteContaReceberCommandHandler(IContaReceberRepository contaReceberRepository)
    {
        _contaReceberRepository = contaReceberRepository;
    }

    public async Task<bool> Handle(DeleteContaReceberCommand request, CancellationToken cancellationToken)
    {
        var conta = await _contaReceberRepository.GetByIdAsync(request.ContaReceberId, cancellationToken);
        if (conta is null)
        {
            return false;
        }

        if (!conta.PodeSerEditadaOuExcluidaNoCrud())
        {
            throw new ValidationException("A conta recebida so pode ser excluida em status pendente ou atrasado.");
        }

        _contaReceberRepository.Remove(conta);
        await _contaReceberRepository.SaveChangesAsync(cancellationToken);
        return true;
    }
}
