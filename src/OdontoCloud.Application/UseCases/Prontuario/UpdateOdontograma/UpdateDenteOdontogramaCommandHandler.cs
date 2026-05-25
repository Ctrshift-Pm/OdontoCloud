using System.Text.Json;
using FluentValidation;
using MediatR;
using OdontoCloud.Application.Interfaces;
using OdontoCloud.Domain.Entities;
using OdontoCloud.Domain.Enums;
using DomainProntuario = OdontoCloud.Domain.Entities.Prontuario;

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
    private readonly IPacienteRepository _pacienteRepository;
    private readonly ITenantService _tenantService;

    public UpdateDenteOdontogramaCommandHandler(
        IProntuarioRepository prontuarioRepository,
        IPacienteRepository pacienteRepository,
        ITenantService tenantService)
    {
        _prontuarioRepository = prontuarioRepository;
        _pacienteRepository = pacienteRepository;
        _tenantService = tenantService;
    }

    public async Task<ProntuarioDto?> Handle(UpdateDenteOdontogramaCommand request, CancellationToken cancellationToken)
    {
        var prontuario = await _prontuarioRepository.GetByIdForUpdateAsync(request.ProntuarioId, cancellationToken);
        if (prontuario is null)
        {
            var pacienteExiste = await _prontuarioRepository.PacienteExistsAsync(request.ProntuarioId, cancellationToken);
            if (!pacienteExiste)
            {
                return null;
            }

            var paciente = await _pacienteRepository.GetByIdAsync(request.ProntuarioId, cancellationToken);
            var denticaoPadrao = OdontogramaHelper.GetDefaultDenticao(paciente?.DataNascimento);
            prontuario = new DomainProntuario(
                request.ProntuarioId,
                AnamneseHelper.CreateDefaultJson(),
                OdontogramaHelper.CreateDefaultJson(),
                denticaoPadrao);
            await _prontuarioRepository.AddAsync(prontuario, cancellationToken);
        }

        var odontograma = OdontogramaHelper.Parse(prontuario.OdontogramaJson);
        var estadoAtual = odontograma[request.Dente];
        var novoStatus = Enum.Parse<StatusDenteOdontograma>(request.Status, true).ToString();
        int? percentualCarie = novoStatus.Equals(StatusDenteOdontograma.carie.ToString(), StringComparison.OrdinalIgnoreCase)
            ? OdontogramaHelper.ResolveCariePercentualOuDefault(request.CariePercentual)
            : null;
        var novoEstado = new OdontogramaHelper.EstadoDenteOdontograma(novoStatus, percentualCarie);

        if (string.Equals(estadoAtual.Status, StatusDenteOdontograma.ausente.ToString(), StringComparison.OrdinalIgnoreCase) &&
            OdontogramaHelper.IsInterventionStatus(novoStatus))
        {
            throw new ValidationException("Nao e possivel marcar intervencao em dente ausente.");
        }

        odontograma[request.Dente] = novoEstado;

        if (!string.Equals(estadoAtual.Status, novoStatus, StringComparison.OrdinalIgnoreCase) &&
            ProcedureCatalog.TryGetValue(novoStatus, out var procedureDefinition))
        {
            await _prontuarioRepository.AddItemPlanoTratamentoAsync(
                new ItemPlanoTratamento(
                    prontuario.Id,
                    prontuario.PacienteId,
                    request.Dente,
                    int.Parse(request.Dente),
                    prontuario.Paciente?.DentistaResponsavelId,
                    novoStatus,
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
            StatusAnterior = estadoAtual.Status,
            NovoStatus = novoStatus,
            CariePercentual = percentualCarie
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
            updatedProntuario.DenticaoAtiva.ToString(),
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
