using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace BillEasePro.Infrastructure.Persistence;

public sealed class BillEaseDbContextFactory : IDesignTimeDbContextFactory<BillEaseDbContext>
{
    public BillEaseDbContext CreateDbContext(string[] args)
    {
        var apiPath = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "BillEasePro.Api"));
        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.Exists(apiPath) ? apiPath : Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: true)
            .AddEnvironmentVariables()
            .Build();
        var options = new DbContextOptionsBuilder<BillEaseDbContext>()
            .UseSqlServer(configuration.GetConnectionString("DefaultConnection") ?? "Server=(localdb)\\MSSQLLocalDB;Database=BillEaseProDb;Trusted_Connection=True;TrustServerCertificate=True")
            .Options;
        return new BillEaseDbContext(options);
    }
}
