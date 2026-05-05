using FluentValidation;
using MediatR;
using OdontoCloud.Application.Interfaces;
using OdontoCloud.Application.UseCases.Prontuario;

namespace OdontoCloud.Application.UseCases.PlanoTratamento.Commands;

public sealed class AprovarItemPlanoCommandHandler : IRequestHandler<AprovarItemPlanoCommand, ItemPlanoTratamentoDto?>
{
    private readonly IItemPlanoTratamentoRepository _itemPlanoTratamentoRepository;

    public AprovarItemPlanoCommandHandler(IItemPlanoTratamentoRepository itemPlanoTratamentoRepository)
    {
        _itemPlanoTratamentoRepository = itemPlanoTratamentoRepository;
    }

    public async Task<ItemPlanoTratamentoDto?> Handle(AprovarItemPlanoCommand request, CancellationToken cancellationToken)
    {
        var item = await _itemPlanoTratamentoRepository.GetByIdAsync(request.ItemPlanoTratamentoId, cancellationToken);
        if (item is null)
        {
            return null;
        }

        try
        {
            item.Aprovar();
        }
        catch (InvalidOperationException ex)
        {
            throw new ValidationException(ex.Message);
        }

        await _itemPlanoTratamentoRepository.SaveChangesAsync(cancellationToken);

        return new ItemPlanoTratamentoDto(
            item.Id,
            item.NumeroDente,
            item.DenteFdi,
            item.StatusOdontograma,
            item.Procedimento,
            item.ValorBase,
            item.Status);
    }
}
