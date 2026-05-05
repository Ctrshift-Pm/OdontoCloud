using System.Text.Json;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OdontoCloud.Application.UseCases.Prontuario;
using OdontoCloud.Application.UseCases.Prontuario.GetProntuario;
using OdontoCloud.Application.UseCases.Prontuario.UpdateAnamnese;
using OdontoCloud.Application.UseCases.Prontuario.UpdateOdontograma;
using OdontoCloud.Domain.Enums;
using OdontoCloud.Infrastructure.Identity;

namespace OdontoCloud.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/prontuario")]
public sealed class ProntuarioController : ControllerBase
{
    private readonly ISender _sender;

    public ProntuarioController(ISender sender)
    {
        _sender = sender;
    }

    [HttpGet("{pacienteId:guid}")]
    [Permission(ModuloSistema.Prontuario, AcaoPermissao.Visualizar)]
    public async Task<ActionResult<ProntuarioDto>> Get(Guid pacienteId, CancellationToken cancellationToken)
    {
        var prontuario = await _sender.Send(new GetProntuarioQuery(pacienteId), cancellationToken);
        if (prontuario is null)
        {
            return NotFound();
        }

        return Ok(prontuario);
    }

    [HttpPatch("{id:guid}/odontograma/{dente}")]
    [Permission(ModuloSistema.Prontuario, AcaoPermissao.Editar)]
    public async Task<ActionResult<ProntuarioDto>> UpdateOdontograma(
        Guid id,
        string dente,
        [FromBody] UpdateOdontogramaRequest request,
        CancellationToken cancellationToken)
    {
        var prontuario = await _sender.Send(
            new UpdateDenteOdontogramaCommand(id, dente, request.Status),
            cancellationToken);

        if (prontuario is null)
        {
            return NotFound();
        }

        return Ok(prontuario);
    }

    [HttpPatch("{id:guid}/anamnese")]
    [Permission(ModuloSistema.Prontuario, AcaoPermissao.Editar)]
    public async Task<ActionResult<ProntuarioDto>> UpdateAnamnese(
        Guid id,
        [FromBody] UpdateAnamneseRequest request,
        CancellationToken cancellationToken)
    {
        var prontuario = await _sender.Send(
            new UpdateAnamneseCommand(id, request.Anamnese),
            cancellationToken);

        if (prontuario is null)
        {
            return NotFound();
        }

        return Ok(prontuario);
    }

    public sealed record UpdateOdontogramaRequest(string Status);

    public sealed record UpdateAnamneseRequest(JsonElement Anamnese);
}
