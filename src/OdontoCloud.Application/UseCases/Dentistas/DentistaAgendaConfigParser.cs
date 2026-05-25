using System.Globalization;
using System.Text.Json;
using FluentValidation;

namespace OdontoCloud.Application.UseCases.Dentistas;

public sealed record DentistaAgendaConfig(
    TimeOnly HorarioInicio,
    TimeOnly HorarioFim,
    int DuracaoPadraoMinutos,
    IReadOnlyList<int> DiasDaSemana);

public static class DentistaAgendaConfigParser
{
    private static readonly int[] DiasPadraoAtual = [0, 1, 2, 3, 4, 5, 6];
    private static readonly int[] DiasDeFimDeSemana = [0, 6];
    private static readonly Lazy<TimeZoneInfo> ClinicTimeZone = new(ResolveClinicTimeZone);
    public const string PadraoJson = """{"inicio":"08:00","fim":"18:00","duracaoPadraoMinutos":30,"diasDaSemana":[0,1,2,3,4,5,6]}""";

    public static DentistaAgendaConfig Parse(string? agendaConfigJson)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(agendaConfigJson))
            {
                throw new ValidationException("A configuracao da agenda e obrigatoria.");
            }

            using var documento = JsonDocument.Parse(agendaConfigJson);
            var raiz = documento.RootElement;

            var inicio = GetTimeValue(raiz, "inicio", "08:00");
            var fim = GetTimeValue(raiz, "fim", "18:00");
            var duracao = GetIntValue(raiz, "duracaoPadraoMinutos", 30);
            var dias = GetDiasValue(raiz);

            if (duracao < 10 || duracao > 120)
            {
                throw new ValidationException("Duracao padrao invalida na configuracao da agenda.");
            }

            if (inicio >= fim)
            {
                throw new ValidationException("Horario final da agenda deve ser apos o horario inicial.");
            }

            if (dias.Count == 0)
            {
                dias = DiasPadraoAtual;
            }

            return new DentistaAgendaConfig(inicio, fim, duracao, dias);
        }
        catch (JsonException ex)
        {
            throw new ValidationException($"Configuracao de agenda invalida. {ex.Message}");
        }
    }

    public static DentistaAgendaConfig ParseOrDefault(string? agendaConfigJson)
    {
        try
        {
            return Parse(agendaConfigJson);
        }
        catch
        {
            return Parse(PadraoJson);
        }
    }

    public static bool EstaDentroDaAgenda(this DentistaAgendaConfig config, DateTime dataHora, int duracaoMinutos)
    {
        var dataHoraClinica = ToClinicLocalTime(dataHora);
        var diaSemana = (int)dataHoraClinica.DayOfWeek;
        var isFimDeSemana = DiasDeFimDeSemana.Contains(diaSemana);

        if (config.DiasDaSemana.Count > 0 && !config.DiasDaSemana.Contains(diaSemana))
        {
            return false;
        }

        if (duracaoMinutos <= 0)
        {
            return false;
        }

        var inicio = TimeOnly.FromDateTime(dataHoraClinica);
        var fim = inicio.AddMinutes(duracaoMinutos);

        return inicio >= config.HorarioInicio && fim <= config.HorarioFim;
    }

    private static DateTime ToClinicLocalTime(DateTime dataHora)
    {
        return dataHora.Kind switch
        {
            DateTimeKind.Utc => TimeZoneInfo.ConvertTimeFromUtc(dataHora, ClinicTimeZone.Value),
            DateTimeKind.Local => TimeZoneInfo.ConvertTime(dataHora, ClinicTimeZone.Value),
            _ => dataHora,
        };
    }

    private static TimeZoneInfo ResolveClinicTimeZone()
    {
        foreach (var timeZoneId in new[] { "America/Sao_Paulo", "E. South America Standard Time" })
        {
            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById(timeZoneId);
            }
            catch (TimeZoneNotFoundException)
            {
            }
            catch (InvalidTimeZoneException)
            {
            }
        }

        return TimeZoneInfo.Local;
    }

    private static TimeOnly GetTimeValue(JsonElement raiz, string propriedade, string valorPadrao)
    {
        if (!raiz.TryGetProperty(propriedade, out var valorElement))
        {
            return TimeOnly.ParseExact(valorPadrao, "HH:mm", CultureInfo.InvariantCulture);
        }

        if (valorElement.ValueKind != JsonValueKind.String)
        {
            throw new ValidationException($"Propriedade '{propriedade}' precisa ser uma string no formato HH:mm.");
        }

        var valor = valorElement.GetString();
        if (string.IsNullOrWhiteSpace(valor))
        {
            return TimeOnly.ParseExact(valorPadrao, "HH:mm", CultureInfo.InvariantCulture);
        }

        if (TimeOnly.TryParseExact(valor, "HH:mm", CultureInfo.InvariantCulture, DateTimeStyles.None, out var timeValue))
        {
            return timeValue;
        }

        throw new ValidationException($"Propriedade '{propriedade}' precisa ser uma string no formato HH:mm.");
    }

    private static int GetIntValue(JsonElement raiz, string propriedade, int valorPadrao)
    {
        if (!raiz.TryGetProperty(propriedade, out var valorElement))
        {
            return valorPadrao;
        }

        if (valorElement.ValueKind != JsonValueKind.Number || !valorElement.TryGetInt32(out var valorInt))
        {
            throw new ValidationException($"Propriedade '{propriedade}' precisa ser um inteiro.");
        }

        return valorInt;
    }

    private static IReadOnlyList<int> GetDiasValue(JsonElement raiz)
    {
        if (!raiz.TryGetProperty("diasDaSemana", out var diasElement) ||
            diasElement.ValueKind == JsonValueKind.Null)
        {
            return [];
        }

        if (diasElement.ValueKind != JsonValueKind.Array)
        {
            throw new ValidationException("Propriedade 'diasDaSemana' precisa ser um array.");
        }

        if (diasElement.GetArrayLength() == 0)
        {
            return [];
        }

        var dias = diasElement.EnumerateArray().Select((item, index) =>
        {
            if (item.ValueKind != JsonValueKind.Number || !item.TryGetInt32(out var dia))
            {
                throw new ValidationException(
                    $"Item '{index}' em 'diasDaSemana' precisa ser um inteiro entre 0 e 6.");
            }

            if (dia < 0 || dia > 6)
            {
                throw new ValidationException("Dias da semana devem estar entre 0 (domingo) e 6 (sabado).");
            }

            return dia;
        }).Distinct().ToList();

        return dias;
    }
}
