namespace OdontoCloud.Application.UseCases.Agendamentos;

public sealed record AgendamentoDto(
    Guid Id,
    Guid PacienteId,
    string PacienteNome,
    Guid DentistaId,
    string DentistaNome,
    DateTime DataHora,
    int DuracaoMinutos,
    string Status,
    string Procedimento,
    string? Observacoes);
