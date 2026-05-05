using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OdontoCloud.Application.UseCases.PlanoTratamento.Commands;
using OdontoCloud.Application.UseCases.Prontuario;

namespace OdontoCloud.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/plano-tratamento")]
public sealed class PlanoTratamentoController : ControllerBase
{
    private readonly ISender _sender;

    public PlanoTratamentoController(ISender sender)
    {
        _sender = sender;
    }

    [HttpPatch("itens/{id:guid}/aprovar")]
    public async Task<ActionResult<ItemPlanoTratamentoDto>> Aprovar(Guid id, CancellationToken cancellationToken)
    {
        var response = await _sender.Send(new AprovarItemPlanoCommand(id), cancellationToken);
        if (response is null)
        {
            return NotFound();
        }

        return Ok(response);
    }

    [HttpPatch("itens/{id:guid}/concluir")]
    public async Task<ActionResult<ItemPlanoTratamentoDto>> Concluir(Guid id, CancellationToken cancellationToken)
    {
        var response = await _sender.Send(new ConcluirItemPlanoCommand(id), cancellationToken);
        if (response is null)
        {
            return NotFound();
        }

        return Ok(response);
    }
}
