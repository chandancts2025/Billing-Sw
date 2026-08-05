using System.Linq.Expressions;
using BillEasePro.Application.Abstractions;
using BillEasePro.Domain.Common;
using BillEasePro.Domain.Entities;
using BillEasePro.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace BillEasePro.Infrastructure.Persistence;

public sealed class BillEaseDbContext : DbContext, IUnitOfWork
{
    private readonly ICurrentUserService? _currentUser;

    public BillEaseDbContext(DbContextOptions<BillEaseDbContext> options, ICurrentUserService? currentUser = null)
        : base(options) => _currentUser = currentUser;

    public DbSet<Shop> Shops => Set<Shop>();
    public DbSet<AppUser> AppUsers => Set<AppUser>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<UserActivityLog> UserActivityLogs => Set<UserActivityLog>();
    public DbSet<UserOtp> UserOtps => Set<UserOtp>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<UnitOfMeasure> UnitOfMeasures => Set<UnitOfMeasure>();
    public DbSet<TaxSlab> TaxSlabs => Set<TaxSlab>();
    public DbSet<DiscountType> DiscountTypes => Set<DiscountType>();
    public DbSet<UnitConversion> UnitConversions => Set<UnitConversion>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductVariant> ProductVariants => Set<ProductVariant>();
    public DbSet<ShopSetting> ShopSettings => Set<ShopSetting>();
    public DbSet<InventoryBatch> InventoryBatches => Set<InventoryBatch>();
    public DbSet<InventoryStock> InventoryStocks => Set<InventoryStock>();
    public DbSet<InventoryMovement> InventoryMovements => Set<InventoryMovement>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Supplier> Suppliers => Set<Supplier>();
    public DbSet<SupplierLedgerEntry> SupplierLedgerEntries => Set<SupplierLedgerEntry>();
    public DbSet<Coupon> Coupons => Set<Coupon>();
    public DbSet<SalesInvoice> SalesInvoices => Set<SalesInvoice>();
    public DbSet<SalesInvoiceItem> SalesInvoiceItems => Set<SalesInvoiceItem>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<PurchaseOrder> PurchaseOrders => Set<PurchaseOrder>();
    public DbSet<PurchaseOrderItem> PurchaseOrderItems => Set<PurchaseOrderItem>();
    public DbSet<PurchaseInvoice> PurchaseInvoices => Set<PurchaseInvoice>();
    public DbSet<PurchaseInvoiceItem> PurchaseInvoiceItems => Set<PurchaseInvoiceItem>();
    public DbSet<GoodsReceiptNote> GoodsReceiptNotes => Set<GoodsReceiptNote>();
    public DbSet<GoodsReceiptNoteItem> GoodsReceiptNoteItems => Set<GoodsReceiptNoteItem>();
    public DbSet<SalesReturn> SalesReturns => Set<SalesReturn>();
    public DbSet<SalesReturnItem> SalesReturnItems => Set<SalesReturnItem>();
    public DbSet<PurchaseReturn> PurchaseReturns => Set<PurchaseReturn>();
    public DbSet<PurchaseReturnItem> PurchaseReturnItems => Set<PurchaseReturnItem>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<ExpenseCategory> ExpenseCategories => Set<ExpenseCategory>();
    public DbSet<Expense> Expenses => Set<Expense>();
    public DbSet<StockAdjustment> StockAdjustments => Set<StockAdjustment>();
    public DbSet<StockAdjustmentItem> StockAdjustmentItems => Set<StockAdjustmentItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(BillEaseDbContext).Assembly);
        foreach (var entityType in modelBuilder.Model.GetEntityTypes().Where(t => typeof(BaseAuditableEntity).IsAssignableFrom(t.ClrType)))
        {
            var parameter = Expression.Parameter(entityType.ClrType, "e");
            var property = Expression.Property(parameter, nameof(BaseAuditableEntity.IsDeleted));
            var filter = Expression.Lambda(Expression.Equal(property, Expression.Constant(false)), parameter);
            entityType.SetQueryFilter(filter);
        }

        ConfigureModel(modelBuilder);
        SeedData(modelBuilder);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTimeOffset.UtcNow;
        var user = string.IsNullOrWhiteSpace(_currentUser?.Email) ? "system" : _currentUser!.Email;
        foreach (var entry in ChangeTracker.Entries<BaseAuditableEntity>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = now;
                entry.Entity.CreatedBy = user;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = now;
                entry.Entity.UpdatedBy = user;
            }
            else if (entry.State == EntityState.Deleted)
            {
                entry.State = EntityState.Modified;
                entry.Entity.IsDeleted = true;
                entry.Entity.DeletedAt = now;
                entry.Entity.DeletedBy = user;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }

    private static void ConfigureModel(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Shop>(b =>
        {
            b.HasIndex(x => x.Email);
            b.Property(x => x.Name).HasMaxLength(160).IsRequired();
            b.Property(x => x.CurrencyCode).HasMaxLength(3).IsRequired();
        });
        modelBuilder.Entity<ShopSetting>(b =>
        {
            b.HasIndex(x => new { x.ShopId, x.Key }).IsUnique();
            b.Property(x => x.Key).HasMaxLength(200).IsRequired();
            b.Property(x => x.Value).IsRequired();
        });
        modelBuilder.Entity<AppUser>(b =>
        {
            b.HasIndex(x => x.Email).IsUnique();
            b.HasIndex(x => new { x.ShopId, x.Role });
            b.Property(x => x.Email).HasMaxLength(180).IsRequired();
            b.Property(x => x.FullName).HasMaxLength(160).IsRequired();
        });
        modelBuilder.Entity<RefreshToken>().HasIndex(x => x.TokenHash).IsUnique();
        modelBuilder.Entity<UserOtp>().HasIndex(x => new { x.AppUserId, x.Purpose, x.ExpiresAt });
        modelBuilder.Entity<Category>().HasIndex(x => new { x.ShopId, x.Name }).IsUnique();
        modelBuilder.Entity<Product>(b =>
        {
            b.HasIndex(x => new { x.ShopId, x.Sku }).IsUnique();
            b.HasIndex(x => x.Barcode);
            b.Property(x => x.Name).HasMaxLength(220).IsRequired();
            b.Property(x => x.Sku).HasMaxLength(80).IsRequired();
            b.Property(x => x.CostPrice).HasPrecision(18, 2);
            b.Property(x => x.SellingPrice).HasPrecision(18, 2);
            b.Property(x => x.Mrp).HasPrecision(18, 2);
        });
        modelBuilder.Entity<ProductVariant>().HasIndex(x => x.Sku).IsUnique();
        modelBuilder.Entity<UnitConversion>().HasIndex(x => new { x.ShopId, x.BaseUnitId, x.AlternateUnitId }).IsUnique();
        modelBuilder.Entity<InventoryBatch>().HasIndex(x => new { x.ShopId, x.ProductId, x.ProductVariantId, x.BatchNo }).IsUnique();
        modelBuilder.Entity<InventoryStock>().HasIndex(x => new { x.ShopId, x.ProductId, x.ProductVariantId }).IsUnique();
        modelBuilder.Entity<Customer>().HasIndex(x => new { x.ShopId, x.Phone });
        modelBuilder.Entity<Supplier>().HasIndex(x => new { x.ShopId, x.Name });
        modelBuilder.Entity<SupplierLedgerEntry>().HasIndex(x => new { x.ShopId, x.SupplierId, x.EntryDate });
        modelBuilder.Entity<Coupon>().HasIndex(x => new { x.ShopId, x.Code }).IsUnique();
        modelBuilder.Entity<SalesInvoice>().HasIndex(x => new { x.ShopId, x.InvoiceNumber }).IsUnique();
        modelBuilder.Entity<PurchaseOrder>().HasIndex(x => new { x.ShopId, x.PurchaseOrderNumber }).IsUnique();
        modelBuilder.Entity<PurchaseInvoice>().HasIndex(x => new { x.ShopId, x.SupplierInvoiceNumber });
        modelBuilder.Entity<GoodsReceiptNote>().HasIndex(x => new { x.ShopId, x.GrnNumber }).IsUnique();
        modelBuilder.Entity<SalesReturn>().HasIndex(x => new { x.ShopId, x.CreditNoteNumber }).IsUnique();
        modelBuilder.Entity<PurchaseReturn>().HasIndex(x => new { x.ShopId, x.DebitNoteNumber }).IsUnique();
        modelBuilder.Entity<Expense>().HasIndex(x => new { x.ShopId, x.ExpenseDate });
        modelBuilder.Entity<StockAdjustment>().HasIndex(x => new { x.ShopId, x.AdjustmentNumber }).IsUnique();

        foreach (var entity in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entity.GetProperties().Where(p => p.ClrType == typeof(decimal) || p.ClrType == typeof(decimal?)))
            {
                property.SetPrecision(18);
                property.SetScale(2);
            }
        }
        // Prevent multiple cascade delete paths on SQL Server by setting a restrictive
        // delete behavior for all foreign keys by default. Configure specific
        // relationships to cascade explicitly where necessary.
        foreach (var fk in modelBuilder.Model.GetEntityTypes().SelectMany(t => t.GetForeignKeys()))
        {
            fk.DeleteBehavior = DeleteBehavior.Restrict;
        }
    }

    private static void SeedData(ModelBuilder modelBuilder)
    {
        var shopId = Guid.Parse("10000000-0000-0000-0000-000000000001");
        var pieceId = Guid.Parse("20000000-0000-0000-0000-000000000001");
        var kgId = Guid.Parse("20000000-0000-0000-0000-000000000002");
        var packId = Guid.Parse("20000000-0000-0000-0000-000000000003");
        var gst0 = Guid.Parse("30000000-0000-0000-0000-000000000000");
        var gst5 = Guid.Parse("30000000-0000-0000-0000-000000000005");
        var gst12 = Guid.Parse("30000000-0000-0000-0000-000000000012");
        var gst18 = Guid.Parse("30000000-0000-0000-0000-000000000018");
        var gst28 = Guid.Parse("30000000-0000-0000-0000-000000000028");
        var pharmacy = Guid.Parse("40000000-0000-0000-0000-000000000001");
        var grocery = Guid.Parse("40000000-0000-0000-0000-000000000002");
        var fashion = Guid.Parse("40000000-0000-0000-0000-000000000003");

        modelBuilder.Entity<Shop>().HasData(new Shop
        {
            Id = shopId,
            Name = "BillEase Demo Store",
            LegalName = "BillEase Demo Store Pvt Ltd",
            TaxRegistrationNumber = "29ABCDE1234F1Z5",
            AddressLine1 = "Main Market Road",
            City = "Bengaluru",
            State = "Karnataka",
            PostalCode = "560001",
            Phone = "+91-9000000000",
            Email = "demo@billeasepro.local"
        });
        modelBuilder.Entity<AppUser>().HasData(
            SeedUser("50000000-0000-0000-0000-000000000001", shopId, "Super Admin", "superadmin@billeasepro.local", UserRole.SuperAdmin),
            SeedUser("50000000-0000-0000-0000-000000000002", shopId, "Admin User", "admin@billeasepro.local", UserRole.Admin),
            SeedUser("50000000-0000-0000-0000-000000000003", shopId, "Operator User", "operator@billeasepro.local", UserRole.Operator));
        modelBuilder.Entity<UnitOfMeasure>().HasData(
            new UnitOfMeasure { Id = pieceId, Name = "Piece", Symbol = "pc", UnitType = UnitType.Piece },
            new UnitOfMeasure { Id = kgId, Name = "Kilogram", Symbol = "kg", UnitType = UnitType.Kg },
            new UnitOfMeasure { Id = packId, Name = "Pack", Symbol = "pack", UnitType = UnitType.Pack });
        modelBuilder.Entity<TaxSlab>().HasData(
            new TaxSlab { Id = gst0, Name = "GST 0%", Rate = 0 },
            new TaxSlab { Id = gst5, Name = "GST 5%", Rate = 5 },
            new TaxSlab { Id = gst12, Name = "GST 12%", Rate = 12 },
            new TaxSlab { Id = gst18, Name = "GST 18%", Rate = 18 },
            new TaxSlab { Id = gst28, Name = "GST 28%", Rate = 28 });
        modelBuilder.Entity<DiscountType>().HasData(
            new DiscountType { Id = Guid.Parse("60000000-0000-0000-0000-000000000001"), Name = "Percentage", ValueType = DiscountValueType.Percentage, DefaultValue = 5 },
            new DiscountType { Id = Guid.Parse("60000000-0000-0000-0000-000000000002"), Name = "Flat Amount", ValueType = DiscountValueType.FlatAmount, DefaultValue = 50 });
        modelBuilder.Entity<Category>().HasData(
            new Category { Id = pharmacy, ShopId = shopId, Name = "Pharmacy", Description = "Medicines and wellness" },
            new Category { Id = grocery, ShopId = shopId, Name = "Grocery", Description = "Daily essentials" },
            new Category { Id = fashion, ShopId = shopId, Name = "Fashion", Description = "Clothing and accessories" });
        modelBuilder.Entity<Product>().HasData(
            Product("70000000-0000-0000-0000-000000000001", shopId, pharmacy, packId, gst12, "MED-PAR-500", "Paracetamol 500mg", 8, 12, 20, 25),
            Product("70000000-0000-0000-0000-000000000002", shopId, pharmacy, packId, gst12, "MED-VIT-C", "Vitamin C Tablets", 75, 110, 140, 12),
            Product("70000000-0000-0000-0000-000000000003", shopId, pharmacy, pieceId, gst18, "MED-THERM", "Digital Thermometer", 120, 199, 249, 8),
            Product("70000000-0000-0000-0000-000000000004", shopId, grocery, kgId, gst5, "GRO-RICE", "Premium Rice", 48, 62, 70, 50),
            Product("70000000-0000-0000-0000-000000000005", shopId, grocery, kgId, gst5, "GRO-SUGAR", "Sugar", 38, 45, 50, 50),
            Product("70000000-0000-0000-0000-000000000006", shopId, grocery, pieceId, gst18, "GRO-OIL", "Sunflower Oil 1L", 105, 135, 155, 20),
            Product("70000000-0000-0000-0000-000000000007", shopId, fashion, pieceId, gst5, "FAS-TSHIRT", "Cotton T-Shirt", 180, 349, 499, 10),
            Product("70000000-0000-0000-0000-000000000008", shopId, fashion, pieceId, gst12, "FAS-JEANS", "Denim Jeans", 650, 1199, 1599, 6),
            Product("70000000-0000-0000-0000-000000000009", shopId, grocery, pieceId, gst18, "GRO-SOAP", "Bath Soap", 18, 32, 40, 40),
            Product("70000000-0000-0000-0000-000000000010", shopId, pharmacy, pieceId, gst0, "MED-MASK", "Face Mask", 2, 5, 10, 100));
    }

    private static AppUser SeedUser(string id, Guid shopId, string name, string email, UserRole role)
        => new()
        {
            Id = Guid.Parse(id),
            ShopId = shopId,
            FullName = name,
            Email = email,
            Role = role,
            PasswordHash = Security.PasswordHashing.Hash("Password@123", "billease-demo-salt"),
            IsActive = true
        };

    private static Product Product(string id, Guid shopId, Guid categoryId, Guid unitId, Guid taxId, string sku, string name, decimal cost, decimal sell, decimal mrp, decimal lowStock)
        => new() { Id = Guid.Parse(id), ShopId = shopId, CategoryId = categoryId, UnitOfMeasureId = unitId, TaxSlabId = taxId, Sku = sku, Name = name, CostPrice = cost, SellingPrice = sell, Mrp = mrp, LowStockThreshold = lowStock };
}
