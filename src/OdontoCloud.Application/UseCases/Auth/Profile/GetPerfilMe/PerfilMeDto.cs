using OdontoCloud.Domain.Enums;

namespace OdontoCloud.Application.UseCases.Auth.Profile.GetPerfilMe;

public sealed record PerfilMeDto(
    Guid Id,
    string Nome,
    string Email,
    PerfilUsuario Perfil,
    Guid ClinicaId,
    Guid? DentistaId);
