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
