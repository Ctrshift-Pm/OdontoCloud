using System.Text.Json;
using FluentValidation;
using MediatR;
using OdontoCloud.Application.Interfaces;
using OdontoCloud.Application.UseCases.Prontuario;
using OdontoCloud.Domain.Entities;

namespace OdontoCloud.Application.UseCases.PlanoTratamento.Commands;

public sealed class ConcluirItemPlanoCommandHandler : IRequestHandler<ConcluirItemPlanoCommand, ItemPlanoTratamentoDto?>
{
    private readonly IItemPlanoTratamentoRepository _itemPlanoTratamentoRepository;
    private readonly IProntuarioRepository _prontuarioRepository;
    private readonly ITenantService _tenantService;

    public ConcluirItemPlanoCommandHandler(
        IItemPlanoTratamentoRepository itemPlanoTratamentoRepository,
        IProntuarioRepository prontuarioRepository,
        ITenantService tenantService)
    {
        _itemPlanoTratamentoRepository = itemPlanoTratamentoRepository;
        _prontuarioRepository = prontuarioRepository;
        _tenantService = tenantService;
    }

    public async Task<ItemPlanoTratamentoDto?> Handle(ConcluirItemPlanoCommand request, CancellationToken cancellationToken)
    {
        var item = await _itemPlanoTratamentoRepository.GetByIdAsync(request.ItemPlanoTratamentoId, cancellationToken);
        if (item is null)
        {
            return null;
        }

        var prontuario = await _prontuarioRepository.GetByIdForUpdateAsync(item.ProntuarioId, cancellationToken);
        if (prontuario is null)
        {
            throw new ValidationException("Prontuario vinculado nao encontrado.");
        }

        try
        {
            item.Concluir();
        }
        catch (InvalidOperationException ex)
        {
            throw new ValidationException(ex.Message);
        }

        if (item.NumeroDente.HasValue)
        {
            var dente = item.NumeroDente.Value.ToString();
            var odontograma = OdontogramaHelper.Parse(prontuario.OdontogramaJson);
            var statusAnterior = odontograma.TryGetValue(dente, out var currentStatus) ? currentStatus : "ok";
            odontograma[dente] = "ok";

            var now = DateTimeOffset.UtcNow;
            var usuarioId = _tenantService.GetCurrentUsuarioId();
            var odontogramaJson = JsonSerializer.Serialize(odontograma);
            var detalhesJson = JsonSerializer.Serialize(new
            {
                ItemPlanoTratamentoId = item.Id,
                Dente = dente,
                StatusAnterior = statusAnterior,
                NovoStatus = "ok"
            });

            prontuario.AtualizarOdontograma(odontogramaJson, usuarioId, now, detalhesJson);
            await _prontuarioRepository.AddAuditoriaAsync(
                new ProntuarioAuditoria(
                    prontuario.Id,
                    usuarioId,
                    "ItemPlanoConcluido",
                    now,
                    detalhesJson),
                cancellationToken);
        }

        await _itemPlanoTratamentoRepository.SaveChangesAsync(cancellationToken);

        return new ItemPlanoTratamentoDto(
            item.Id,
            item.NumeroDente,
            item.DenteFdi,
            item.StatusOdontograma,
            item.Procedimento,
            item.ValorBase,
            item.Status);
    }
}
