using MediatR;
using OdontoCloud.Application.Interfaces;
using DomainProntuario = OdontoCloud.Domain.Entities.Prontuario;

namespace OdontoCloud.Application.UseCases.Prontuario.GetProntuario;

public sealed class GetProntuarioQueryHandler : IRequestHandler<GetProntuarioQuery, ProntuarioDto?>
{
    private readonly IProntuarioRepository _prontuarioRepository;

    public GetProntuarioQueryHandler(IProntuarioRepository prontuarioRepository)
    {
        _prontuarioRepository = prontuarioRepository;
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

            prontuario = new DomainProntuario(
                request.PacienteId,
                AnamneseHelper.CreateDefaultJson(),
                OdontogramaHelper.CreateDefaultJson());

            await _prontuarioRepository.AddAsync(prontuario, cancellationToken);
            await _prontuarioRepository.SaveChangesAsync(cancellationToken);
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
