using OdontoCloud.Domain.Entities;

namespace OdontoCloud.Application.Interfaces;

public interface IIaAtendimentoRepository
{
    Task AddAsync(IaLead lead, CancellationToken cancellationToken = default);

    Task AddMensagemAsync(IaMensagem mensagem, CancellationToken cancellationToken = default);

    Task<List<IaLead>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<IaLead?> GetByIdAsync(Guid leadId, CancellationToken cancellationToken = default);

    Task<IaLead?> GetByIdTrackingAsync(Guid leadId, CancellationToken cancellationToken = default);

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
