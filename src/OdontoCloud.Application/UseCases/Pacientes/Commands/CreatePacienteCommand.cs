using MediatR;

namespace OdontoCloud.Application.UseCases.Pacientes.Commands;

public sealed record CreatePacienteCommand(
    string Nome,
    string Cpf,
    DateOnly? DataNascimento,
    string TelefoneWhatsapp) : IRequest<PacienteDto>;
