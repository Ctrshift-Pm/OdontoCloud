using System.Text.Json;
using System.Linq;
using OdontoCloud.Domain.Enums;

namespace OdontoCloud.Application.UseCases.Prontuario;

internal static class OdontogramaHelper
{
    private const int DefaultCariePercentual = 100;
    private const int MinCariePercentual = 1;
    private const int MaxCariePercentual = 100;

    private static readonly string[] PermanentTeeth = BuildPermanentTeeth();
    private static readonly string[] DeciduousTeeth = BuildDeciduousTeeth();
    private static readonly string[] AllTeeth = [.. PermanentTeeth, .. DeciduousTeeth];
    private static readonly string[] ValidTeeth = AllTeeth;
    private static readonly HashSet<string> InterventionStatuses =
    [
        StatusDenteOdontograma.carie.ToString(),
        StatusDenteOdontograma.ext.ToString(),
        StatusDenteOdontograma.trat.ToString()
    ];

    public sealed record EstadoDenteOdontograma(string Status, int? CariePercentual);

    public static readonly IReadOnlyDictionary<string, string[]> Denticoes = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
    {
        ["Permanente"] = PermanentTeeth,
        ["Decidua"] = DeciduousTeeth,
        ["Mista"] = AllTeeth
    };

    public static IReadOnlyCollection<string> GetValidTeeth() => ValidTeeth;

    public static IReadOnlyCollection<string> GetTeethForDenticao(TipoDenticao denticao) =>
        denticao == TipoDenticao.Decidua
            ? DeciduousTeeth
            : denticao == TipoDenticao.Mista
                ? AllTeeth
                : PermanentTeeth;

    public static TipoDenticao GetDefaultDenticao(DateOnly? dataNascimento)
    {
        if (!dataNascimento.HasValue)
        {
            return TipoDenticao.Permanente;
        }

        var dataNascimentoConvertida = dataNascimento.Value.ToDateTime(TimeOnly.MinValue);
        var idade = DateTime.UtcNow.Date.Year - dataNascimentoConvertida.Year;
        if (dataNascimentoConvertida.Date > DateTime.UtcNow.Date.AddYears(-idade))
        {
            idade--;
        }

        return idade >= 18
            ? TipoDenticao.Permanente
            : TipoDenticao.Decidua;
    }

    public static bool EnsureTeethForDenticao(
        Dictionary<string, EstadoDenteOdontograma> odontograma,
        TipoDenticao denticao)
    {
        var altered = false;
        foreach (var tooth in GetTeethForDenticao(denticao))
        {
            if (!odontograma.ContainsKey(tooth))
            {
                odontograma[tooth] = new EstadoDenteOdontograma(
                    StatusDenteOdontograma.ok.ToString(),
                    null);
                altered = true;
            }
        }

        return altered;
    }

    public static Dictionary<string, EstadoDenteOdontograma> CreateDefaultMap()
    {
        return ValidTeeth.ToDictionary(
            tooth => tooth,
            _ => new EstadoDenteOdontograma(StatusDenteOdontograma.ok.ToString(), null),
            StringComparer.Ordinal);
    }

    public static string CreateDefaultJson()
    {
        var map = CreateDefaultMap();
        return JsonSerializer.Serialize(map);
    }

    public static Dictionary<string, EstadoDenteOdontograma> Parse(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return CreateDefaultMap();
        }

        var parsedDocument = JsonSerializer.Deserialize<JsonElement>(json);
        var current = new Dictionary<string, EstadoDenteOdontograma>(StringComparer.Ordinal);

        if (parsedDocument.ValueKind == JsonValueKind.Object)
        {
            foreach (var property in parsedDocument.EnumerateObject())
            {
                current[property.Name] = ParseEstado(property.Value);
            }
        }

        foreach (var tooth in ValidTeeth)
        {
            if (!current.ContainsKey(tooth))
            {
                current[tooth] = new EstadoDenteOdontograma(StatusDenteOdontograma.ok.ToString(), null);
            }
        }

