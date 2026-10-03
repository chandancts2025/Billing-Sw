using BillEasePro.Domain.Enums;

namespace BillEasePro.Application.Dtos;

public sealed record InventoryLookupDto(
    IReadOnlyList<CategoryDto> Categories,
    IReadOnlyList<UnitOfMeasureDto> Units,
    IReadOnlyList<TaxSlabDto> TaxSlabs,
    IReadOnlyList<SupplierSummaryDto> Suppliers);

public sealed record InventoryProductListItemDto(
    Guid Id,
    string Sku,
    string Name,
    string Category,
    string? Brand,
    string Unit,
    decimal Stock,
    decimal PurchasePrice,
    decimal SellingPrice,
    decimal Mrp,
    decimal WholesalePrice,
    decimal TaxRate,
    bool IsTaxInclusive,
    bool ExpiryTracking,
    bool IsActive,
    bool IsFeatured,
    CategoryType CategoryType = CategoryType.General,
    string? RackLocation = null);

public sealed record InventoryProductDetailDto(
    Guid Id,
    Guid ShopId,
    string Name,
    string Sku,
    string? Barcode,
    Guid CategoryId,
    Guid? ParentCategoryId,
    string? SubCategory,
    string? Brand,
    string? HsnSacCode,
    Guid UnitOfMeasureId,
    Guid TaxSlabId,
    decimal CostPrice,
    decimal SellingPrice,
    decimal Mrp,
    decimal WholesalePrice,
    decimal LowStockThreshold,
    decimal MaxStockThreshold,
    decimal OpeningStock,
    decimal ReorderQuantity,
    bool IsTaxInclusive,
    bool IsStockTracked,
    bool ExpiryTracking,
    bool BatchTracking,
    bool RequiresPrescription,
    string? Composition,
    string? Manufacturer,
    FoodType FoodType,
    int? PreparationTimeMinutes,
    decimal RecipeCost,
    string? PortionSize,
    string? ImageUrl,
    bool IsActive,
    bool IsFeatured,
    IReadOnlyList<InventoryVariantDto> Variants,
    // Universal Supermarket & Locators
    string? RackLocation = null,
    string? SecondaryBarcodes = null,
    decimal? MinSellingPrice = null,
    CategoryType CategoryType = CategoryType.General,
    // Groceries
    string? PackageSize = null,
    decimal? NetWeight = null,
    string? WeightUnit = null,
    bool IsWeighingScaleItem = false,
    string? PluCode = null,
    string? FssaiLicenseNo = null,
    int? ShelfLifeDays = null,
    string? StorageTemperature = null,
    bool IsOrganic = false,
    bool IsPerishable = false,
    string? CountryOfOrigin = null,
    // Electronics
    bool IsSerialTracked = false,
    int? WarrantyMonths = null,
    string? WarrantyType = null,
    string? ModelNumber = null,
    string? PartNumber = null,
    string? TechnicalSpecifications = null,
    int? ReturnWindowDays = null,
    // Pharmacy
    string? DrugSchedule = null,
    string? DosageForm = null,
    string? PackagingDetails = null,
    bool IsNarcotic = false,
    string? StorageCondition = null,
    // Fashion
    string? GenderTarget = null,
    string? MaterialFabric = null,
    string? FitType = null,
    string? Season = null,
    string? StyleCode = null,
    string? CustomAttributesJson = null);

public sealed record InventoryVariantDto(Guid Id, string VariantName, string Sku, string? Size, string? Color, decimal CostPrice, decimal SellingPrice, decimal Mrp, bool IsActive);

