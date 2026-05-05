using MediatR;

namespace OdontoCloud.Application.UseCases.Prontuario.GetProntuario;

public sealed record GetProntuarioQuery(Guid PacienteId) : IRequest<ProntuarioDto?>;
