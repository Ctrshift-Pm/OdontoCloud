using MediatR;

namespace OdontoCloud.Application.UseCases.Prontuario.UseCases.Prontuario.Denticao;

public sealed record UpdateDenticaoCommand(
    Guid ProntuarioId,
    string DenticaoAtiva) : IRequest<ProntuarioDto?>;
