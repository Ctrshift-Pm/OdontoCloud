using OdontoCloud.Domain.Common;
using OdontoCloud.Domain.Enums;

namespace OdontoCloud.Domain.Entities;

public sealed class ContaReceber : TenantEntityBase
{
    private ContaReceber()
    {
    }

    public ContaReceber(
        Guid pacienteId,
        Guid? itemPlanoTratamentoId,
        Guid? dentistaId,
        decimal valorBase,
        decimal desconto,
        DateTime dataVencimento)
    {
        PacienteId = Guard.AgainstDefault(pacienteId, nameof(pacienteId));
        ItemPlanoTratamentoId = itemPlanoTratamentoId == Guid.Empty ? null : itemPlanoTratamentoId;
        DentistaId = dentistaId == Guid.Empty ? null : dentistaId;
        ValorBase = valorBase;
        Desconto = desconto;
        ValorFinal = Math.Max(valorBase - desconto, 0m);
        DataVencimento = EnsureUtc(dataVencimento);
        Status = StatusContaReceber.Pendente.ToString();
    }

    public Guid PacienteId { get; private set; }

    public Guid? ItemPlanoTratamentoId { get; private set; }

    public Guid? DentistaId { get; private set; }

    public decimal ValorBase { get; private set; }

    public decimal Desconto { get; private set; }

    public decimal ValorFinal { get; private set; }

    public DateTime DataVencimento { get; private set; }

    public DateTime? DataPagamento { get; private set; }

    public string? FormaPagamento { get; private set; }

    public Guid? UsuarioBaixaId { get; private set; }

    public string Status { get; private set; } = StatusContaReceber.Pendente.ToString();

    public Paciente? Paciente { get; private set; }

    public ItemPlanoTratamento? ItemPlanoTratamento { get; private set; }

    public Dentista? Dentista { get; private set; }

    public void RegistrarPagamento(decimal valorPago, string formaPagamento, Guid usuarioBaixaId, DateTime dataPagamentoUtc)
    {
        if (valorPago <= 0)
        {
            throw new ArgumentException("O valor pago deve ser maior que zero.", nameof(valorPago));
        }

        FormaPagamento = Guard.AgainstNullOrWhiteSpace(formaPagamento, nameof(formaPagamento));
        UsuarioBaixaId = Guard.AgainstDefault(usuarioBaixaId, nameof(usuarioBaixaId));
        DataPagamento = EnsureUtc(dataPagamentoUtc);
        ValorFinal = Math.Max(ValorFinal - valorPago, 0m);
        Status = ValorFinal == 0m
            ? StatusContaReceber.Pago.ToString()
            : StatusContaReceber.Parcial.ToString();
    }

    public void AtualizarDados(decimal valorBase, decimal desconto, DateTime dataVencimento)
    {
        if (valorBase <= 0m)
        {
            throw new ArgumentException("O valor base deve ser maior que zero.", nameof(valorBase));
        }

        if (desconto < 0m)
        {
            throw new ArgumentException("O desconto nao pode ser negativo.", nameof(desconto));
        }

        if (desconto > valorBase)
        {
            throw new ArgumentException("O desconto nao pode ser maior que o valor base.", nameof(desconto));
        }

        ValorBase = valorBase;
        Desconto = desconto;
        ValorFinal = Math.Max(valorBase - desconto, 0m);
        DataVencimento = EnsureUtc(dataVencimento);
    }

    public bool PodeSerEditadaOuExcluidaNoCrud() =>
        Status is not null && (Status == StatusContaReceber.Pendente.ToString() || Status == StatusContaReceber.Atrasado.ToString());

    public void MarcarComoAtrasadoSeNecessario(DateTime utcNow)
    {
        if ((Status == StatusContaReceber.Pendente.ToString() || Status == StatusContaReceber.Parcial.ToString()) &&
            utcNow.Date > DataVencimento.Date)
        {
            Status = StatusContaReceber.Atrasado.ToString();
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
