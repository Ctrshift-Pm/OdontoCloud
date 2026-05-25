using MediatR;

namespace OdontoCloud.Application.UseCases.Auth.Profile.GetPerfilMe;

public sealed record GetPerfilMeQuery : IRequest<PerfilMeDto?>;
