namespace OdontoCloud.Domain.Common;

public abstract class EntityBase
{
    protected EntityBase()
    {
        Id = Guid.NewGuid();
        CreatedAt = DateTimeOffset.UtcNow;
    }

    public Guid Id { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset? UpdatedAt { get; set; }

    protected void MarkAsUpdated()
    {
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
