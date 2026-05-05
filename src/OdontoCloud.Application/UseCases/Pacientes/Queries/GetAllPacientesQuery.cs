using MediatR;

namespace OdontoCloud.Application.UseCases.Pacientes.Queries;

public sealed record GetAllPacientesQuery() : IRequest<IReadOnlyList<PacienteDto>>;