public sealed record SaveProductRequest(
    Guid? Id,
    Guid ShopId,
    string Name,
    string? Sku,
    string? Barcode,
    Guid CategoryId,
    string? SubCategory,
    string? Brand,
    string? HsnSacCode,
    Guid UnitOfMeasureId,
    Guid TaxSlabId,
    decimal CostPrice,
    decimal SellingPrice,
    decimal Mrp,
    decimal WholesalePrice,
    decimal LowStockThreshold,
    decimal MaxStockThreshold,
    decimal OpeningStock,
    decimal ReorderQuantity,
    bool IsTaxInclusive,
    bool ExpiryTracking,
    bool BatchTracking,
    bool RequiresPrescription,
    string? Composition,
    string? Manufacturer,
    FoodType FoodType,
    int? PreparationTimeMinutes,
    decimal RecipeCost,
    string? PortionSize,
    string? ImageDataUrl,
    bool IsActive,
    bool IsFeatured,
    IReadOnlyList<SaveProductVariantRequest> Variants,
    // Universal Supermarket & Locators
    string? RackLocation = null,
    string? SecondaryBarcodes = null,
    decimal? MinSellingPrice = null,
    // Groceries
    string? PackageSize = null,
    decimal? NetWeight = null,
    string? WeightUnit = null,
    bool IsWeighingScaleItem = false,
    string? PluCode = null,
    string? FssaiLicenseNo = null,
    int? ShelfLifeDays = null,
    string? StorageTemperature = null,
    bool IsOrganic = false,
    bool IsPerishable = false,
    string? CountryOfOrigin = null,
    // Electronics
    bool IsSerialTracked = false,
    int? WarrantyMonths = null,
    string? WarrantyType = null,
    string? ModelNumber = null,
    string? PartNumber = null,
    string? TechnicalSpecifications = null,
    int? ReturnWindowDays = null,
    // Pharmacy
    string? DrugSchedule = null,
    string? DosageForm = null,
    string? PackagingDetails = null,
    bool IsNarcotic = false,
    string? StorageCondition = null,
    // Fashion
    string? GenderTarget = null,
    string? MaterialFabric = null,
    string? FitType = null,
    string? Season = null,
    string? StyleCode = null,
    string? CustomAttributesJson = null);

public sealed record SaveProductVariantRequest(string? Size, string? Color, decimal? SellingPrice, decimal? Mrp);

public sealed record SaveCategoryRequest(Guid? Id, Guid ShopId, Guid? ParentCategoryId, string Name, string? Description, string? ImageUrl, string? ColorHex, int DisplayOrder, CategoryType CategoryType = CategoryType.General);
public sealed record CategoryTreeNodeDto(Guid Id, string Name, string? Description, string? ImageUrl, string? ColorHex, int DisplayOrder, IReadOnlyList<CategoryTreeNodeDto> Children, CategoryType CategoryType = CategoryType.General);

public sealed record SupplierSummaryDto(Guid Id, string Name, string? Phone, string? Email, decimal OutstandingBalance);
public sealed record SupplierDetailDto(Guid Id, Guid ShopId, string Name, string? ContactPerson, string? Phone, string? Email, string? TaxRegistrationNumber, string? Pan, string? Address, string? BankDetails, int CreditDays, string? PaymentTerms, decimal OpeningBalance, decimal OutstandingBalance);
public sealed record SaveSupplierRequest(Guid? Id, Guid ShopId, string Name, string? ContactPerson, string? Phone, string? Email, string? TaxRegistrationNumber, string? Pan, string? Address, string? BankDetails, int CreditDays, string? PaymentTerms, decimal OpeningBalance);
public sealed record SupplierLedgerRowDto(DateTimeOffset Date, string Type, string Reference, decimal Debit, decimal Credit, decimal BalanceAfter, DateTimeOffset? DueDate, string? Notes);
public sealed record SupplierAnalysisDto(Guid SupplierId, string SupplierName, decimal PurchaseTotal, decimal PaidTotal, decimal Outstanding, int AverageCreditDays);

public sealed record PurchaseOrderDto(Guid Id, Guid ShopId, Guid SupplierId, string SupplierName, string PurchaseOrderNumber, DateTimeOffset OrderDate, DateTimeOffset? ExpectedDate, PurchaseOrderStatus Status, decimal SubTotal, decimal TaxTotal, decimal GrandTotal, string? Notes, IReadOnlyList<PurchaseOrderItemDto> Items);
public sealed record PurchaseOrderItemDto(Guid Id, Guid ProductId, string ProductName, Guid? ProductVariantId, decimal ExpectedQuantity, decimal ReceivedQuantity, decimal UnitCost, decimal TaxRate, decimal LineTotal);
public sealed record CreatePurchaseOrderRequest(Guid ShopId, Guid SupplierId, DateTimeOffset? ExpectedDate, string? Notes, IReadOnlyList<CreatePurchaseOrderItemRequest> Items);
public sealed record CreatePurchaseOrderItemRequest(Guid ProductId, Guid? ProductVariantId, decimal ExpectedQuantity, decimal UnitCost, decimal TaxRate);

