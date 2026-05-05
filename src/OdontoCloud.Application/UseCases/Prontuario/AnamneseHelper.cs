using System.Text.Json;

namespace OdontoCloud.Application.UseCases.Prontuario;

internal static class AnamneseHelper
{
    public static string CreateDefaultJson() => "{}";

    public static JsonElement ToJsonElement(string json)
    {
        using var document = JsonDocument.Parse(string.IsNullOrWhiteSpace(json) ? "{}" : json);
        return document.RootElement.Clone();
    }
}
