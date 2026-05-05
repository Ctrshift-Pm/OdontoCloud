namespace OdontoCloud.Application.UseCases.Financeiro;

public sealed record ContaReceberDto(
    Guid Id,
    Guid PacienteId,
    Guid? ItemPlanoTratamentoId,
    decimal ValorBase,
    decimal Desconto,
    decimal ValorFinal,
    DateTime DataVencimento,
    DateTime? DataPagamento,
    string? FormaPagamento,
    Guid? UsuarioBaixaId,
    string Status);
