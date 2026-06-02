using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using OdontoCloud.Domain.Entities;
using OdontoCloud.Domain.Enums;

namespace OdontoCloud.Infrastructure.Data;

public static class OdontoCloudDbSeeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider, CancellationToken cancellationToken = default)
    {
        using var scope = serviceProvider.CreateScope();

        var dbContext = scope.ServiceProvider.GetRequiredService<OdontoCloudDbContext>();
        var httpContextAccessor = scope.ServiceProvider.GetRequiredService<IHttpContextAccessor>();
        var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<Usuario>>();

        await dbContext.Database.MigrateAsync(cancellationToken);

        var clinica = await dbContext.Clinicas.FirstOrDefaultAsync(cancellationToken);

        if (clinica is null)
        {
            clinica = new Clinica("Clínica Sorrir", "Pro");
            dbContext.Clinicas.Add(clinica);
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        httpContextAccessor.HttpContext = CreateSeederHttpContext(clinica.Id);
        var admin = await dbContext.Usuarios.FirstOrDefaultAsync(
            usuario => usuario.Email == "admin@clinicasorrir.com.br",
            cancellationToken);

        if (admin is null)
        {
            admin = new Usuario(
                clinica.Id,
                "Administrador",
                "admin@clinicasorrir.com.br",
                passwordHasher.HashPassword(new Usuario(clinica.Id, "Administrador", "admin@clinicasorrir.com.br", "seed", PerfilUsuario.Admin), "123"),
                PerfilUsuario.Admin);

            dbContext.Usuarios.Add(admin);
        }
        else if (!admin.PasswordHash.StartsWith("AQAAAA", StringComparison.Ordinal))
        {
            admin.AtualizarSenhaHash(passwordHasher.HashPassword(admin, "123"));
        }

        var dentistaExists = await dbContext.Dentistas.AnyAsync(
            dentista => dentista.Nome == "Dr. Carlos Mendes",
            cancellationToken);

        if (!dentistaExists)
        {
            var dentista = new Dentista(
                clinica.Id,
                "Dr. Carlos Mendes",
                "Clínico Geral / Endodontia");

            dbContext.Dentistas.Add(dentista);
        }

        var iaLeadExists = await dbContext.IaLeads.AnyAsync(cancellationToken);

        if (!iaLeadExists)
        {
            var lead = new IaLead(
                "Carlos Almeida",
                "+55 11 98888-4422",
                "Dor intensa e trauma em implante",
                5,
                "Implante",
                "Paciente relatou dor intensa após trauma e precisa de encaixe no mesmo dia.",
                "Ansioso / dor intensa",
                DateTimeOffset.UtcNow.AddHours(4));

            lead.AdicionarMensagem(DirecaoMensagemIa.Paciente, "Boa tarde, bati a boca e estou com muita dor no implante.");
            lead.AdicionarMensagem(DirecaoMensagemIa.IA, "Sinto muito pela dor. Vou priorizar seu atendimento e confirmar disponibilidade para hoje.");

            dbContext.IaLeads.Add(lead);

            var rotina = new IaLead(
                "Marina Costa",
                "+55 11 97777-1919",
                "Avaliação de clareamento",
                2,
                "Clareamento",
                "Lead de rotina buscando valores e horários para avaliação estética.",
                "Curiosa / rotina",
                DateTimeOffset.UtcNow.AddDays(1));

            rotina.AdicionarMensagem(DirecaoMensagemIa.Paciente, "Gostaria de saber horários para avaliação de clareamento.");
            rotina.AdicionarMensagem(DirecaoMensagemIa.IA, "Claro. Vou buscar horários disponíveis para avaliação com a equipe.");

            dbContext.IaLeads.Add(rotina);
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        httpContextAccessor.HttpContext = null;
    }

    private static DefaultHttpContext CreateSeederHttpContext(Guid clinicaId)
    {
        return new DefaultHttpContext
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(
                [
                    new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()),
                    new Claim("ClinicaId", clinicaId.ToString())
                ], "Seeder"))
        };
    }
}
