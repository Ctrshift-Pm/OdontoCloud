using OdontoCloud.Domain.Common;

namespace OdontoCloud.Domain.Entities;

public sealed class Prontuario : TenantEntityBase
{
    private readonly List<ItemPlanoTratamento> _itensPlanoTratamento = [];
    private readonly List<ProntuarioAuditoria> _auditorias = [];

    private Prontuario()
    {
    }

    public Prontuario(Guid pacienteId, string anamneseJson, string odontogramaJson)
    {
        PacienteId = Guard.AgainstDefault(pacienteId, nameof(pacienteId));
        AnamneseJson = Guard.AgainstNullOrWhiteSpace(anamneseJson, nameof(anamneseJson));
        OdontogramaJson = Guard.AgainstNullOrWhiteSpace(odontogramaJson, nameof(odontogramaJson));
    }

    public Guid PacienteId { get; private set; }

    public string AnamneseJson { get; private set; } = "{}";

    public string OdontogramaJson { get; private set; } = "{}";

    public DateTimeOffset? AnamneseAtualizadaEmUtc { get; private set; }

    public DateTimeOffset? OdontogramaAtualizadoEmUtc { get; private set; }

    public Paciente? Paciente { get; private set; }

    public IReadOnlyCollection<ItemPlanoTratamento> ItensPlanoTratamento => _itensPlanoTratamento;

    public IReadOnlyCollection<ProntuarioAuditoria> Auditorias => _auditorias;

    public void AtualizarAnamnese(string anamneseJson, Guid usuarioId, DateTimeOffset atualizadoEmUtc)
    {
        AnamneseJson = Guard.AgainstNullOrWhiteSpace(anamneseJson, nameof(anamneseJson));
        AnamneseAtualizadaEmUtc = atualizadoEmUtc;
    }

    public void AtualizarOdontograma(string odontogramaJson, Guid usuarioId, DateTimeOffset atualizadoEmUtc, string detalhesJson)
    {
        OdontogramaJson = Guard.AgainstNullOrWhiteSpace(odontogramaJson, nameof(odontogramaJson));
        OdontogramaAtualizadoEmUtc = atualizadoEmUtc;
    }

    public void AdicionarItemPlanoTratamento(ItemPlanoTratamento itemPlanoTratamento)
    {
        _itensPlanoTratamento.Add(itemPlanoTratamento);
    }
}
