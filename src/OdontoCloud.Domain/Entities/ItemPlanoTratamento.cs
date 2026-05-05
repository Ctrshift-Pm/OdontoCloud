using OdontoCloud.Domain.Common;
using OdontoCloud.Domain.Enums;

namespace OdontoCloud.Domain.Entities;

public sealed class ItemPlanoTratamento : TenantEntityBase
{
    private ItemPlanoTratamento()
    {
    }

    public ItemPlanoTratamento(
        Guid prontuarioId,
        Guid pacienteId,
        string denteFdi,
        int? numeroDente,
        Guid? dentistaId,
        string statusOdontograma,
        string procedimento,
        decimal valorBase)
    {
        ProntuarioId = Guard.AgainstDefault(prontuarioId, nameof(prontuarioId));
        PacienteId = Guard.AgainstDefault(pacienteId, nameof(pacienteId));
        DenteFdi = Guard.AgainstNullOrWhiteSpace(denteFdi, nameof(denteFdi));
        NumeroDente = numeroDente;
        DentistaId = dentistaId == Guid.Empty ? null : dentistaId;
        StatusOdontograma = Guard.AgainstNullOrWhiteSpace(statusOdontograma, nameof(statusOdontograma));
        Procedimento = Guard.AgainstNullOrWhiteSpace(procedimento, nameof(procedimento));
        ValorBase = valorBase;
        Status = StatusItemPlano.Orcado.ToString();
    }

    public Guid ProntuarioId { get; private set; }

    public Guid PacienteId { get; private set; }

    public string DenteFdi { get; private set; } = string.Empty;

    public int? NumeroDente { get; private set; }

    public Guid? DentistaId { get; private set; }

    public string StatusOdontograma { get; private set; } = string.Empty;

    public string Procedimento { get; private set; } = string.Empty;

    public decimal ValorBase { get; private set; }

    public string Status { get; private set; } = StatusItemPlano.Orcado.ToString();

    public Prontuario? Prontuario { get; private set; }

    public Dentista? Dentista { get; private set; }

    public void Aprovar()
    {
        if (!string.Equals(Status, StatusItemPlano.Orcado.ToString(), StringComparison.Ordinal))
        {
            throw new InvalidOperationException("Apenas itens orcados podem ser aprovados.");
        }

        Status = StatusItemPlano.Aprovado.ToString();
    }

    public void Concluir()
    {
        if (!string.Equals(Status, StatusItemPlano.Aprovado.ToString(), StringComparison.Ordinal) &&
            !string.Equals(Status, StatusItemPlano.EmExecucao.ToString(), StringComparison.Ordinal))
        {
            throw new InvalidOperationException("Apenas itens aprovados ou em execucao podem ser concluidos.");
        }

        Status = StatusItemPlano.Concluido.ToString();
    }
}
