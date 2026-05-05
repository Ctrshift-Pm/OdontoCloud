using System.Text.Json;
using FluentValidation;
using MediatR;
using OdontoCloud.Application.Interfaces;
using OdontoCloud.Domain.Entities;
using OdontoCloud.Domain.Enums;

namespace OdontoCloud.Application.UseCases.Prontuario.UpdateOdontograma;

public sealed class UpdateDenteOdontogramaCommandHandler : IRequestHandler<UpdateDenteOdontogramaCommand, ProntuarioDto?>
{
    private static readonly IReadOnlyDictionary<string, (string Procedimento, decimal ValorBase)> ProcedureCatalog =
        new Dictionary<string, (string Procedimento, decimal ValorBase)>(StringComparer.OrdinalIgnoreCase)
        {
            [StatusDenteOdontograma.carie.ToString()] = ("Tratamento de Cárie", 250m),
            [StatusDenteOdontograma.ext.ToString()] = ("Extração", 400m),
            [StatusDenteOdontograma.trat.ToString()] = ("Tratamento Restaurador", 300m)
        };

    private readonly IProntuarioRepository _prontuarioRepository;
    private readonly ITenantService _tenantService;

    public UpdateDenteOdontogramaCommandHandler(IProntuarioRepository prontuarioRepository, ITenantService tenantService)
    {
        _prontuarioRepository = prontuarioRepository;
        _tenantService = tenantService;
    }

    public async Task<ProntuarioDto?> Handle(UpdateDenteOdontogramaCommand request, CancellationToken cancellationToken)
    {
        var prontuario = await _prontuarioRepository.GetByIdForUpdateAsync(request.ProntuarioId, cancellationToken);
        if (prontuario is null)
        {
            return null;
        }

        var odontograma = OdontogramaHelper.Parse(prontuario.OdontogramaJson);
        var currentStatus = odontograma[request.Dente];
        var newStatus = Enum.Parse<StatusDenteOdontograma>(request.Status, true).ToString();

        if (string.Equals(currentStatus, StatusDenteOdontograma.ausente.ToString(), StringComparison.OrdinalIgnoreCase) &&
            OdontogramaHelper.IsInterventionStatus(newStatus))
        {
            throw new ValidationException("Nao e possivel marcar intervencao em dente ausente.");
        }

        odontograma[request.Dente] = newStatus;

        if (!string.Equals(currentStatus, newStatus, StringComparison.OrdinalIgnoreCase) &&
            ProcedureCatalog.TryGetValue(newStatus, out var procedureDefinition))
        {
            await _prontuarioRepository.AddItemPlanoTratamentoAsync(
                new ItemPlanoTratamento(
                    prontuario.Id,
                    prontuario.PacienteId,
                    request.Dente,
                    int.Parse(request.Dente),
                    prontuario.Paciente?.DentistaResponsavelId,
                    newStatus,
                    procedureDefinition.Procedimento,
                    procedureDefinition.ValorBase),
                cancellationToken);
        }

        var usuarioId = _tenantService.GetCurrentUsuarioId();
        var now = DateTimeOffset.UtcNow;
        var odontogramaJson = JsonSerializer.Serialize(odontograma);
        var detalhesJson = JsonSerializer.Serialize(new
        {
            Dente = request.Dente,
            StatusAnterior = currentStatus,
            NovoStatus = newStatus
        });

        prontuario.AtualizarOdontograma(odontogramaJson, usuarioId, now, detalhesJson);
        await _prontuarioRepository.AddAuditoriaAsync(
            new ProntuarioAuditoria(
                prontuario.Id,
                usuarioId,
                "OdontogramaAtualizado",
                now,
                detalhesJson),
            cancellationToken);
        await _prontuarioRepository.SaveChangesAsync(cancellationToken);

        var updatedProntuario = await _prontuarioRepository.GetByIdAsync(request.ProntuarioId, cancellationToken);
        if (updatedProntuario is null)
        {
            return null;
        }

        var anamneseDesatualizada = updatedProntuario.AnamneseAtualizadaEmUtc is null ||
                                    updatedProntuario.AnamneseAtualizadaEmUtc.Value < DateTimeOffset.UtcNow.AddMonths(-6);

        return new ProntuarioDto(
            updatedProntuario.Id,
            updatedProntuario.PacienteId,
            AnamneseHelper.ToJsonElement(updatedProntuario.AnamneseJson),
            OdontogramaHelper.ToJsonElement(updatedProntuario.OdontogramaJson),
            anamneseDesatualizada,
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
