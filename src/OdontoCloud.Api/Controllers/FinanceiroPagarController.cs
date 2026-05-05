using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OdontoCloud.Application.UseCases.FinanceiroPagar;
using OdontoCloud.Application.UseCases.FinanceiroPagar.Commands;
using OdontoCloud.Application.UseCases.FinanceiroPagar.Queries;
using OdontoCloud.Domain.Enums;
using OdontoCloud.Infrastructure.Identity;

namespace OdontoCloud.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/financeiro/contas-pagar")]
public sealed class FinanceiroPagarController : ControllerBase
{
    private readonly ISender _sender;

    public FinanceiroPagarController(ISender sender)
    {
        _sender = sender;
    }

    [HttpPost]
    [Permission(ModuloSistema.Financeiro, AcaoPermissao.Criar)]
    public async Task<ActionResult<ContaPagarDto>> Create(
        [FromBody] CreateContaPagarCommand command,
        CancellationToken cancellationToken)
    {
        var response = await _sender.Send(command, cancellationToken);
        return Ok(response);
    }

    [HttpPatch("{id:guid}/pagar")]
    [Permission(ModuloSistema.Financeiro, AcaoPermissao.Editar)]
    public async Task<ActionResult<ContaPagarDto>> Pagar(
        Guid id,
        CancellationToken cancellationToken)
    {
        var response = await _sender.Send(new PagarContaPagarCommand(id), cancellationToken);
        if (response is null)
        {
            return NotFound();
        }

        return Ok(response);
    }

    [HttpGet("pendentes")]
    [Permission(ModuloSistema.Financeiro, AcaoPermissao.Visualizar)]
    public async Task<ActionResult<IReadOnlyList<ContaPagarDto>>> GetPendentes(
        CancellationToken cancellationToken)
    {
        var response = await _sender.Send(new GetContasPagarPendentesQuery(), cancellationToken);
        return Ok(response);
    }
}
