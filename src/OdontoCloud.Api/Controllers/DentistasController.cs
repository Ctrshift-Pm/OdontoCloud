using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OdontoCloud.Application.UseCases.Dentistas;
using OdontoCloud.Application.UseCases.Dentistas.Commands;
using OdontoCloud.Application.UseCases.Dentistas.Queries;
using OdontoCloud.Domain.Enums;
using OdontoCloud.Infrastructure.Identity;

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
    [Permission(ModuloSistema.Configuracoes, AcaoPermissao.Visualizar)]
    public async Task<ActionResult<IReadOnlyList<DentistaDto>>> GetAll(CancellationToken cancellationToken)
    {
        var response = await _sender.Send(new GetDentistasQuery(), cancellationToken);
        return Ok(response);
    }

    [HttpPatch("{id:guid}/agenda-config")]
    [Permission(ModuloSistema.Configuracoes, AcaoPermissao.Editar)]
    public async Task<ActionResult<DentistaDto>> UpdateAgendaConfig(
        Guid id,
        [FromBody] AtualizarAgendaConfigRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _sender.Send(
            new UpdateDentistaAgendaConfigCommand(
                id,
                request.Inicio,
                request.Fim,
                request.DuracaoPadraoMinutos,
                request.DiasDaSemana),
            cancellationToken);

        return response is null ? NotFound() : Ok(response);
    }
}

public sealed record AtualizarAgendaConfigRequest(
    string Inicio,
    string Fim,
    int DuracaoPadraoMinutos,
    int[] DiasDaSemana);
