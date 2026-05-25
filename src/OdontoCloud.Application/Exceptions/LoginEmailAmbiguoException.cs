using System;

namespace OdontoCloud.Application.Exceptions;

public sealed class LoginEmailAmbiguoException : InvalidOperationException
{
    public LoginEmailAmbiguoException()
        : base("O e-mail está associado a múltiplas clínicas. Informe a clínica para autenticar.")
    {
    }
}
