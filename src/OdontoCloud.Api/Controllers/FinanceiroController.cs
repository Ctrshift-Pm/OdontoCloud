using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OdontoCloud.Application.UseCases.Financeiro;
using OdontoCloud.Application.UseCases.Financeiro.Commands;
using OdontoCloud.Application.UseCases.Financeiro.Queries;
using OdontoCloud.Domain.Enums;
using OdontoCloud.Infrastructure.Identity;

namespace OdontoCloud.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/financeiro")]
public sealed class FinanceiroController : ControllerBase
{
    private readonly ISender _sender;

    public FinanceiroController(ISender sender)
    {
        _sender = sender;
    }

    [HttpPost("faturar-plano")]
    [Permission(ModuloSistema.Financeiro, AcaoPermissao.Criar)]
    public async Task<ActionResult<ContaReceberDto>> FaturarPlano(
        [FromBody] FaturarPlanoTratamentoCommand command,
        CancellationToken cancellationToken)
    {
        var response = await _sender.Send(command, cancellationToken);
        return Ok(response);
    }

    [HttpPost("receber")]
    [Permission(ModuloSistema.Financeiro, AcaoPermissao.Criar)]
    public async Task<ActionResult<ContaReceberDto>> Create([FromBody] CreateContaReceberCommand command, CancellationToken cancellationToken)
    {
        var response = await _sender.Send(command, cancellationToken);
        return Ok(response);
    }

    [HttpPatch("receber/{id:guid}")]
    [Permission(ModuloSistema.Financeiro, AcaoPermissao.Editar)]
    public async Task<ActionResult<ContaReceberDto>> Receber(
        Guid id,
        [FromBody] ReceberPagamentoRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _sender.Send(
            new ReceberPagamentoCommand(id, request.ValorPago, request.FormaPagamento),
            cancellationToken);

        if (response is null)
        {
            return NotFound();
        }

        return Ok(response);
    }

    [HttpPut("receber/{id:guid}")]
    [Permission(ModuloSistema.Financeiro, AcaoPermissao.Editar)]
    public async Task<ActionResult<ContaReceberDto>> Update(
        Guid id,
        [FromBody] UpdateContaReceberRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _sender.Send(
            new UpdateContaReceberCommand(id, request.ValorBase, request.Desconto, request.DataVencimento),
            cancellationToken);

        if (response is null)
        {
            return NotFound();
        }

        return Ok(response);
    }

    [HttpDelete("receber/{id:guid}")]
    [Permission(ModuloSistema.Financeiro, AcaoPermissao.Excluir)]
    public async Task<ActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var response = await _sender.Send(new DeleteContaReceberCommand(id), cancellationToken);
        if (!response)
        {
            return NotFound();
        }

        return NoContent();
    }

    [HttpGet("pendentes")]
    [Permission(ModuloSistema.Financeiro, AcaoPermissao.Visualizar)]
    public async Task<ActionResult<IReadOnlyList<ContaReceberDto>>> GetPendentes(
        [FromQuery] Guid pacienteId,
        CancellationToken cancellationToken)
    {
        var response = await _sender.Send(new GetContasReceberPendentesQuery(pacienteId), cancellationToken);
        return Ok(response);
    }

    [HttpGet("receber")]
    [Permission(ModuloSistema.Financeiro, AcaoPermissao.Visualizar)]
    public async Task<ActionResult<IReadOnlyList<ContaReceberDto>>> GetPorPeriodo(
        [FromQuery] DateTime? dataInicio,
        [FromQuery] DateTime? dataFim,
        [FromQuery] StatusContaReceber? status,
        CancellationToken cancellationToken)
    {
        var response = await _sender.Send(
            new GetContasReceberPorPeriodoQuery(dataInicio, dataFim, status),
            cancellationToken);

        return Ok(response);
    }

    public sealed record ReceberPagamentoRequest(decimal ValorPago, string FormaPagamento);

    public sealed record UpdateContaReceberRequest(decimal ValorBase, decimal Desconto, DateTime DataVencimento);
}
