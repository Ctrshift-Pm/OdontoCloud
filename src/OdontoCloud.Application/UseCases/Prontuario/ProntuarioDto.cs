using System.Text.Json;

namespace OdontoCloud.Application.UseCases.Prontuario;

public sealed record ProntuarioDto(
    Guid Id,
    Guid PacienteId,
    JsonElement Anamnese,
    JsonElement Odontograma,
    bool AnamneseDesatualizada,
    DateTimeOffset? AnamneseAtualizadaEmUtc,
    DateTimeOffset? OdontogramaAtualizadoEmUtc,
    string DenticaoAtiva,
    IReadOnlyList<ItemPlanoTratamentoDto> ItensPlanoTratamento);
