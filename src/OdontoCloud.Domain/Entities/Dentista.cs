using OdontoCloud.Domain.Common;

namespace OdontoCloud.Domain.Entities;

public sealed class Dentista : TenantEntityBase
{
    public const string RegraComissaoPadraoJson = """{"tipo":"PercentualFixo","percentual":30}""";
    public const string AgendaConfigPadraoJson = """{"inicio":"08:00","fim":"18:00","duracaoPadraoMinutos":30,"diasDaSemana":[1,2,3,4,5]}""";

    private Dentista()
    {
    }

    public Dentista(
        string nome,
        string? especialidade = null,
        string? regraComissaoJson = null,
        string? agendaConfigJson = null,
        bool ativo = true)
    {
        Nome = Guard.AgainstNullOrWhiteSpace(nome, nameof(nome));
        Especialidade = Guard.NullIfWhiteSpace(especialidade);
        RegraComissaoJson = Guard.AgainstNullOrWhiteSpace(
            regraComissaoJson ?? RegraComissaoPadraoJson,
            nameof(regraComissaoJson));
        AgendaConfigJson = Guard.AgainstNullOrWhiteSpace(
            agendaConfigJson ?? AgendaConfigPadraoJson,
            nameof(agendaConfigJson));
        Ativo = ativo;
    }

    public Dentista(
        Guid clinicaId,
        string nome,
        string? especialidade = null,
        string? regraComissaoJson = null,
        string? agendaConfigJson = null,
        bool ativo = true)
        : base(clinicaId)
    {
        Nome = Guard.AgainstNullOrWhiteSpace(nome, nameof(nome));
        Especialidade = Guard.NullIfWhiteSpace(especialidade);
        RegraComissaoJson = Guard.AgainstNullOrWhiteSpace(
            regraComissaoJson ?? RegraComissaoPadraoJson,
            nameof(regraComissaoJson));
        AgendaConfigJson = Guard.AgainstNullOrWhiteSpace(
            agendaConfigJson ?? AgendaConfigPadraoJson,
            nameof(agendaConfigJson));
        Ativo = ativo;
    }

    public string Nome { get; private set; } = string.Empty;

    public string? Especialidade { get; private set; }

    public string RegraComissaoJson { get; private set; } = RegraComissaoPadraoJson;

    public string AgendaConfigJson { get; private set; } = AgendaConfigPadraoJson;

    public bool Ativo { get; private set; }

    public ICollection<Agendamento> Agendamentos { get; private set; } = [];

    public ICollection<ItemPlanoTratamento> ItensPlanoTratamento { get; private set; } = [];

    public ICollection<ContaReceber> ContasReceber { get; private set; } = [];

    public ICollection<ContaPagar> ContasPagar { get; private set; } = [];
}
