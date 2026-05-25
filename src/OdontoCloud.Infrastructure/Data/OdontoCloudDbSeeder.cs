using System.Security.Claims;
using Microsoft.AspNetCore.Http;
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

        await dbContext.Database.MigrateAsync(cancellationToken);

        var clinica = await dbContext.Clinicas.FirstOrDefaultAsync(cancellationToken);

        if (clinica is null)
        {
            clinica = new Clinica("Clínica Sorrir", "Pro");
            dbContext.Clinicas.Add(clinica);
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        httpContextAccessor.HttpContext = CreateSeederHttpContext(clinica.Id);
        var adminExists = await dbContext.Usuarios.AnyAsync(
            usuario => usuario.Email == "admin@clinicasorrir.com.br",
            cancellationToken);

        if (!adminExists)
        {
            var admin = new Usuario(
                clinica.Id,
                "Administrador",
                "admin@clinicasorrir.com.br",
                "123",
                PerfilUsuario.Admin);

            dbContext.Usuarios.Add(admin);
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
