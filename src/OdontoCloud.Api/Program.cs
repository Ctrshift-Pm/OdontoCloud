using System.Text;
using System.IO;
using System.Security.Claims;
using OdontoCloud.Domain.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.HttpOverrides;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;
using Npgsql;
using OdontoCloud.Application.Behaviors;
using OdontoCloud.Application.Interfaces;
using OdontoCloud.Application.UseCases.Auth.Login;
using OdontoCloud.Application.UseCases.Pacientes.Commands;
using OdontoCloud.Infrastructure.Data;
using OdontoCloud.Infrastructure.Identity;

var builder = WebApplication.CreateBuilder(args);

var jwtKey = JwtSigningKeyResolver.Resolve(builder.Configuration, builder.Environment);
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "OdontoCloud";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "OdontoCloud.Client";
var corsOrigins = ResolveCorsOrigins(builder.Configuration);
const string FrontendCorsPolicy = "FrontendDevPolicy";

builder.Services.AddControllers();
builder.Services.AddProblemDetails();
builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendCorsPolicy, policy =>
    {
        policy.SetIsOriginAllowed(origin => IsAllowedCorsOrigin(origin, corsOrigins))
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ITenantService, TenantService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IPasswordVerifier, LegacyPasswordVerifier>();
builder.Services.AddScoped<IPasswordHasher<OdontoCloud.Domain.Entities.Usuario>, PasswordHasher<OdontoCloud.Domain.Entities.Usuario>>();
builder.Services.AddScoped<IUsuarioAuthenticationRepository, UsuarioAuthenticationRepository>();
builder.Services.AddScoped<IPacienteRepository, PacienteRepository>();
builder.Services.AddScoped<IAgendamentoRepository, AgendamentoRepository>();
builder.Services.AddScoped<IProntuarioRepository, ProntuarioRepository>();
builder.Services.AddScoped<IContaReceberRepository, ContaReceberRepository>();
builder.Services.AddScoped<IContaPagarRepository, ContaPagarRepository>();
builder.Services.AddScoped<IItemPlanoTratamentoRepository, ItemPlanoTratamentoRepository>();
builder.Services.AddScoped<IDentistaRepository, DentistaRepository>();
builder.Services.AddValidatorsFromAssemblyContaining<CreatePacienteCommandValidator>();
builder.Services.AddMediatR(cfg =>
{
    cfg.RegisterServicesFromAssembly(typeof(LoginCommandHandler).Assembly);
    cfg.AddOpenBehavior(typeof(ValidationBehavior<,>));
});
builder.Services.AddDbContext<OdontoCloudDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            NameClaimType = ClaimTypes.Name,
            RoleClaimType = ClaimTypes.Role,
            ClockSkew = TimeSpan.Zero
        };
    });
builder.Services.AddAuthorization(options =>
{
    AddPermissionPolicies(options);

    options.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .RequireAssertion(context =>
        {
            var clinicaClaim = context.User.FindFirst(AuthClaims.ClinicaId)?.Value;
            if (!Guid.TryParse(clinicaClaim, out var clinicaId) || clinicaId == Guid.Empty)
            {
                return false;
            }

            var roleClaim = context.User.FindFirst(ClaimTypes.Role)?.Value;
            if (string.IsNullOrWhiteSpace(roleClaim))
            {
                return false;
            }

            return Enum.TryParse<PerfilUsuario>(roleClaim, out _);
        })
        .Build();
});
builder.Services.AddSingleton<IAuthorizationHandler, PermissionAuthorizationHandler>();

var app = builder.Build();

try
{
    await OdontoCloudDbSeeder.SeedAsync(app.Services);
}
catch (NpgsqlException ex)
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? "(não configurada)";
    throw new InvalidOperationException(
        $"Falha ao conectar no PostgreSQL durante a inicialização. Connection string atual: '{connectionString}'.",
        ex);
}

app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        var exceptionFeature = context.Features.Get<IExceptionHandlerFeature>();

        if (exceptionFeature?.Error is ValidationException validationException)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;

            var groupedErrors = validationException.Errors
                .Where(error => error is not null)
                .GroupBy(error => error.PropertyName)
                .ToDictionary(
                    group => group.Key,
                    group => group.Select(error => error.ErrorMessage).ToArray());

            if (groupedErrors.Count == 0)
            {
                groupedErrors["Validation"] = [validationException.Message];
            }

            await context.Response.WriteAsJsonAsync(new { errors = groupedErrors });
            return;
        }

        if (exceptionFeature?.Error is UnauthorizedAccessException)
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            await context.Response.WriteAsJsonAsync(new { error = "Acesso não autorizado." });
            return;
        }

        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        await context.Response.WriteAsJsonAsync(new { error = "Ocorreu um erro interno." });
    });
});

app.UseForwardedHeaders();
app.UseCors(FrontendCorsPolicy);
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapGet("/healthz", () => Results.Ok(new { status = "ok", service = "OdontoCloud.Api" })).AllowAnonymous();
app.MapControllers();

app.Run();

static string[] ResolveCorsOrigins(IConfiguration configuration)
{
    var configuredOrigins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();
    if (configuredOrigins is { Length: > 0 })
    {
        return configuredOrigins
            .Where(origin => !string.IsNullOrWhiteSpace(origin))
            .Select(origin => origin.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }

    var commaSeparatedOrigins = configuration["Cors:AllowedOrigins"];
    if (!string.IsNullOrWhiteSpace(commaSeparatedOrigins))
    {
        return commaSeparatedOrigins
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }

    return
    [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://localhost:5173",
        "https://127.0.0.1:5173"
    ];
}

static bool IsAllowedCorsOrigin(string? origin, IReadOnlyCollection<string> configuredOrigins)
{
    if (string.IsNullOrWhiteSpace(origin))
    {
        return false;
    }

    if (configuredOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase))
    {
        return true;
    }

    if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri))
    {
        return false;
    }

    return uri.Scheme.Equals(Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase)
        && (uri.Host.Equals("vercel.app", StringComparison.OrdinalIgnoreCase)
            || uri.Host.EndsWith(".vercel.app", StringComparison.OrdinalIgnoreCase));
}

static void AddPermissionPolicies(AuthorizationOptions options)
{
    foreach (var modulo in Enum.GetValues<ModuloSistema>())
    {
        foreach (var acao in Enum.GetValues<AcaoPermissao>())
        {
            options.AddPolicy(
                PermissionPolicy.Names.Build(modulo, acao),
                policy => policy.AddRequirements(new PermissionRequirement(modulo, acao)));
        }
    }
}
