using Microsoft.EntityFrameworkCore;
using OdontoCloud.Application.Interfaces;
using OdontoCloud.Domain.Entities;

namespace OdontoCloud.Infrastructure.Data;

public sealed class IaAtendimentoRepository : IIaAtendimentoRepository
{
    private readonly OdontoCloudDbContext _dbContext;

    public IaAtendimentoRepository(OdontoCloudDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task AddAsync(IaLead lead, CancellationToken cancellationToken = default)
    {
        return _dbContext.IaLeads.AddAsync(lead, cancellationToken).AsTask();
    }

    public Task AddMensagemAsync(IaMensagem mensagem, CancellationToken cancellationToken = default)
    {
        return _dbContext.IaMensagens.AddAsync(mensagem, cancellationToken).AsTask();
    }

    public Task<List<IaLead>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return _dbContext.IaLeads
            .AsNoTracking()
            .Include(lead => lead.Mensagens)
            .OrderByDescending(lead => lead.Urgencia)
            .ThenBy(lead => lead.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public Task<IaLead?> GetByIdAsync(Guid leadId, CancellationToken cancellationToken = default)
    {
        return _dbContext.IaLeads
            .AsNoTracking()
            .Include(lead => lead.Mensagens)
            .FirstOrDefaultAsync(lead => lead.Id == leadId, cancellationToken);
    }

    public Task<IaLead?> GetByIdTrackingAsync(Guid leadId, CancellationToken cancellationToken = default)
    {
        return _dbContext.IaLeads
            .Include(lead => lead.Mensagens)
            .FirstOrDefaultAsync(lead => lead.Id == leadId, cancellationToken);
    }

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return _dbContext.SaveChangesAsync(cancellationToken);
    }
}
