using MediatR;

namespace OdontoCloud.Application.UseCases.Prontuario.UpdateOdontograma;

public sealed record UpdateDenteOdontogramaCommand(
    Guid ProntuarioId,
    string Dente,
    string Status,
    int? CariePercentual) : IRequest<ProntuarioDto?>;