        return current;
    }

    public static bool IsValidStatus(string? status)
    {
        return Enum.TryParse<StatusDenteOdontograma>(status, ignoreCase: true, out _);
    }

    public static bool IsValidCariePercentual(int? percentual)
    {
        if (percentual is null)
        {
            return true;
        }

        return percentual is >= MinCariePercentual and <= MaxCariePercentual;
    }

    public static int ResolveCariePercentualOuDefault(int? percentual)
    {
        return percentual is >= MinCariePercentual and <= MaxCariePercentual ? percentual.Value : DefaultCariePercentual;
    }

    public static bool IsValidTooth(string tooth)
    {
        return ValidTeeth.Contains(tooth);
    }

    public static bool IsInterventionStatus(string status)
    {
        return InterventionStatuses.Contains(status);
    }

    public static EstadoDenteOdontograma? TryGetEstado(Dictionary<string, EstadoDenteOdontograma> odontograma, string? tooth)
    {
        return string.IsNullOrWhiteSpace(tooth) ? null : odontograma.GetValueOrDefault(tooth);
    }

    public static JsonElement ToJsonElement(string json)
    {
        using var document = JsonDocument.Parse(json);
        return document.RootElement.Clone();
    }

    private static string[] BuildPermanentTeeth()
    {
        var teeth = new List<string>();
        for (var quadrant = 1; quadrant <= 4; quadrant++)
        {
            for (var tooth = 1; tooth <= 8; tooth++)
            {
                teeth.Add($"{quadrant}{tooth}");
            }
        }

        return teeth.ToArray();
    }

    private static string[] BuildDeciduousTeeth()
    {
        var groups = new[]
        {
            new[] { "55", "54", "53", "52", "51" },
            new[] { "61", "62", "63", "64", "65" },
            new[] { "85", "84", "83", "82", "81" },
            new[] { "71", "72", "73", "74", "75" },
        };

        return groups.SelectMany(g => g).ToArray();
    }

    private static EstadoDenteOdontograma ParseEstado(JsonElement rawEstado)
    {
        if (rawEstado.ValueKind == JsonValueKind.String)
        {
            var statusString = rawEstado.GetString();
            return BuildEstado(statusString, null);
        }

        if (rawEstado.ValueKind != JsonValueKind.Object)
        {
            return new EstadoDenteOdontograma(StatusDenteOdontograma.ok.ToString(), null);
        }

        string? status = null;
        int? cariePercentual = null;

        foreach (var propriedade in rawEstado.EnumerateObject())
        {
            if (propriedade.Name.Equals("status", StringComparison.OrdinalIgnoreCase))
            {
                status = propriedade.Value.GetString();
                continue;
            }

            if (propriedade.Name.Equals("cariePercentual", StringComparison.OrdinalIgnoreCase))
            {
                if (propriedade.Value.ValueKind == JsonValueKind.Number && propriedade.Value.TryGetInt32(out var percentualNumero))
                {
                    cariePercentual = percentualNumero;
                }
                else if (propriedade.Value.ValueKind == JsonValueKind.String && int.TryParse(propriedade.Value.GetString(), out var percentualTexto))
                {
                    cariePercentual = percentualTexto;
                }
            }
        }

        return BuildEstado(status, cariePercentual);
    }

    private static EstadoDenteOdontograma BuildEstado(string? status, int? cariePercentual)
    {
        var statusNormalizado = string.IsNullOrWhiteSpace(status)
            ? StatusDenteOdontograma.ok.ToString()
            : status.Trim().ToLowerInvariant();

        if (!Enum.TryParse<StatusDenteOdontograma>(statusNormalizado, true, out var statusEnum))
        {
            return new EstadoDenteOdontograma(StatusDenteOdontograma.ok.ToString(), null);
        }

        if (statusEnum != StatusDenteOdontograma.carie)
        {
            return new EstadoDenteOdontograma(statusEnum.ToString(), null);
        }

        return new EstadoDenteOdontograma(
            statusEnum.ToString(),
            ResolveCariePercentualOuDefault(cariePercentual));
    }
}
