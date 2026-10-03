using BillEasePro.Domain.Common;
using BillEasePro.Domain.Enums;

namespace BillEasePro.Domain.Entities;

public sealed class UnitOfMeasure : BaseAuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string Symbol { get; set; } = string.Empty;
    public UnitType UnitType { get; set; } = UnitType.Piece;
}

public sealed class UnitConversion : BaseAuditableEntity
{
    public Guid ShopId { get; set; }
    public Shop? Shop { get; set; }
    public Guid BaseUnitId { get; set; }
    public UnitOfMeasure? BaseUnit { get; set; }
    public Guid AlternateUnitId { get; set; }
    public UnitOfMeasure? AlternateUnit { get; set; }
    public decimal Factor { get; set; } = 1;
    public bool IsActive { get; set; } = true;
}

public sealed class TaxSlab : BaseAuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public decimal Rate { get; set; }
    public TaxRegime TaxRegime { get; set; } = TaxRegime.GST;
    public bool IsActive { get; set; } = true;
}

public sealed class DiscountType : BaseAuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public DiscountValueType ValueType { get; set; } = DiscountValueType.Percentage;
    public decimal DefaultValue { get; set; }
    public bool IsActive { get; set; } = true;
}

public sealed class Category : BaseAuditableEntity
{
    public Guid ShopId { get; set; }
    public Shop? Shop { get; set; }
    public Guid? ParentCategoryId { get; set; }
    public Category? ParentCategory { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int DisplayOrder { get; set; }
    public string? ImageUrl { get; set; }
    public string? ColorHex { get; set; }
    public CategoryType CategoryType { get; set; } = CategoryType.General;
}

public sealed class Product : BaseAuditableEntity
{
    public Guid ShopId { get; set; }
    public Shop? Shop { get; set; }
    public Guid CategoryId { get; set; }
    public Category? Category { get; set; }
    public Guid UnitOfMeasureId { get; set; }
    public UnitOfMeasure? UnitOfMeasure { get; set; }
    public Guid TaxSlabId { get; set; }
    public TaxSlab? TaxSlab { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Barcode { get; set; }
    public string? Brand { get; set; }
    public string? SubCategory { get; set; }
    public string? HsnSacCode { get; set; }
    public bool IsStockTracked { get; set; } = true;
    public decimal CostPrice { get; set; }
    public decimal SellingPrice { get; set; }
    public decimal Mrp { get; set; }
    public decimal WholesalePrice { get; set; }
    public decimal MinSellingPrice { get; set; }
    public decimal LowStockThreshold { get; set; }
    public decimal MaxStockThreshold { get; set; }
    public decimal ReorderQuantity { get; set; }
    public decimal MaxDiscountPercent { get; set; } = 15;
    public bool IsTaxInclusive { get; set; }
    public bool IsFeatured { get; set; }
    public bool ExpiryTracking { get; set; }
    public bool RequiresPrescription { get; set; }
    public string? Composition { get; set; }
    public string? Manufacturer { get; set; }
    public bool BatchTracking { get; set; }
    public FoodType FoodType { get; set; } = FoodType.NotApplicable;
    public int? PreparationTimeMinutes { get; set; }
    public decimal RecipeCost { get; set; }
    public string? PortionSize { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsActive { get; set; } = true;

    // Supermarket Physical Store Locator & Multi-Barcodes
    public string? RackLocation { get; set; }
    public string? SecondaryBarcodes { get; set; }

    // Groceries / FMCG / Fresh Produce
    public string? PackageSize { get; set; }
    public decimal? NetWeight { get; set; }
    public string? WeightUnit { get; set; }
    public bool IsWeighingScaleItem { get; set; }
    public string? PluCode { get; set; }
    public string? FssaiLicenseNo { get; set; }
    public int? ShelfLifeDays { get; set; }
    public string? StorageTemperature { get; set; }
    public bool IsOrganic { get; set; }
    public bool IsPerishable { get; set; }
    public string? CountryOfOrigin { get; set; }

    // Electronics & Mobile
    public bool IsSerialTracked { get; set; }
    public int? WarrantyMonths { get; set; }
    public string? WarrantyType { get; set; }
    public string? ModelNumber { get; set; }
    public string? PartNumber { get; set; }
    public string? TechnicalSpecifications { get; set; }
    public int? ReturnWindowDays { get; set; }

    // Pharmacy & Healthcare
    public string? DrugSchedule { get; set; }
    public string? DosageForm { get; set; }
    public string? PackagingDetails { get; set; }
    public bool IsNarcotic { get; set; }
    public string? StorageCondition { get; set; }

    // Fashion & Apparel
    public string? GenderTarget { get; set; }
    public string? MaterialFabric { get; set; }
    public string? FitType { get; set; }
    public string? Season { get; set; }
    public string? StyleCode { get; set; }

    // Dynamic Extension Attributes
    public string? CustomAttributesJson { get; set; }

    public ICollection<ProductVariant> Variants { get; set; } = new List<ProductVariant>();
}

public sealed class ProductVariant : BaseAuditableEntity
{
    public Guid ProductId { get; set; }
    public Product? Product { get; set; }
    public string VariantName { get; set; } = string.Empty;
    public string? AttributeJson { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string? Barcode { get; set; }
    public string? Size { get; set; }
    public string? Color { get; set; }
    public decimal SellingPrice { get; set; }
    public decimal CostPrice { get; set; }
    public decimal Mrp { get; set; }
    public bool IsActive { get; set; } = true;
}
