using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OdontoCloud.Application.UseCases.IaAtendimento;
using OdontoCloud.Application.UseCases.IaAtendimento.Commands;
using OdontoCloud.Application.UseCases.IaAtendimento.Queries;
using OdontoCloud.Domain.Enums;
using OdontoCloud.Infrastructure.Identity;

namespace OdontoCloud.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/ia-atendimento")]
public sealed class IaAtendimentoController : ControllerBase
{
    private readonly ISender _sender;

    public IaAtendimentoController(ISender sender)
    {
        _sender = sender;
    }

    [HttpGet]
    [Permission(ModuloSistema.IA, AcaoPermissao.Visualizar)]
    public async Task<ActionResult<IReadOnlyList<IaLeadDto>>> GetAll(CancellationToken cancellationToken)
    {
        var response = await _sender.Send(new GetAllIaLeadsQuery(), cancellationToken);
        return Ok(response);
    }

    [HttpGet("{id:guid}")]
    [Permission(ModuloSistema.IA, AcaoPermissao.Visualizar)]
    public async Task<ActionResult<IaLeadDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var response = await _sender.Send(new GetIaLeadByIdQuery(id), cancellationToken);
        return response is null ? NotFound() : Ok(response);
    }

    [HttpPost]
    [Permission(ModuloSistema.IA, AcaoPermissao.Criar)]
    public async Task<ActionResult<IaLeadDto>> Create(
        [FromBody] CreateIaLeadCommand command,
        CancellationToken cancellationToken)
    {
        var response = await _sender.Send(command, cancellationToken);
        return Ok(response);
    }

    [HttpPatch("{id:guid}/status")]
    [Permission(ModuloSistema.IA, AcaoPermissao.Editar)]
    public async Task<ActionResult<IaLeadDto>> UpdateStatus(
        Guid id,
        [FromBody] UpdateIaLeadStatusRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _sender.Send(new UpdateIaLeadStatusCommand(id, request.Status), cancellationToken);
        return response is null ? NotFound() : Ok(response);
    }

    [HttpPost("{id:guid}/mensagens")]
    [Permission(ModuloSistema.IA, AcaoPermissao.Editar)]
    public async Task<ActionResult<IaLeadDto>> AddMensagem(
        Guid id,
        [FromBody] AddIaLeadMensagemRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _sender.Send(new AddIaLeadMensagemCommand(id, request.Direcao, request.Conteudo), cancellationToken);
        return response is null ? NotFound() : Ok(response);
    }

    [HttpPatch("{id:guid}/assumir")]
    [Permission(ModuloSistema.IA, AcaoPermissao.Editar)]
    public async Task<ActionResult<IaLeadDto>> Assumir(Guid id, CancellationToken cancellationToken)
    {
        var response = await _sender.Send(new AssumirIaLeadCommand(id), cancellationToken);
        return response is null ? NotFound() : Ok(response);
    }
}

public sealed record UpdateIaLeadStatusRequest(string Status);

public sealed record AddIaLeadMensagemRequest(string Direcao, string Conteudo);
