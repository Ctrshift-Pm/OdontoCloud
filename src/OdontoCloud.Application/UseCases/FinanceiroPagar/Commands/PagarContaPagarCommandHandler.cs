using MediatR;
using OdontoCloud.Application.Interfaces;

namespace OdontoCloud.Application.UseCases.FinanceiroPagar.Commands;

public sealed class PagarContaPagarCommandHandler : IRequestHandler<PagarContaPagarCommand, ContaPagarDto?>
{
    private readonly IContaPagarRepository _contaPagarRepository;
    private readonly ITenantService _tenantService;

    public PagarContaPagarCommandHandler(IContaPagarRepository contaPagarRepository, ITenantService tenantService)
    {
        _contaPagarRepository = contaPagarRepository;
        _tenantService = tenantService;
    }

    public async Task<ContaPagarDto?> Handle(PagarContaPagarCommand request, CancellationToken cancellationToken)
    {
        var contaPagar = await _contaPagarRepository.GetByIdAsync(request.ContaPagarId, cancellationToken);
        if (contaPagar is null)
        {
            return null;
        }

        contaPagar.RegistrarPagamento(_tenantService.GetCurrentUsuarioId(), DateTime.UtcNow);
        await _contaPagarRepository.SaveChangesAsync(cancellationToken);

        return ContaPagarDto.FromEntity(contaPagar);
    }
}
