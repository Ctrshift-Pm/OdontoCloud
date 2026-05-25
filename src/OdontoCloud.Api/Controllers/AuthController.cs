using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OdontoCloud.Application.Exceptions;
using OdontoCloud.Application.UseCases.Auth.Login;

namespace OdontoCloud.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController : ControllerBase
{
    private readonly ISender _sender;

    public AuthController(ISender sender)
    {
        _sender = sender;
    }

    [AllowAnonymous]
    [HttpPost("/login")]
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginCommand command, CancellationToken cancellationToken)
    {
        try
        {
            var response = await _sender.Send(command, cancellationToken);

            if (response is null)
            {
                return Unauthorized();
            }

            return Ok(response);
        }
        catch (LoginEmailAmbiguoException ex)
        {
            return Unauthorized(new { error = ex.Message });
        }
    }
}
