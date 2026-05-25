using OdontoCloud.Domain.Common;
using OdontoCloud.Domain.Enums;

namespace OdontoCloud.Domain.Entities;

public sealed class Paciente : TenantEntityBase
{
    private Paciente()
    {
    }

    public Paciente(
        string nome,
        string cpf,
        string telefoneWhatsapp,
        DateOnly? dataNascimento = null,
        string? email = null,
        string? convenio = null,
        StatusPaciente status = StatusPaciente.Ativo,
        CrmKanbanStatus crmKanbanStatus = CrmKanbanStatus.Novo,
        string? cidade = null,
        Guid? dentistaResponsavelId = null)
    {
        Nome = Guard.AgainstNullOrWhiteSpace(nome, nameof(nome));
        Cpf = Guard.AgainstNullOrWhiteSpace(cpf, nameof(cpf));
        TelefoneWhatsapp = Guard.AgainstNullOrWhiteSpace(telefoneWhatsapp, nameof(telefoneWhatsapp));
        DataNascimento = dataNascimento;
        Email = email is null ? null : Guard.NormalizeEmail(email, nameof(email));
        Convenio = Guard.NullIfWhiteSpace(convenio);
        Status = status;
        CrmKanbanStatus = crmKanbanStatus;
        Cidade = Guard.NullIfWhiteSpace(cidade);
        DentistaResponsavelId = dentistaResponsavelId.HasValue
            ? Guard.AgainstDefault(dentistaResponsavelId.Value, nameof(dentistaResponsavelId))
            : null;
    }

    public Paciente(
        Guid clinicaId,
        string nome,
        string cpf,
        string telefoneWhatsapp,
        DateOnly? dataNascimento = null,
        string? email = null,
        string? convenio = null,
        StatusPaciente status = StatusPaciente.Ativo,
        string? cidade = null,
        Guid? dentistaResponsavelId = null,
        CrmKanbanStatus crmKanbanStatus = CrmKanbanStatus.Novo)
        : base(clinicaId)
    {
        Nome = Guard.AgainstNullOrWhiteSpace(nome, nameof(nome));
        Cpf = Guard.AgainstNullOrWhiteSpace(cpf, nameof(cpf));
        TelefoneWhatsapp = Guard.AgainstNullOrWhiteSpace(telefoneWhatsapp, nameof(telefoneWhatsapp));
        DataNascimento = dataNascimento;
        Email = email is null ? null : Guard.NormalizeEmail(email, nameof(email));
        Convenio = Guard.NullIfWhiteSpace(convenio);
        Status = status;
        CrmKanbanStatus = crmKanbanStatus;
        Cidade = Guard.NullIfWhiteSpace(cidade);
        DentistaResponsavelId = dentistaResponsavelId.HasValue
            ? Guard.AgainstDefault(dentistaResponsavelId.Value, nameof(dentistaResponsavelId))
            : null;
    }

    public string Nome { get; private set; } = string.Empty;

    public string Cpf { get; private set; } = string.Empty;

    public DateOnly? DataNascimento { get; private set; }

    public string TelefoneWhatsapp { get; private set; } = string.Empty;

    public string? Email { get; private set; }

    public string? Convenio { get; private set; }

    public StatusPaciente Status { get; private set; }

    public CrmKanbanStatus CrmKanbanStatus { get; private set; }

    public string? Cidade { get; private set; }

    public Guid? DentistaResponsavelId { get; private set; }

    public ICollection<Agendamento> Agendamentos { get; private set; } = [];

    public Prontuario? Prontuario { get; private set; }

    public void AtualizarStatusCrmKanban(CrmKanbanStatus novoStatus)
    {
        CrmKanbanStatus = novoStatus;
    }
}
