using System.Text.Json;
using FluentValidation;

namespace OdontoCloud.Application.UseCases.FinanceiroPagar;

internal static class ComissaoRuleParser
{
    public static decimal ParsePercentualFixo(string regraComissaoJson)
    {
        try
        {
            using var document = JsonDocument.Parse(regraComissaoJson);
            var root = document.RootElement;

            var tipo = root.TryGetProperty("tipo", out var tipoElement)
                ? tipoElement.GetString()
                : null;

            if (!string.Equals(tipo, "PercentualFixo", StringComparison.OrdinalIgnoreCase))
            {
                throw new ValidationException("Regra de comissao do dentista invalida.");
            }

            if (!root.TryGetProperty("percentual", out var percentualElement) ||
                percentualElement.ValueKind != JsonValueKind.Number ||
                !percentualElement.TryGetDecimal(out var percentual) ||
                percentual <= 0m)
            {
                throw new ValidationException("Percentual de comissao do dentista invalido.");
            }

            return percentual;
        }
        catch (JsonException ex)
        {
            throw new ValidationException($"Regra de comissao do dentista invalida. {ex.Message}");
        }
    }
}
