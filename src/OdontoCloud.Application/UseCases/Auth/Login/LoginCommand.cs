using MediatR;

namespace OdontoCloud.Application.UseCases.Auth.Login;

public sealed record LoginCommand(string Email, string Senha, Guid? ClinicaId = null) : IRequest<LoginResponse?>;
