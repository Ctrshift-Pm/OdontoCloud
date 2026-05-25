using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OdontoCloud.Application.UseCases.Pacientes;
using OdontoCloud.Application.UseCases.Pacientes.Commands;
using OdontoCloud.Application.UseCases.Pacientes.Queries;
using OdontoCloud.Domain.Enums;
using OdontoCloud.Infrastructure.Identity;

namespace OdontoCloud.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public sealed class PacientesController : ControllerBase
{
    private readonly ISender _sender;

    public PacientesController(ISender sender)
    {
        _sender = sender;
    }

    [HttpPost]
    [Permission(ModuloSistema.Pacientes, AcaoPermissao.Criar)]
    public async Task<ActionResult<PacienteDto>> Create(
        [FromBody] CreatePacienteCommand command,
        CancellationToken cancellationToken)
    {
        var response = await _sender.Send(command, cancellationToken);
        return Ok(response);
    }

    [HttpGet]
    [Permission(ModuloSistema.Pacientes, AcaoPermissao.Visualizar)]
    public async Task<ActionResult<IReadOnlyList<PacienteDto>>> GetAll(CancellationToken cancellationToken)
    {
        var response = await _sender.Send(new GetAllPacientesQuery(), cancellationToken);
        return Ok(response);
    }

    [HttpPatch("{id:guid}/crm-kanban")]
    [Permission(ModuloSistema.Pacientes, AcaoPermissao.Editar)]
    public async Task<ActionResult<PacienteDto>> UpdateCrmKanbanStatus(
        Guid id,
        [FromBody] UpdatePacienteKanbanStatusRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _sender.Send(
            new UpdatePacienteKanbanStatusCommand(id, request.CrmKanbanStatus),
            cancellationToken);

        return response is null ? NotFound() : Ok(response);
    }
}

public sealed record UpdatePacienteKanbanStatusRequest(string CrmKanbanStatus);
