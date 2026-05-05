namespace OdontoCloud.Application.UseCases.Prontuario;

public sealed record ItemPlanoTratamentoDto(
    Guid Id,
    int? NumeroDente,
    string DenteFdi,
    string StatusOdontograma,
    string Procedimento,
    decimal ValorBase,
    string Status);
