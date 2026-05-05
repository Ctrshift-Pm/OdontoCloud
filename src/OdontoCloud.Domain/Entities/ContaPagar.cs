using OdontoCloud.Domain.Common;
using OdontoCloud.Domain.Enums;

namespace OdontoCloud.Domain.Entities;

public sealed class ContaPagar : TenantEntityBase
{
    private ContaPagar()
    {
    }

    public ContaPagar(
        string fornecedorDestinatario,
        string categoria,
        string descricao,
        decimal valor,
        DateTime dataVencimento,
        Guid? dentistaId = null)
    {
        FornecedorDestinatario = Guard.AgainstNullOrWhiteSpace(fornecedorDestinatario, nameof(fornecedorDestinatario));
        Categoria = Guard.AgainstNullOrWhiteSpace(categoria, nameof(categoria));
        Descricao = Guard.AgainstNullOrWhiteSpace(descricao, nameof(descricao));
        Valor = valor > 0m ? valor : throw new ArgumentOutOfRangeException(nameof(valor), "O valor deve ser maior que zero.");
        DataVencimento = EnsureUtc(dataVencimento);
        DentistaId = dentistaId == Guid.Empty ? null : dentistaId;
        Status = StatusContaPagar.Pendente;
    }

    public string FornecedorDestinatario { get; private set; } = string.Empty;

    public string Categoria { get; private set; } = string.Empty;

    public string Descricao { get; private set; } = string.Empty;

    public decimal Valor { get; private set; }

    public DateTime DataVencimento { get; private set; }

    public DateTime? DataPagamento { get; private set; }

    public Guid? UsuarioBaixaId { get; private set; }

    public Guid? DentistaId { get; private set; }

    public StatusContaPagar Status { get; private set; }

    public Dentista? Dentista { get; private set; }

    public void RegistrarPagamento(Guid usuarioBaixaId, DateTime dataPagamentoUtc)
    {
        if (Status == StatusContaPagar.Cancelado)
        {
            throw new InvalidOperationException("Nao e possivel pagar uma conta cancelada.");
        }

        if (Status == StatusContaPagar.Pago)
        {
            throw new InvalidOperationException("A conta ja foi paga.");
        }

        UsuarioBaixaId = Guard.AgainstDefault(usuarioBaixaId, nameof(usuarioBaixaId));
        DataPagamento = EnsureUtc(dataPagamentoUtc);
        Status = StatusContaPagar.Pago;
    }

    public void MarcarComoAtrasadoSeNecessario(DateTime utcNow)
    {
        if (Status == StatusContaPagar.Pendente && utcNow.Date > DataVencimento.Date)
        {
            Status = StatusContaPagar.Atrasado;
        }
    }

    private static DateTime EnsureUtc(DateTime dateTime)
    {
        return dateTime.Kind switch
        {
            DateTimeKind.Utc => dateTime,
            DateTimeKind.Unspecified => DateTime.SpecifyKind(dateTime, DateTimeKind.Utc),
            _ => dateTime.ToUniversalTime()
        };
    }
}
