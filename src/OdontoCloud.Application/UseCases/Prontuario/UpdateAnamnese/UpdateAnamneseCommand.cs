using System.Text.Json;
using MediatR;

namespace OdontoCloud.Application.UseCases.Prontuario.UpdateAnamnese;

public sealed record UpdateAnamneseCommand(Guid ProntuarioId, JsonElement Anamnese) : IRequest<ProntuarioDto?>;
