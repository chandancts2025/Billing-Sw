using Asp.Versioning;
using BillEasePro.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BillEasePro.Api.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
public sealed class SystemController : ControllerBase
{
    private readonly BillEaseDbContext _dbContext;
    private readonly ILogger<SystemController> _logger;

    public SystemController(BillEaseDbContext dbContext, ILogger<SystemController> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    /// <summary>
    /// Checks database connectivity and EF Core migration status.
    /// </summary>
    [HttpGet("status")]
    [AllowAnonymous]
    public async Task<IActionResult> GetStatus(CancellationToken cancellationToken)
    {
        try
        {
            var canConnect = await _dbContext.Database.CanConnectAsync(cancellationToken);
            var applied = await _dbContext.Database.GetAppliedMigrationsAsync(cancellationToken);
            var pending = await _dbContext.Database.GetPendingMigrationsAsync(cancellationToken);

            return Ok(new
            {
                Status = "Healthy",
                CanConnect = canConnect,
                Provider = _dbContext.Database.ProviderName,
                AppliedMigrations = applied,
                PendingMigrations = pending,
                HasPendingMigrations = pending.Any(),
                ServerUtcTime = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "System status check encountered an error");
            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                Status = "Degraded",
                CanConnect = false,
                Error = ex.Message,
                ServerUtcTime = DateTime.UtcNow
            });
        }
    }

    /// <summary>
    /// Executes pending EF Core migrations on the connected database.
    /// Useful for initial cloud deployment initialization.
    /// </summary>
    [HttpPost("migrate")]
    [AllowAnonymous]
    public async Task<IActionResult> ApplyMigrations(CancellationToken cancellationToken)
    {
        try
        {
            _dbContext.Database.SetCommandTimeout(300);
            _logger.LogInformation("Applying database migrations on demand...");
            await _dbContext.Database.MigrateAsync(cancellationToken);
            
            var applied = await _dbContext.Database.GetAppliedMigrationsAsync(cancellationToken);
            var pending = await _dbContext.Database.GetPendingMigrationsAsync(cancellationToken);

            _logger.LogInformation("Database migrations applied successfully.");
            return Ok(new
            {
                Success = true,
                Message = "Database migrations applied successfully.",
                AppliedMigrations = applied,
                PendingMigrations = pending
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to apply database migrations on demand");
            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                Success = false,
                Message = "Failed to apply database migrations.",
                Error = ex.Message,
                Details = ex.ToString()
            });
        }
    }

    /// <summary>
    /// Seeds rich demonstration data (Categories, Products with barcodes, Stock, Customers, Suppliers, Bills)
    /// to showcase the POS to clients.
    /// </summary>
    [HttpPost("seed-demo")]
    [AllowAnonymous]
    public async Task<IActionResult> SeedDemoData(CancellationToken cancellationToken)
    {
        try
        {
            var defaultShop = await _dbContext.Shops.FirstOrDefaultAsync(cancellationToken)
                ?? new Domain.Entities.Shop
                {
                    Id = Guid.Parse("10000000-0000-0000-0000-000000000001"),
                    Name = "BillEase Supermarket & Pharmacy",
                    CreatedBy = "system"
                };

            if (_dbContext.Entry(defaultShop).State == EntityState.Detached)
            {
                _dbContext.Shops.Add(defaultShop);
                await _dbContext.SaveChangesAsync(cancellationToken);
            }

            var count = await BillEasePro.Infrastructure.Services.DemoShowcaseSeeder.SeedAsync(_dbContext, defaultShop.Id, _logger, cancellationToken);
            var totalProducts = await _dbContext.Products.CountAsync(p => p.ShopId == defaultShop.Id, cancellationToken);
            var totalCategories = await _dbContext.Categories.CountAsync(c => c.ShopId == defaultShop.Id, cancellationToken);

            return Ok(new
            {
                Success = true,
                Message = $"Showcase demo data populated successfully for shop: {defaultShop.Name}.",
                ProductsAdded = count,
                TotalProducts = totalProducts,
                TotalCategories = totalCategories
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to seed showcase demo data");
            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                Success = false,
                Message = "Failed to seed demo data.",
                Error = ex.Message,
                Details = ex.ToString()
            });
        }
    }
}
