using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OdontoCloud.Application.UseCases.Auth.Profile.GetPerfilMe;
using OdontoCloud.Application.UseCases.Auth.Profile.UpdateSenha;
using OdontoCloud.Domain.Enums;
using OdontoCloud.Infrastructure.Identity;

namespace OdontoCloud.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/perfil")]
public sealed class PerfilController : ControllerBase
{
    private readonly ISender _sender;

    public PerfilController(ISender sender)
    {
        _sender = sender;
    }

    [HttpGet("me")]
    [Permission(ModuloSistema.Configuracoes, AcaoPermissao.Visualizar)]
    public async Task<ActionResult<GetPerfilMeResponse>> Me(CancellationToken cancellationToken)
    {
        var response = await _sender.Send(new GetPerfilMeQuery(), cancellationToken);

        return response is null
            ? NotFound(new { error = "Usuario nao encontrado." })
            : Ok(new GetPerfilMeResponse(
                response.Id,
                response.Nome,
                response.Email,
                response.Perfil.ToString(),
                response.ClinicaId,
                response.DentistaId));
    }

    [HttpPatch("senha")]
    [Permission(ModuloSistema.Configuracoes, AcaoPermissao.Editar)]
    public async Task<ActionResult> AlterarSenha(
        [FromBody] AlterarSenhaPerfilRequest request,
        CancellationToken cancellationToken)
    {
        var alterou = await _sender.Send(
            new UpdateSenhaPerfilCommand(request.SenhaAtual, request.NovaSenha, request.ConfirmacaoSenha),
            cancellationToken);

        if (!alterou)
        {
            return BadRequest(new { error = "Senha atual invalida." });
        }

        return Ok(new { message = "Senha alterada com sucesso." });
    }
}

public sealed record AlterarSenhaPerfilRequest(
    string SenhaAtual,
    string NovaSenha,
    string ConfirmacaoSenha);

public sealed record GetPerfilMeResponse(
    Guid Id,
    string Nome,
    string Email,
    string Perfil,
    Guid ClinicaId,
    Guid? DentistaId);
