namespace OdontoCloud.Application.UseCases.Pacientes;

internal static class CpfUtils
{
    public static string Normalize(string cpf)
    {
        return new string(cpf.Where(char.IsDigit).ToArray());
    }

    public static string Format(string cpf)
    {
        var digits = Normalize(cpf);
        return digits.Length == 11
            ? $"{digits[..3]}.{digits.Substring(3, 3)}.{digits.Substring(6, 3)}-{digits.Substring(9, 2)}"
            : cpf;
    }

    public static bool IsValid(string? cpf)
    {
        if (string.IsNullOrWhiteSpace(cpf))
        {
            return false;
        }

        var digits = Normalize(cpf);
        if (digits.Length != 11 || digits.Distinct().Count() == 1)
        {
            return false;
        }

        var firstCheckDigit = CalculateCheckDigit(digits, 9);
        var secondCheckDigit = CalculateCheckDigit(digits, 10);

        return digits[9] - '0' == firstCheckDigit && digits[10] - '0' == secondCheckDigit;
    }

    private static int CalculateCheckDigit(string cpf, int length)
    {
        var sum = 0;
        for (var i = 0; i < length; i++)
        {
            sum += (cpf[i] - '0') * ((length + 1) - i);
        }

        var remainder = sum % 11;
        return remainder < 2 ? 0 : 11 - remainder;
    }
}
