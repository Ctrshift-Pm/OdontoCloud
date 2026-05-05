namespace OdontoCloud.Domain.Common;

public abstract class TenantEntityBase : EntityBase
{
    protected TenantEntityBase()
    {
    }

    protected TenantEntityBase(Guid clinicaId)
    {
        ClinicaId = Guard.AgainstDefault(clinicaId, nameof(clinicaId));
    }

    public Guid ClinicaId { get; set; }
}
