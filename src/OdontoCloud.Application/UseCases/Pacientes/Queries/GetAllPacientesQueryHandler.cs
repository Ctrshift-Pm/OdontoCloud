using MediatR;
using OdontoCloud.Application.Interfaces;

namespace OdontoCloud.Application.UseCases.Pacientes.Queries;

public sealed class GetAllPacientesQueryHandler : IRequestHandler<GetAllPacientesQuery, IReadOnlyList<PacienteDto>>
{
    private readonly IPacienteRepository _pacienteRepository;

    public GetAllPacientesQueryHandler(IPacienteRepository pacienteRepository)
    {
        _pacienteRepository = pacienteRepository;
    }

    public async Task<IReadOnlyList<PacienteDto>> Handle(GetAllPacientesQuery request, CancellationToken cancellationToken)
    {
        var pacientes = await _pacienteRepository.GetAllAsync(cancellationToken);
        return pacientes.Select(PacienteDto.FromEntity).ToList();
    }
}
