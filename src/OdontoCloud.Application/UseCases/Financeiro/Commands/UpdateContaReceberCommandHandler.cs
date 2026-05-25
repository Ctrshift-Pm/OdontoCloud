using MediatR;
using FluentValidation;
using OdontoCloud.Application.Interfaces;

namespace OdontoCloud.Application.UseCases.Financeiro.Commands;

public sealed class UpdateContaReceberCommandHandler : IRequestHandler<UpdateContaReceberCommand, ContaReceberDto?>
{
    private readonly IContaReceberRepository _contaReceberRepository;

    public UpdateContaReceberCommandHandler(IContaReceberRepository contaReceberRepository)
    {
        _contaReceberRepository = contaReceberRepository;
    }

    public async Task<ContaReceberDto?> Handle(UpdateContaReceberCommand request, CancellationToken cancellationToken)
    {
        var conta = await _contaReceberRepository.GetByIdAsync(request.ContaReceberId, cancellationToken);
        if (conta is null)
        {
            return null;
        }

        if (!conta.PodeSerEditadaOuExcluidaNoCrud())
        {
            throw new ValidationException("A conta recebida so pode ser editada em status pendente ou atrasada.");
        }

        conta.AtualizarDados(request.ValorBase, request.Desconto, request.DataVencimento);

        await _contaReceberRepository.SaveChangesAsync(cancellationToken);

        return new ContaReceberDto(
            conta.Id,
            conta.PacienteId,
            conta.ItemPlanoTratamentoId,
            conta.ValorBase,
            conta.Desconto,
            conta.ValorFinal,
            conta.DataVencimento,
            conta.DataPagamento,
            conta.FormaPagamento,
            conta.UsuarioBaixaId,
            conta.Status);
    }
}
