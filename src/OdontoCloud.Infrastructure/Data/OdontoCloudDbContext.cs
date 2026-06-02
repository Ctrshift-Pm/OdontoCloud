using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using OdontoCloud.Application.Interfaces;
using OdontoCloud.Domain.Common;
using OdontoCloud.Domain.Entities;
using OdontoCloud.Domain.Enums;

namespace OdontoCloud.Infrastructure.Data;

public class OdontoCloudDbContext : DbContext
{
    private readonly ITenantService _tenantService;

    public OdontoCloudDbContext(
        DbContextOptions<OdontoCloudDbContext> options,
        ITenantService tenantService) : base(options)
    {
        _tenantService = tenantService;
    }

    private Guid CurrentClinicaId => _tenantService.GetCurrentClinicaId();

    public DbSet<Clinica> Clinicas => Set<Clinica>();

    public DbSet<Usuario> Usuarios => Set<Usuario>();

    public DbSet<Paciente> Pacientes => Set<Paciente>();

    public DbSet<Dentista> Dentistas => Set<Dentista>();

    public DbSet<Agendamento> Agendamentos => Set<Agendamento>();

    public DbSet<Prontuario> Prontuarios => Set<Prontuario>();

    public DbSet<ItemPlanoTratamento> ItensPlanoTratamento => Set<ItemPlanoTratamento>();

    public DbSet<ProntuarioAuditoria> ProntuarioAuditorias => Set<ProntuarioAuditoria>();

    public DbSet<ContaReceber> ContasReceber => Set<ContaReceber>();

    public DbSet<ContaPagar> ContasPagar => Set<ContaPagar>();

    public DbSet<IaLead> IaLeads => Set<IaLead>();

