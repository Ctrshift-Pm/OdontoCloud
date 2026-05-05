using System.Net.Mail;

namespace OdontoCloud.Domain.Common;

internal static class Guard
{
    public static Guid AgainstDefault(Guid value, string paramName)
    {
        if (value == Guid.Empty)
        {
            throw new ArgumentException("O identificador informado é obrigatório.", paramName);
        }

        return value;
    }

    public static string AgainstNullOrWhiteSpace(string? value, string paramName)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentException("O valor informado é obrigatório.", paramName);
        }

        return value.Trim();
    }

    public static string? NullIfWhiteSpace(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    public static string NormalizeEmail(string? email, string paramName)
    {
        var sanitizedEmail = AgainstNullOrWhiteSpace(email, paramName);

        try
        {
            return new MailAddress(sanitizedEmail).Address.ToLowerInvariant();
        }
        catch (FormatException ex)
        {
            throw new ArgumentException("O e-mail informado é inválido.", paramName, ex);
        }
    }
}
