using System.Text.Json;
using System.Linq;
using OdontoCloud.Domain.Enums;

namespace OdontoCloud.Application.UseCases.Prontuario;

internal static class OdontogramaHelper
{
    private static readonly string[] ValidTeeth =
    [
        .. BuildPermanentTeeth(),
        .. BuildDeciduousTeeth()
    ];
    private static readonly HashSet<string> InterventionStatuses =
    [
        StatusDenteOdontograma.carie.ToString(),
        StatusDenteOdontograma.ext.ToString(),
        StatusDenteOdontograma.trat.ToString()
    ];

    public static IReadOnlyCollection<string> GetValidTeeth() => ValidTeeth;

    public static string CreateDefaultJson()
    {
        var map = ValidTeeth.ToDictionary(tooth => tooth, _ => StatusDenteOdontograma.ok.ToString());
        return JsonSerializer.Serialize(map);
    }

    public static Dictionary<string, string> Parse(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return ValidTeeth.ToDictionary(tooth => tooth, _ => StatusDenteOdontograma.ok.ToString());
        }

        var current = JsonSerializer.Deserialize<Dictionary<string, string>>(json) ?? [];

        foreach (var tooth in ValidTeeth)
        {
            if (!current.ContainsKey(tooth))
            {
                current[tooth] = StatusDenteOdontograma.ok.ToString();
            }
        }

        return current;
    }

    public static bool IsValidTooth(string tooth)
    {
        return ValidTeeth.Contains(tooth);
    }

    public static bool IsInterventionStatus(string status)
    {
        return InterventionStatuses.Contains(status);
    }

    public static JsonElement ToJsonElement(string json)
    {
        using var document = JsonDocument.Parse(json);
        return document.RootElement.Clone();
    }

    private static string[] BuildValidTeeth()
    {
        return [.. BuildPermanentTeeth(), .. BuildDeciduousTeeth()];
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
}
