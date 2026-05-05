using OdontoCloud.Domain.Entities;
using OdontoCloud.Domain.Enums;

namespace OdontoCloud.Application.UseCases.Pacientes;

public sealed record PacienteDto(
    Guid Id,
    string Nome,
    string Cpf,
    DateOnly? DataNascimento,
    string TelefoneWhatsapp,
    string? Email,
    string? Convenio,
    StatusPaciente Status,
    string? Cidade,
    Guid? DentistaResponsavelId)
{
    public static PacienteDto FromEntity(Paciente paciente)
    {
        return new PacienteDto(
            paciente.Id,
            paciente.Nome,
            paciente.Cpf,
            paciente.DataNascimento,
            paciente.TelefoneWhatsapp,
            paciente.Email,
            paciente.Convenio,
            paciente.Status,
            paciente.Cidade,
            paciente.DentistaResponsavelId);
    }
}
