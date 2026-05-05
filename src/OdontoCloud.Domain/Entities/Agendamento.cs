using OdontoCloud.Domain.Common;
using OdontoCloud.Domain.Enums;

namespace OdontoCloud.Domain.Entities;

public sealed class Agendamento : TenantEntityBase
{
    private Agendamento()
    {
    }

    public Agendamento(
        Guid pacienteId,
        Guid dentistaId,
        DateTime dataHora,
        int duracaoMinutos,
        string status,
        string procedimento,
        string? observacoes = null)
    {
        PacienteId = Guard.AgainstDefault(pacienteId, nameof(pacienteId));
        DentistaId = Guard.AgainstDefault(dentistaId, nameof(dentistaId));
        DataHora = dataHora;
        DuracaoMinutos = duracaoMinutos;
        Status = NormalizeStatus(status);
        Procedimento = Guard.AgainstNullOrWhiteSpace(procedimento, nameof(procedimento));
        Observacoes = Guard.NullIfWhiteSpace(observacoes);
    }

    public Agendamento(
        Guid clinicaId,
        Guid pacienteId,
        Guid dentistaId,
        DateTime dataHora,
        int duracaoMinutos,
        string status,
        string procedimento,
        string? observacoes = null)
        : base(clinicaId)
    {
        PacienteId = Guard.AgainstDefault(pacienteId, nameof(pacienteId));
        DentistaId = Guard.AgainstDefault(dentistaId, nameof(dentistaId));
        DataHora = dataHora;
        DuracaoMinutos = duracaoMinutos;
        Status = NormalizeStatus(status);
        Procedimento = Guard.AgainstNullOrWhiteSpace(procedimento, nameof(procedimento));
        Observacoes = Guard.NullIfWhiteSpace(observacoes);
    }

    public Guid PacienteId { get; private set; }

    public Guid DentistaId { get; private set; }

    public DateTime DataHora { get; private set; }

    public int DuracaoMinutos { get; private set; }

    public string Status { get; private set; } = StatusAgendamento.Agendado.ToString();

    public string Procedimento { get; private set; } = string.Empty;

    public string? Observacoes { get; private set; }

    public Paciente? Paciente { get; private set; }

    public Dentista? Dentista { get; private set; }

    public void AtualizarStatus(string novoStatus)
    {
        Status = NormalizeStatus(novoStatus);
    }

    public void AtualizarDados(
        Guid pacienteId,
        Guid dentistaId,
        DateTime dataHora,
        int duracaoMinutos,
        string status,
        string procedimento,
        string? observacoes = null)
    {
        PacienteId = Guard.AgainstDefault(pacienteId, nameof(pacienteId));
        DentistaId = Guard.AgainstDefault(dentistaId, nameof(dentistaId));
        DataHora = dataHora;
        DuracaoMinutos = duracaoMinutos;
        Status = NormalizeStatus(status);
        Procedimento = Guard.AgainstNullOrWhiteSpace(procedimento, nameof(procedimento));
        Observacoes = Guard.NullIfWhiteSpace(observacoes);
    }

    private static string NormalizeStatus(string status)
    {
        var sanitizedStatus = Guard.AgainstNullOrWhiteSpace(status, nameof(status));

        if (Enum.TryParse<StatusAgendamento>(sanitizedStatus, ignoreCase: true, out var parsedStatus))
        {
            return parsedStatus.ToString();
        }

        throw new ArgumentException("O status informado é inválido.", nameof(status));
    }
}
