namespace OdontoCloud.Application.Interfaces;

public interface ITenantService
{
    Guid GetCurrentClinicaId();

    Guid GetCurrentUsuarioId();
}
