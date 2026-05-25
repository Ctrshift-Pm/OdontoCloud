using System.Text.Json;
using MediatR;
using OdontoCloud.Application.Interfaces;
using OdontoCloud.Domain.Enums;
using OdontoCloud.Domain.Entities;
using DomainProntuario = OdontoCloud.Domain.Entities.Prontuario;

namespace OdontoCloud.Application.UseCases.Prontuario.UseCases.Prontuario.Denticao;

public sealed class UpdateDenticaoCommandHandler : IRequestHandler<UpdateDenticaoCommand, ProntuarioDto?>
{
    private readonly IProntuarioRepository _prontuarioRepository;
    private readonly IPacienteRepository _pacienteRepository;
    private readonly ITenantService _tenantService;

    public UpdateDenticaoCommandHandler(
        IProntuarioRepository prontuarioRepository,
        IPacienteRepository pacienteRepository,
        ITenantService tenantService)
    {
        _prontuarioRepository = prontuarioRepository;
        _pacienteRepository = pacienteRepository;
        _tenantService = tenantService;
    }

    public async Task<ProntuarioDto?> Handle(UpdateDenticaoCommand request, CancellationToken cancellationToken)
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

        var novaDenticao = Enum.Parse<TipoDenticao>(request.DenticaoAtiva, true);

        if (prontuario.DenticaoAtiva == novaDenticao)
        {
            return await MontarProntuarioDtoAsync(prontuario.Id, cancellationToken);
        }

        var denticaoAnterior = prontuario.DenticaoAtiva;
        var now = DateTimeOffset.UtcNow;
        var usuarioId = _tenantService.GetCurrentUsuarioId();
        prontuario.AtualizarDenticaoAtiva(novaDenticao);

        var odontogramaMap = OdontogramaHelper.Parse(prontuario.OdontogramaJson);
        var alterouOdontograma = OdontogramaHelper.EnsureTeethForDenticao(odontogramaMap, novaDenticao);
        if (alterouOdontograma)
        {
            prontuario.AtualizarOdontograma(
                JsonSerializer.Serialize(odontogramaMap),
                usuarioId,
                now,
                JsonSerializer.Serialize(new { DenticaoAnterior = denticaoAnterior, DenticaoNova = novaDenticao }));
        }
        await _prontuarioRepository.AddAuditoriaAsync(
            new ProntuarioAuditoria(
                prontuario.Id,
                usuarioId,
                "DenticaoAtualizada",
                now,
                JsonSerializer.Serialize(new { DenticaoAnterior = denticaoAnterior, DenticaoNova = novaDenticao })),
            cancellationToken);

        await _prontuarioRepository.SaveChangesAsync(cancellationToken);

        return await MontarProntuarioDtoAsync(prontuario.Id, cancellationToken);
    }

    private async Task<ProntuarioDto?> MontarProntuarioDtoAsync(Guid prontuarioId, CancellationToken cancellationToken)
    {
        var updatedProntuario = await _prontuarioRepository.GetByIdAsync(prontuarioId, cancellationToken);
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