public sealed record GrnDto(Guid Id, Guid ShopId, Guid PurchaseInvoiceId, Guid? PurchaseOrderId, string GrnNumber, DateTimeOffset ReceivedAt, bool IsApproved, string? MismatchSummary, IReadOnlyList<GrnItemDto> Items);
public sealed record GrnItemDto(Guid Id, Guid ProductId, string ProductName, Guid? ProductVariantId, decimal ExpectedQuantity, decimal QuantityReceived, decimal QuantityRejected, string? BatchNo, DateTimeOffset? ManufacturingDate, DateTimeOffset? ExpiryDate, decimal Rate);
public sealed record CreateGrnRequest(Guid ShopId, Guid? PurchaseOrderId, Guid SupplierId, string SupplierInvoiceNumber, DateTimeOffset? InvoiceDate, IReadOnlyList<CreateGrnItemRequest> Items);
public sealed record CreateGrnItemRequest(Guid ProductId, Guid? ProductVariantId, decimal ExpectedQuantity, decimal QuantityReceived, decimal QuantityRejected, decimal Rate, decimal TaxRate, string? BatchNo, DateTimeOffset? ManufacturingDate, DateTimeOffset? ExpiryDate);

public sealed record PurchaseReturnRequest(Guid ShopId, Guid PurchaseInvoiceId, string Reason, IReadOnlyList<PurchaseReturnLineRequest> Items);
public sealed record PurchaseReturnLineRequest(Guid ProductId, Guid? ProductVariantId, decimal Quantity, decimal UnitCost);

public sealed record InventoryBatchDto(Guid Id, Guid ProductId, string ProductName, Guid? ProductVariantId, string BatchNo, DateTimeOffset? ManufacturingDate, DateTimeOffset? ExpiryDate, decimal QuantityReceived, decimal QuantityAvailable, decimal Rate, InventoryBatchStatus Status, bool IsQuarantined);
public sealed record InventoryDashboardDto(int TotalSkus, decimal StockValueAtPurchase, decimal StockValueAtSelling, int LowStockCount, int ExpiringSoonCount, int DeadStockCount, IReadOnlyList<InventoryProductListItemDto> LowStockItems, IReadOnlyList<InventoryBatchDto> ExpiringSoonItems, IReadOnlyList<StockVelocityDto> FastMoving, IReadOnlyList<StockVelocityDto> SlowMoving);
public sealed record StockVelocityDto(Guid ProductId, string ProductName, decimal MovementQty, string Class);
public sealed record StockLedgerRowDto(DateTimeOffset Date, string MovementType, string Direction, decimal InQuantity, decimal OutQuantity, decimal RunningBalance, string ReferenceType, string? Notes);

public sealed record CreateInventoryAdjustmentRequest(Guid ShopId, StockAdjustmentType AdjustmentType, string Reason, string? ReferenceNumber, string? Notes, IReadOnlyList<CreateInventoryAdjustmentLineRequest> Items);
public sealed record CreateInventoryAdjustmentLineRequest(Guid ProductId, Guid? ProductVariantId, decimal NewQuantity, string? Reason);
public sealed record InventoryAdjustmentDto(Guid Id, Guid ShopId, string AdjustmentNumber, DateTimeOffset AdjustmentDate, StockAdjustmentType AdjustmentType, AdjustmentStatus Status, string Reason, string? ReferenceNumber, bool IsApproved, decimal NetQuantityChange);
public sealed record AdjustmentVoucherDto(string AdjustmentNumber, string Html);

public sealed record UnitConversionDto(Guid Id, Guid ShopId, Guid BaseUnitId, string BaseUnit, Guid AlternateUnitId, string AlternateUnit, decimal Factor, bool IsActive);
public sealed record SaveUnitConversionRequest(Guid? Id, Guid ShopId, Guid BaseUnitId, Guid AlternateUnitId, decimal Factor, bool IsActive);

public sealed record InventoryAlertDto(Guid Id, NotificationSeverity Severity, string Title, string Message, bool IsRead, DateTimeOffset CreatedAt);
