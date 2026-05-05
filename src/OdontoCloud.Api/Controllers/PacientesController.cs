using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OdontoCloud.Application.UseCases.Pacientes;
using OdontoCloud.Application.UseCases.Pacientes.Commands;
using OdontoCloud.Application.UseCases.Pacientes.Queries;

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
    public async Task<ActionResult<PacienteDto>> Create(
        [FromBody] CreatePacienteCommand command,
        CancellationToken cancellationToken)
    {
        var response = await _sender.Send(command, cancellationToken);
        return Ok(response);
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<PacienteDto>>> GetAll(CancellationToken cancellationToken)
    {
        var response = await _sender.Send(new GetAllPacientesQuery(), cancellationToken);
        return Ok(response);
    }
}