    public DbSet<IaMensagem> IaMensagens => Set<IaMensagem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Clinica>(entity =>
        {
            entity.ToTable("Clinicas");
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Nome).IsRequired().HasMaxLength(200);
            entity.Property(c => c.Cnpj).HasMaxLength(18);
            entity.Property(c => c.Plano).IsRequired().HasMaxLength(100);
            entity.Property(c => c.CreatedAt).IsRequired();
        });

        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.ToTable("Usuarios");
            entity.HasKey(u => u.Id);
            entity.Property(u => u.Nome).IsRequired().HasMaxLength(200);
            entity.Property(u => u.Email).IsRequired().HasMaxLength(255);
            entity.Property(u => u.PasswordHash).IsRequired().HasMaxLength(500);
            entity.Property(u => u.Perfil).HasConversion<string>().IsRequired().HasMaxLength(50);
            entity.Property(u => u.CreatedAt).IsRequired();
            entity.HasIndex(u => new { u.ClinicaId, u.Email }).IsUnique();
            entity.HasQueryFilter(u => u.ClinicaId == CurrentClinicaId);
            entity.Property(u => u.ClinicaId).Metadata.SetAfterSaveBehavior(PropertySaveBehavior.Ignore);

            entity.OwnsMany(u => u.Permissoes, permissions =>
            {
                permissions.ToTable("UsuarioPermissoes");
                permissions.WithOwner().HasForeignKey("UsuarioId");
                permissions.Property<Guid>("Id");
                permissions.HasKey("Id");
                permissions.Property(p => p.Modulo).HasConversion<string>().IsRequired().HasMaxLength(50);
                permissions.Property(p => p.Acao).HasConversion<string>().IsRequired().HasMaxLength(50);
                permissions.Property(p => p.Permitido).IsRequired();
            });
        });

        modelBuilder.Entity<Paciente>(entity =>
        {
            entity.ToTable("Pacientes");
            entity.HasKey(p => p.Id);
            entity.Property(p => p.Nome).IsRequired().HasMaxLength(200);
            entity.Property(p => p.Cpf).IsRequired().HasMaxLength(14);
            entity.Property(p => p.TelefoneWhatsapp).IsRequired().HasMaxLength(20);
            entity.Property(p => p.Email).HasMaxLength(255);
            entity.Property(p => p.Convenio).HasMaxLength(100);
            entity.Property(p => p.Cidade).HasMaxLength(100);
            entity.Property(p => p.Status).HasConversion<string>().IsRequired().HasMaxLength(50);
            entity.Property(p => p.CrmKanbanStatus).HasConversion<string>().IsRequired().HasMaxLength(50);
            entity.Property(p => p.CreatedAt).IsRequired();
            entity.HasIndex(p => new { p.ClinicaId, p.Cpf }).IsUnique();
            entity.HasQueryFilter(p => p.ClinicaId == CurrentClinicaId);
            entity.Property(p => p.ClinicaId).Metadata.SetAfterSaveBehavior(PropertySaveBehavior.Ignore);
        });

        modelBuilder.Entity<Dentista>(entity =>
        {
            entity.ToTable("Dentistas");
            entity.HasKey(d => d.Id);
            entity.Property(d => d.Nome).IsRequired().HasMaxLength(200);
            entity.Property(d => d.Especialidade).HasMaxLength(100);
            entity.Property(d => d.RegraComissaoJson)
                .IsRequired()
                .HasColumnType("jsonb")
                .HasDefaultValue(Dentista.RegraComissaoPadraoJson);
            entity.Property(d => d.AgendaConfigJson)
                .IsRequired()
                .HasColumnType("jsonb")
                .HasDefaultValue(Dentista.AgendaConfigPadraoJson);
            entity.Property(d => d.CreatedAt).IsRequired();
            entity.HasIndex(d => new { d.ClinicaId, d.Nome });
            entity.HasQueryFilter(d => d.ClinicaId == CurrentClinicaId);
            entity.Property(d => d.ClinicaId).Metadata.SetAfterSaveBehavior(PropertySaveBehavior.Ignore);
        });

        modelBuilder.Entity<Agendamento>(entity =>
        {
            entity.ToTable("Agendamentos");
            entity.HasKey(a => a.Id);
            entity.Property(a => a.DataHora).IsRequired();
            entity.Property(a => a.DuracaoMinutos).IsRequired();
            entity.Property(a => a.Status).IsRequired().HasMaxLength(50);
            entity.Property(a => a.Procedimento).IsRequired().HasMaxLength(200);
            entity.Property(a => a.Observacoes).HasMaxLength(1000);
            entity.Property(a => a.CreatedAt).IsRequired();
            entity.HasIndex(a => new { a.ClinicaId, a.DentistaId, a.DataHora });
            entity.HasQueryFilter(a => a.ClinicaId == CurrentClinicaId);
            entity.Property(a => a.ClinicaId).Metadata.SetAfterSaveBehavior(PropertySaveBehavior.Ignore);
            entity.HasOne(a => a.Paciente)
                .WithMany(p => p.Agendamentos)
                .HasForeignKey(a => a.PacienteId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(a => a.Dentista)
                .WithMany(d => d.Agendamentos)
                .HasForeignKey(a => a.DentistaId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Prontuario>(entity =>
        {
            entity.ToTable("Prontuarios");
            entity.HasKey(p => p.Id);
            entity.Property(p => p.AnamneseJson).IsRequired().HasColumnType("jsonb");
            entity.Property(p => p.OdontogramaJson).IsRequired().HasColumnType("jsonb");
            entity.Property(p => p.CreatedAt).IsRequired();
            entity.HasIndex(p => new { p.ClinicaId, p.PacienteId }).IsUnique();
            entity.HasQueryFilter(p => p.ClinicaId == CurrentClinicaId);
            entity.Property(p => p.ClinicaId).Metadata.SetAfterSaveBehavior(PropertySaveBehavior.Ignore);
            entity.HasOne(p => p.Paciente)
                .WithOne(paciente => paciente.Prontuario)
                .HasForeignKey<Prontuario>(p => p.PacienteId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.Navigation(p => p.ItensPlanoTratamento).UsePropertyAccessMode(PropertyAccessMode.Field);
            entity.Navigation(p => p.Auditorias).UsePropertyAccessMode(PropertyAccessMode.Field);
        });

        modelBuilder.Entity<ItemPlanoTratamento>(entity =>
        {
            entity.ToTable("ItensPlanoTratamento");
            entity.HasKey(item => item.Id);
            entity.Property(item => item.DenteFdi).IsRequired().HasMaxLength(2);
            entity.Property(item => item.NumeroDente);
            entity.Property(item => item.StatusOdontograma).IsRequired().HasMaxLength(20);
            entity.Property(item => item.Procedimento).IsRequired().HasMaxLength(200);
            entity.Property(item => item.ValorBase).HasPrecision(10, 2);
            entity.Property(item => item.Status).IsRequired().HasMaxLength(30).HasDefaultValue(StatusItemPlano.Orcado.ToString());
            entity.Property(item => item.CreatedAt).IsRequired();
            entity.HasIndex(item => new { item.ClinicaId, item.PacienteId });
            entity.HasQueryFilter(item => item.ClinicaId == CurrentClinicaId);
            entity.Property(item => item.ClinicaId).Metadata.SetAfterSaveBehavior(PropertySaveBehavior.Ignore);
            entity.HasOne(item => item.Prontuario)
                .WithMany(nameof(Prontuario.ItensPlanoTratamento))
                .HasForeignKey(item => item.ProntuarioId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(item => item.Dentista)
                .WithMany(d => d.ItensPlanoTratamento)
                .HasForeignKey(item => item.DentistaId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<ProntuarioAuditoria>(entity =>
        {
            entity.ToTable("ProntuarioAuditorias");
            entity.HasKey(audit => audit.Id);
            entity.Property(audit => audit.TipoAlteracao).IsRequired().HasMaxLength(100);
            entity.Property(audit => audit.DetalhesJson).IsRequired().HasColumnType("jsonb");
            entity.Property(audit => audit.AlteradoEmUtc).IsRequired();
            entity.Property(audit => audit.CreatedAt).IsRequired();
            entity.HasIndex(audit => new { audit.ClinicaId, audit.ProntuarioId });
            entity.HasQueryFilter(audit => audit.ClinicaId == CurrentClinicaId);
            entity.Property(audit => audit.ClinicaId).Metadata.SetAfterSaveBehavior(PropertySaveBehavior.Ignore);
            entity.HasOne(audit => audit.Prontuario)
                .WithMany(nameof(Prontuario.Auditorias))
                .HasForeignKey(audit => audit.ProntuarioId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ContaReceber>(entity =>
        {
            entity.ToTable("ContasReceber");
            entity.HasKey(conta => conta.Id);
            entity.Property(conta => conta.ValorBase).HasPrecision(10, 2);
            entity.Property(conta => conta.Desconto).HasPrecision(10, 2);
            entity.Property(conta => conta.ValorFinal).HasPrecision(10, 2);
            entity.Property(conta => conta.DataVencimento).IsRequired();
            entity.Property(conta => conta.FormaPagamento).HasMaxLength(50);
            entity.Property(conta => conta.Status).IsRequired().HasMaxLength(50);
            entity.Property(conta => conta.CreatedAt).IsRequired();
            entity.HasIndex(conta => new { conta.ClinicaId, conta.PacienteId, conta.Status });
            entity.HasQueryFilter(conta => conta.ClinicaId == CurrentClinicaId);
            entity.Property(conta => conta.ClinicaId).Metadata.SetAfterSaveBehavior(PropertySaveBehavior.Ignore);
            entity.HasOne(conta => conta.Paciente)
                .WithMany()
                .HasForeignKey(conta => conta.PacienteId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(conta => conta.ItemPlanoTratamento)
                .WithMany()
                .HasForeignKey(conta => conta.ItemPlanoTratamentoId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(conta => conta.Dentista)
                .WithMany(d => d.ContasReceber)
                .HasForeignKey(conta => conta.DentistaId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<ContaPagar>(entity =>
        {
            entity.ToTable("ContasPagar");
            entity.HasKey(conta => conta.Id);
            entity.Property(conta => conta.FornecedorDestinatario).IsRequired().HasMaxLength(200);
            entity.Property(conta => conta.Categoria).IsRequired().HasMaxLength(100);
            entity.Property(conta => conta.Descricao).IsRequired().HasMaxLength(500);
            entity.Property(conta => conta.Valor).HasPrecision(10, 2);
            entity.Property(conta => conta.DataVencimento).IsRequired();
            entity.Property(conta => conta.Status).HasConversion<string>().IsRequired().HasMaxLength(50);
            entity.Property(conta => conta.CreatedAt).IsRequired();
            entity.HasIndex(conta => new { conta.ClinicaId, conta.Status, conta.DataVencimento });
            entity.HasQueryFilter(conta => conta.ClinicaId == CurrentClinicaId);
            entity.Property(conta => conta.ClinicaId).Metadata.SetAfterSaveBehavior(PropertySaveBehavior.Ignore);
            entity.HasOne(conta => conta.Dentista)
                .WithMany(d => d.ContasPagar)
                .HasForeignKey(conta => conta.DentistaId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<IaLead>(entity =>
        {
            entity.ToTable("IaLeads");
            entity.HasKey(lead => lead.Id);
            entity.Property(lead => lead.Nome).IsRequired().HasMaxLength(200);
            entity.Property(lead => lead.TelefoneWhatsapp).IsRequired().HasMaxLength(20);
            entity.Property(lead => lead.MotivoContato).IsRequired().HasMaxLength(300);
            entity.Property(lead => lead.ResumoInteracao).HasMaxLength(1000);
            entity.Property(lead => lead.Urgencia).IsRequired();
            entity.Property(lead => lead.ProcedimentoInteresse).IsRequired().HasMaxLength(200);
            entity.Property(lead => lead.Status).HasConversion<string>().IsRequired().HasMaxLength(50);
            entity.Property(lead => lead.Sentimento).HasMaxLength(150);
            entity.Property(lead => lead.ProximoFollowUpEm);
            entity.Property(lead => lead.AtendimentoAssumido).IsRequired();
            entity.Property(lead => lead.CreatedAt).IsRequired();
            entity.HasIndex(lead => new { lead.ClinicaId, lead.Status, lead.Urgencia });
            entity.HasIndex(lead => new { lead.ClinicaId, lead.TelefoneWhatsapp });
            entity.HasQueryFilter(lead => lead.ClinicaId == CurrentClinicaId);
            entity.Property(lead => lead.ClinicaId).Metadata.SetAfterSaveBehavior(PropertySaveBehavior.Ignore);
            entity.HasMany(lead => lead.Mensagens)
                .WithOne(mensagem => mensagem.Lead)
                .HasForeignKey(mensagem => mensagem.IaLeadId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<IaMensagem>(entity =>
        {
            entity.ToTable("IaMensagens");
            entity.HasKey(mensagem => mensagem.Id);
            entity.Property(mensagem => mensagem.Direcao).HasConversion<string>().IsRequired().HasMaxLength(50);
            entity.Property(mensagem => mensagem.Conteudo).IsRequired().HasMaxLength(4000);
            entity.Property(mensagem => mensagem.EnviadaEmUtc).IsRequired();
            entity.Property(mensagem => mensagem.Canal).IsRequired().HasMaxLength(40);
            entity.Property(mensagem => mensagem.CreatedAt).IsRequired();
            entity.HasIndex(mensagem => new { mensagem.ClinicaId, mensagem.IaLeadId, mensagem.EnviadaEmUtc });
            entity.HasQueryFilter(mensagem => mensagem.ClinicaId == CurrentClinicaId);
            entity.Property(mensagem => mensagem.ClinicaId).Metadata.SetAfterSaveBehavior(PropertySaveBehavior.Ignore);
        });
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = new())
    {
        var tenantEntries = ChangeTracker.Entries<TenantEntityBase>().ToList();
        var clinicaId = tenantEntries.Count == 0 ? Guid.Empty : _tenantService.GetCurrentClinicaId();

        foreach (var entry in tenantEntries)
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.ClinicaId = clinicaId;
                    entry.Entity.CreatedAt = DateTimeOffset.UtcNow;
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedAt = DateTimeOffset.UtcNow;
                    entry.Property(x => x.ClinicaId).IsModified = false;
                    break;
            }
        }

        foreach (var entry in ChangeTracker.Entries<EntityBase>().Where(e => e.Entity is not TenantEntityBase))
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = DateTimeOffset.UtcNow;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = DateTimeOffset.UtcNow;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
