using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OdontoCloud.Application.UseCases.Agendamentos;
using OdontoCloud.Application.UseCases.Agendamentos.Commands;
using OdontoCloud.Application.UseCases.Agendamentos.Queries;

namespace OdontoCloud.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public sealed class AgendamentosController : ControllerBase
{
    private readonly ISender _sender;

    public AgendamentosController(ISender sender)
    {
        _sender = sender;
    }

    [HttpPost]
    public async Task<ActionResult<AgendamentoDto>> Create(
        [FromBody] CreateAgendamentoCommand command,
        CancellationToken cancellationToken)
    {
        var response = await _sender.Send(command, cancellationToken);
        return Ok(response);
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<AgendamentoDto>>> Get(
        [FromQuery] DateTime dataInicio,
        [FromQuery] DateTime? dataFim,
        [FromQuery] Guid? dentistaId,
        CancellationToken cancellationToken)
    {
        var response = await _sender.Send(new GetAgendamentosQuery(dataInicio, dataFim, dentistaId), cancellationToken);
        return Ok(response);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<AgendamentoDto>> Update(
        Guid id,
        [FromBody] UpdateAgendamentoRequest request,
        CancellationToken cancellationToken)
    {
        var command = new UpdateAgendamentoCommand(
            id,
            request.PacienteId,
            request.DentistaId,
            request.DataHora,
            request.DuracaoMinutos,
            request.Status,
            request.Procedimento,
            request.Observacoes);

        var response = await _sender.Send(command, cancellationToken);
        if (response is null)
        {
            return NotFound();
        }

        return Ok(response);
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<ActionResult<AgendamentoDto>> AtualizarStatus(
        Guid id,
        [FromBody] AtualizarStatusAgendamentoRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _sender.Send(new UpdateAgendamentoStatusCommand(id, request.NovoStatus), cancellationToken);
        if (response is null)
        {
            return NotFound();
        }

        return Ok(response);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var deleted = await _sender.Send(new DeleteAgendamentoCommand(id), cancellationToken);
        if (!deleted)
        {
            return NotFound();
        }

        return NoContent();
    }

    public sealed record UpdateAgendamentoRequest(
        Guid PacienteId,
        Guid DentistaId,
        DateTime DataHora,
        int DuracaoMinutos,
        string Status,
        string Procedimento,
        string? Observacoes);

    public sealed record AtualizarStatusAgendamentoRequest(string NovoStatus);
}
