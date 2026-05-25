using MediatR;
using OdontoCloud.Application.Interfaces;
using OdontoCloud.Domain.Enums;

namespace OdontoCloud.Application.UseCases.Prontuario.GetProntuario;

public sealed class GetProntuarioQueryHandler : IRequestHandler<GetProntuarioQuery, ProntuarioDto?>
{
    private readonly IProntuarioRepository _prontuarioRepository;
    private readonly IPacienteRepository _pacienteRepository;

    public GetProntuarioQueryHandler(IProntuarioRepository prontuarioRepository, IPacienteRepository pacienteRepository)
    {
        _prontuarioRepository = prontuarioRepository;
        _pacienteRepository = pacienteRepository;
    }

    public async Task<ProntuarioDto?> Handle(GetProntuarioQuery request, CancellationToken cancellationToken)
    {
        var prontuario = await _prontuarioRepository.GetByPacienteIdAsync(request.PacienteId, cancellationToken);

        if (prontuario is null)
        {
            var pacienteExists = await _prontuarioRepository.PacienteExistsAsync(request.PacienteId, cancellationToken);
            if (!pacienteExists)
            {
                return null;
            }

            var paciente = await _pacienteRepository.GetByIdAsync(request.PacienteId, cancellationToken);
            var denticaoPadrao = OdontogramaHelper.GetDefaultDenticao(paciente?.DataNascimento);

            return new ProntuarioDto(
                request.PacienteId,
                request.PacienteId,
                AnamneseHelper.ToJsonElement(AnamneseHelper.CreateDefaultJson()),
                AnamneseHelper.ToJsonElement(OdontogramaHelper.CreateDefaultJson()),
                false,
                null,
                null,
                denticaoPadrao.ToString(),
                System.Array.Empty<ItemPlanoTratamentoDto>());
        }

        var anamneseDesatualizada = prontuario.AnamneseAtualizadaEmUtc is null ||
                                    prontuario.AnamneseAtualizadaEmUtc.Value < DateTimeOffset.UtcNow.AddMonths(-6);

        return new ProntuarioDto(
            prontuario.Id,
            prontuario.PacienteId,
            AnamneseHelper.ToJsonElement(prontuario.AnamneseJson),
            OdontogramaHelper.ToJsonElement(prontuario.OdontogramaJson),
            anamneseDesatualizada,
            prontuario.AnamneseAtualizadaEmUtc,
            prontuario.OdontogramaAtualizadoEmUtc,
            prontuario.DenticaoAtiva.ToString(),
            prontuario.ItensPlanoTratamento
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
