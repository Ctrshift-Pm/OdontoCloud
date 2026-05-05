using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OdontoCloud.Application.UseCases.Dentistas;
using OdontoCloud.Application.UseCases.Dentistas.Queries;

namespace OdontoCloud.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public sealed class DentistasController : ControllerBase
{
    private readonly ISender _sender;

    public DentistasController(ISender sender)
    {
        _sender = sender;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<DentistaDto>>> GetAll(CancellationToken cancellationToken)
    {
        var response = await _sender.Send(new GetDentistasQuery(), cancellationToken);
        return Ok(response);
    }
}
