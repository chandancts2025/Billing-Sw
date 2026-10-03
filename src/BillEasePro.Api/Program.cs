using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Asp.Versioning;
using BillEasePro.Api.Middleware;
using BillEasePro.Api.Services;
using BillEasePro.Application;
using BillEasePro.Application.Abstractions;
using BillEasePro.Infrastructure;
using BillEasePro.Infrastructure.Persistence;
using BillEasePro.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((context, services, configuration) => configuration
    .ReadFrom.Configuration(context.Configuration)
    .ReadFrom.Services(services)
    .Enrich.FromLogContext()
    .WriteTo.Console());

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
});
builder.Services.AddCors(options =>
{
    options.AddPolicy("Angular", policy => policy
        .SetIsOriginAllowed(origin =>
        {
            if (string.IsNullOrWhiteSpace(origin)) return false;
            var allowed = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? ["http://localhost:4200"];
            if (allowed.Contains(origin) || allowed.Contains("*")) return true;
            try
            {
                var uri = new Uri(origin);
                return uri.Host.EndsWith("vercel.app") || uri.Host.EndsWith("netlify.app") || uri.Host == "localhost";
            }
            catch
            {
                return false;
            }
        })
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials());
});
builder.Services.AddRateLimiter(options =>
{
    options.AddPolicy("auth", context => RateLimitPartition.GetFixedWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 10,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0
        }));
});
builder.Services.AddApiVersioning(options =>
{
    options.DefaultApiVersion = new ApiVersion(1, 0);
    options.AssumeDefaultVersionWhenUnspecified = true;
    options.ReportApiVersions = true;
}).AddApiExplorer(options =>
{
    options.GroupNameFormat = "'v'VVV";
    options.SubstituteApiVersionInUrl = true;
});
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30),
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = JwtRsaKeyProvider.GetValidationKey(builder.Configuration)
        };
    });
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("SuperAdmin", "Admin"));
    options.AddPolicy("SuperAdminOnly", policy => policy.RequireRole("SuperAdmin"));
    options.AddPolicy("OperatorOrAbove", policy => policy.RequireRole("SuperAdmin", "Admin", "Operator"));
    options.AddPolicy("Reports", policy => policy.RequireRole("SuperAdmin", "Admin", "Operator"));
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "BillEase Pro API", Version = "v1" });
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Bearer token. Example: Bearer eyJhbGci...",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        [new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } }] = []
    });
});

var app = builder.Build();

app.UseSerilogRequestLogging();
app.UseMiddleware<GlobalExceptionMiddleware>();
if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
    app.UseHttpsRedirection();
}

app.Use(async (context, next) =>
{
    string csp;
    if (context.Request.Path.StartsWithSegments("/swagger"))
    {
        // Swagger UI requires inline scripts, inline styles, and data: URIs for icons
        csp = "default-src 'self'; " +
              "script-src 'self' 'unsafe-inline'; " +
              "style-src 'self' 'unsafe-inline'; " +
              "img-src 'self' data:; " +
              "connect-src 'self' https: http:; " +
              "frame-ancestors 'none'; object-src 'none'; base-uri 'self';";
    }
    else if (app.Environment.IsDevelopment())
    {
        // Allow inline styles/scripts and dev servers/websockets used during development
        csp = "default-src 'self' http://localhost:4200; " +
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:4200 http://localhost:65483 http://localhost:5244; " +
              "style-src 'self' 'unsafe-inline' http://localhost:4200; " +
              "connect-src 'self' http://localhost:4200 ws://localhost:4200 ws://localhost:49686 ws://localhost:65483 http://localhost:5244; " +
              "img-src 'self' data: blob:; " +
              "frame-ancestors 'none'; object-src 'none'; base-uri 'self';";
    }
    else
    {
        csp = "default-src 'self'; " +
              "script-src 'self' 'unsafe-inline'; " +
              "style-src 'self' 'unsafe-inline'; " +
              "img-src 'self' data: blob:; " +
              "connect-src 'self' https: http:; " +
              "frame-ancestors 'none'; object-src 'none'; base-uri 'self';";
    }

    context.Response.Headers.Remove("Content-Security-Policy");
    context.Response.Headers.TryAdd("Content-Security-Policy", csp);
    context.Response.Headers.TryAdd("X-Frame-Options", "DENY");
    context.Response.Headers.TryAdd("X-Content-Type-Options", "nosniff");
    context.Response.Headers.TryAdd("Referrer-Policy", "strict-origin-when-cross-origin");
    await next();
});
app.UseSwagger();
app.UseSwaggerUI(options => options.SwaggerEndpoint("/swagger/v1/swagger.json", "BillEase Pro API v1"));
app.UseCors("Angular");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
// Apply pending database migrations on startup if configured (ideal for automated cloud deployment)
if (builder.Configuration.GetValue<bool>("Database:AutoMigrate", true))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<BillEaseDbContext>();
    if (db.Database.IsRelational())
    {
        db.Database.SetCommandTimeout(300);
        for (int attempt = 1; attempt <= 3; attempt++)
        {
            try
            {
                Log.Information("Applying database migrations on startup (attempt {Attempt}/3)...", attempt);
                db.Database.Migrate();
                Log.Information("Database migrations applied successfully on startup.");

                // Auto-seed rich showcase data if catalog has few items
                try
                {
                    var shop = db.Shops.FirstOrDefault();
                    if (shop != null && db.Products.Count(p => p.ShopId == shop.Id) < 20)
                    {
                        Log.Information("Catalog has fewer than 20 items. Automatically seeding showcase products and categories...");
                        BillEasePro.Infrastructure.Services.DemoShowcaseSeeder.SeedAsync(db, shop.Id).GetAwaiter().GetResult();
                        Log.Information("Showcase products and categories seeded successfully.");
                    }
                }
                catch (Exception seedEx)
                {
                    Log.Warning(seedEx, "Could not complete automatic demo data seeding on startup.");
                }
                break;
            }
            catch (Exception ex)
            {
                Log.Warning(ex, "Database migration attempt {Attempt} encountered an issue: {Message}", attempt, ex.Message);
                if (attempt == 3)
                {
                    Log.Error(ex, "Failed to apply automatic database migrations on startup after 3 attempts. You can trigger them manually via POST /api/v1/system/migrate");
                }
                else
                {
                    Thread.Sleep(5000);
                }
            }
        }
    }
}

app.MapControllers();
app.Run();
