using OdontoCloud.Domain.Entities;

namespace OdontoCloud.Application.UseCases.FinanceiroPagar;

public sealed record ContaPagarDto(
    Guid Id,
    string FornecedorDestinatario,
    string Categoria,
    string Descricao,
    decimal Valor,
    DateTime DataVencimento,
    DateTime? DataPagamento,
    Guid? UsuarioBaixaId,
    Guid? DentistaId,
    string Status)
{
    public static ContaPagarDto FromEntity(ContaPagar contaPagar)
    {
        return new ContaPagarDto(
            contaPagar.Id,
            contaPagar.FornecedorDestinatario,
            contaPagar.Categoria,
            contaPagar.Descricao,
            contaPagar.Valor,
            contaPagar.DataVencimento,
            contaPagar.DataPagamento,
            contaPagar.UsuarioBaixaId,
            contaPagar.DentistaId,
            contaPagar.Status.ToString());
    }
}
