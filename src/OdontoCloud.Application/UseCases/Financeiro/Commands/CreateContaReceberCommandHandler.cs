using MediatR;
using OdontoCloud.Application.Interfaces;
using OdontoCloud.Domain.Entities;

namespace OdontoCloud.Application.UseCases.Financeiro.Commands;

public sealed class CreateContaReceberCommandHandler : IRequestHandler<CreateContaReceberCommand, ContaReceberDto>
{
    private readonly IContaReceberRepository _contaReceberRepository;

    public CreateContaReceberCommandHandler(IContaReceberRepository contaReceberRepository)
    {
        _contaReceberRepository = contaReceberRepository;
    }

    public async Task<ContaReceberDto> Handle(CreateContaReceberCommand request, CancellationToken cancellationToken)
    {
        var contaReceber = new ContaReceber(
            request.PacienteId,
            request.ItemPlanoTratamentoId,
            request.DentistaId,
            request.ValorBase,
            request.Desconto,
            request.DataVencimento);

        await _contaReceberRepository.AddAsync(contaReceber, cancellationToken);
        await _contaReceberRepository.SaveChangesAsync(cancellationToken);

        return new ContaReceberDto(
            contaReceber.Id,
            contaReceber.PacienteId,
            contaReceber.ItemPlanoTratamentoId,
            contaReceber.ValorBase,
            contaReceber.Desconto,
            contaReceber.ValorFinal,
            contaReceber.DataVencimento,
            contaReceber.DataPagamento,
            contaReceber.FormaPagamento,
            contaReceber.UsuarioBaixaId,
            contaReceber.Status);
    }
}
