using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OdontoCloud.Application.UseCases.Dashboard;
using OdontoCloud.Domain.Enums;
using OdontoCloud.Infrastructure.Identity;

namespace OdontoCloud.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/dashboard")]
public sealed class DashboardController : ControllerBase
{
    private readonly ISender _sender;

    public DashboardController(ISender sender)
    {
        _sender = sender;
    }

    [HttpGet("resumo")]
    [Permission(ModuloSistema.Configuracoes, AcaoPermissao.Visualizar)]
    public async Task<ActionResult<DashboardResumoDto>> GetResumo(CancellationToken cancellationToken)
    {
        var response = await _sender.Send(new GetDashboardResumoQuery(), cancellationToken);
        return Ok(response);
    }
}
