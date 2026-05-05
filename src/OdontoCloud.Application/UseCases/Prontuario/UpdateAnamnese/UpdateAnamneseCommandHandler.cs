using System.Text.Json;
using MediatR;
using OdontoCloud.Application.Interfaces;
using OdontoCloud.Domain.Entities;

namespace OdontoCloud.Application.UseCases.Prontuario.UpdateAnamnese;

public sealed class UpdateAnamneseCommandHandler : IRequestHandler<UpdateAnamneseCommand, ProntuarioDto?>
{
    private readonly IProntuarioRepository _prontuarioRepository;
    private readonly ITenantService _tenantService;

    public UpdateAnamneseCommandHandler(IProntuarioRepository prontuarioRepository, ITenantService tenantService)
    {
        _prontuarioRepository = prontuarioRepository;
        _tenantService = tenantService;
    }

    public async Task<ProntuarioDto?> Handle(UpdateAnamneseCommand request, CancellationToken cancellationToken)
    {
        var prontuario = await _prontuarioRepository.GetByIdForUpdateAsync(request.ProntuarioId, cancellationToken);
        if (prontuario is null)
        {
            return null;
        }

        var usuarioId = _tenantService.GetCurrentUsuarioId();
        var now = DateTimeOffset.UtcNow;
        var anamneseJson = JsonSerializer.Serialize(request.Anamnese);

        prontuario.AtualizarAnamnese(anamneseJson, usuarioId, now);
        await _prontuarioRepository.AddAuditoriaAsync(
            new ProntuarioAuditoria(
                prontuario.Id,
                usuarioId,
                "AnamneseAtualizada",
                now,
                anamneseJson),
            cancellationToken);
        await _prontuarioRepository.SaveChangesAsync(cancellationToken);

        var updatedProntuario = await _prontuarioRepository.GetByIdAsync(request.ProntuarioId, cancellationToken);
        if (updatedProntuario is null)
        {
            return null;
        }

        return new ProntuarioDto(
            updatedProntuario.Id,
            updatedProntuario.PacienteId,
            AnamneseHelper.ToJsonElement(updatedProntuario.AnamneseJson),
            OdontogramaHelper.ToJsonElement(updatedProntuario.OdontogramaJson),
            false,
            updatedProntuario.AnamneseAtualizadaEmUtc,
            updatedProntuario.OdontogramaAtualizadoEmUtc,
            updatedProntuario.ItensPlanoTratamento
                .Select(item => new ItemPlanoTratamentoDto(
                    item.Id,
                    item.NumeroDente,
                    item.DenteFdi,
                    item.StatusOdontograma,
                    item.Procedimento,
                    item.ValorBase,
                    item.Status))
                .ToList());
    }
}
