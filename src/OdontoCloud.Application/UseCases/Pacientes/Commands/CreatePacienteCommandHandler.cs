using MediatR;
using OdontoCloud.Application.Interfaces;
using OdontoCloud.Domain.Entities;

namespace OdontoCloud.Application.UseCases.Pacientes.Commands;

public sealed class CreatePacienteCommandHandler : IRequestHandler<CreatePacienteCommand, PacienteDto>
{
    private readonly IPacienteRepository _pacienteRepository;

    public CreatePacienteCommandHandler(IPacienteRepository pacienteRepository)
    {
        _pacienteRepository = pacienteRepository;
    }

    public async Task<PacienteDto> Handle(CreatePacienteCommand request, CancellationToken cancellationToken)
    {
        var paciente = new Paciente(
            nome: request.Nome,
            cpf: CpfUtils.Format(request.Cpf),
            telefoneWhatsapp: request.TelefoneWhatsapp.Trim(),
            dataNascimento: request.DataNascimento);

        await _pacienteRepository.AddAsync(paciente, cancellationToken);
        await _pacienteRepository.SaveChangesAsync(cancellationToken);

        return PacienteDto.FromEntity(paciente);
    }
}
