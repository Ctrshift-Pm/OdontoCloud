using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using OdontoCloud.Infrastructure.Data;
using Xunit;

namespace OdontoCloud.Api.IntegrationTests;

public sealed class ApiTestFactory : WebApplicationFactory<OdontoCloud.Api.Controllers.FinanceiroController>, IAsyncLifetime
{
    private const string DefaultConnectionString = "Host=localhost;Port=5432;Database=odontocloud_dev;Username=postgres;Password=odontocloudmppm26";

    public async Task InitializeAsync()
    {
        using var scope = Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<OdontoCloudDbContext>();
        await dbContext.Database.MigrateAsync();
    }

    public new Task DisposeAsync()
    {
        return Task.CompletedTask;
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        builder.ConfigureAppConfiguration((_, configurationBuilder) =>
        {
            configurationBuilder.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = DefaultConnectionString
            });
        });
    }
}
