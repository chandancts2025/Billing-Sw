using BillEasePro.Domain.Enums;

namespace BillEasePro.Application.Dtos;

public sealed record ShopDto(Guid Id, string Name, string? LegalName, string? TaxRegistrationNumber, IndustryType IndustryType, TaxRegime TaxRegime, string CurrencyCode, string? LogoUrl, string AddressLine1, string? AddressLine2, string City, string State, string PostalCode, string Country, string Phone, string Email);
public sealed record ShopSettingsDto(Guid ShopId, string ShopName, string BrandColor, bool DarkModeEnabled, int IdleTimeoutMinutes, bool PreventMultipleOperatorSessions);
public sealed record UserDto(Guid Id, Guid ShopId, string FullName, string Email, string? Phone, UserRole Role, bool IsActive, bool TwoFactorEnabled);
public sealed record CategoryDto(Guid Id, Guid ShopId, string Name, string? Description, Guid? ParentCategoryId, CategoryType CategoryType = CategoryType.General);
public sealed record UnitOfMeasureDto(Guid Id, string Name, string Symbol, UnitType UnitType);
public sealed record TaxSlabDto(Guid Id, string Name, decimal Rate, TaxRegime TaxRegime, bool IsActive);
public sealed record DiscountTypeDto(Guid Id, string Name, DiscountValueType ValueType, decimal DefaultValue, bool IsActive);
public sealed record UnitConversionCoreDto(Guid Id, Guid ShopId, Guid BaseUnitId, Guid AlternateUnitId, decimal Factor, bool IsActive);
public sealed record ProductDto(
    Guid Id, Guid ShopId, Guid CategoryId, Guid UnitOfMeasureId, Guid TaxSlabId, string Sku, string Name, string? Barcode, string? HsnSacCode, bool IsStockTracked, decimal CostPrice, decimal SellingPrice, decimal Mrp, decimal LowStockThreshold, bool IsActive,
    string? SubCategory = null, string? Brand = null, decimal WholesalePrice = 0, decimal MinSellingPrice = 0, decimal MaxStockThreshold = 0, decimal ReorderQuantity = 0, bool IsTaxInclusive = false, bool IsFeatured = false, bool ExpiryTracking = false, bool BatchTracking = false,
    string? RackLocation = null, string? SecondaryBarcodes = null, string? PackageSize = null, decimal? NetWeight = null, string? WeightUnit = null, bool IsWeighingScaleItem = false, string? PluCode = null, string? FssaiLicenseNo = null, int? ShelfLifeDays = null, string? StorageTemperature = null, bool IsOrganic = false, bool IsPerishable = false, string? CountryOfOrigin = null,
    bool IsSerialTracked = false, int? WarrantyMonths = null, string? WarrantyType = null, string? ModelNumber = null, string? PartNumber = null, string? TechnicalSpecifications = null, int? ReturnWindowDays = null,
    bool RequiresPrescription = false, string? DrugSchedule = null, string? Composition = null, string? DosageForm = null, string? PackagingDetails = null, string? Manufacturer = null, bool IsNarcotic = false, string? StorageCondition = null,
    string? GenderTarget = null, string? MaterialFabric = null, string? FitType = null, string? Season = null, string? StyleCode = null,
    FoodType FoodType = FoodType.NotApplicable, int? PreparationTimeMinutes = null, decimal RecipeCost = 0, string? PortionSize = null, string? ImageUrl = null, string? CustomAttributesJson = null);
public sealed record ProductVariantDto(Guid Id, Guid ProductId, string VariantName, string? AttributeJson, string Sku, decimal SellingPrice);
public sealed record InventoryStockDto(Guid Id, Guid ShopId, Guid ProductId, Guid? ProductVariantId, decimal QuantityOnHand, decimal QuantityReserved, decimal ReorderLevel);
public sealed record InventoryMovementDto(Guid Id, Guid ShopId, Guid ProductId, Guid? ProductVariantId, StockMovementType MovementType, decimal Quantity, decimal UnitCost, string ReferenceType, Guid? ReferenceId, string? Notes);
public sealed record InventoryBatchCoreDto(Guid Id, Guid ShopId, Guid ProductId, Guid? ProductVariantId, string BatchNo, DateTimeOffset? ManufacturingDate, DateTimeOffset? ExpiryDate, decimal QuantityReceived, decimal QuantityAvailable, decimal Rate, InventoryBatchStatus Status, bool IsQuarantined);
public sealed record CustomerDto(Guid Id, Guid ShopId, string Name, string? Phone, string? Email, string? TaxRegistrationNumber, string? BillingAddress, bool IsWalkIn, decimal LoyaltyPoints, decimal CreditLimit, decimal OutstandingBalance);
public sealed record SupplierDto(Guid Id, Guid ShopId, string Name, string? ContactPerson, string? Phone, string? Email, string? TaxRegistrationNumber, string? Address, decimal OutstandingBalance);
public sealed record SupplierLedgerEntryDto(Guid Id, Guid ShopId, Guid SupplierId, SupplierLedgerEntryType EntryType, DateTimeOffset EntryDate, DateTimeOffset? DueDate, decimal Debit, decimal Credit, decimal BalanceAfter, string ReferenceType, Guid? ReferenceId, string? Notes);
public sealed record CouponDto(Guid Id, Guid ShopId, string Code, DiscountValueType ValueType, decimal Value, DateTimeOffset ValidFrom, DateTimeOffset ValidTo, bool IsActive);
public sealed record SalesInvoiceDto(Guid Id, Guid ShopId, Guid? CustomerId, string InvoiceNumber, DateTimeOffset InvoiceDate, SalesInvoiceStatus Status, PaymentStatus PaymentStatus, decimal SubTotal, decimal ItemDiscountTotal, decimal BillDiscountAmount, decimal CouponDiscountAmount, decimal DiscountTotal, decimal TaxableAmount, decimal TaxTotal, decimal RoundOff, decimal GrandTotal, string? CouponCode, string? Notes);
public sealed record SalesInvoiceItemDto(Guid Id, Guid SalesInvoiceId, Guid ProductId, Guid? ProductVariantId, string Description, decimal Quantity, decimal UnitPrice, decimal DiscountAmount, decimal TaxRate, decimal TaxAmount, decimal LineTotal);
public sealed record PaymentDto(Guid Id, Guid ShopId, Guid? SalesInvoiceId, PaymentMethod Method, decimal Amount, string? ReferenceNumber, string? Details, DateTimeOffset PaidAt);
public sealed record PurchaseInvoiceDto(Guid Id, Guid ShopId, Guid SupplierId, string SupplierInvoiceNumber, DateTimeOffset InvoiceDate, decimal SubTotal, decimal TaxTotal, decimal GrandTotal, PaymentStatus PaymentStatus);
public sealed record PurchaseInvoiceItemDto(Guid Id, Guid PurchaseInvoiceId, Guid ProductId, decimal Quantity, decimal UnitCost, decimal TaxRate, decimal LineTotal);
public sealed record PurchaseOrderCoreDto(Guid Id, Guid ShopId, Guid SupplierId, string PurchaseOrderNumber, DateTimeOffset OrderDate, DateTimeOffset? ExpectedDate, PurchaseOrderStatus Status, decimal SubTotal, decimal TaxTotal, decimal GrandTotal, string? Notes);
public sealed record PurchaseOrderItemCoreDto(Guid Id, Guid PurchaseOrderId, Guid ProductId, Guid? ProductVariantId, decimal ExpectedQuantity, decimal ReceivedQuantity, decimal UnitCost, decimal TaxRate, decimal LineTotal);
public sealed record GoodsReceiptNoteDto(Guid Id, Guid ShopId, Guid PurchaseInvoiceId, string GrnNumber, DateTimeOffset ReceivedAt);
public sealed record GoodsReceiptNoteItemDto(Guid Id, Guid GoodsReceiptNoteId, Guid ProductId, decimal QuantityReceived, decimal QuantityRejected);
public sealed record SalesReturnDto(Guid Id, Guid ShopId, Guid SalesInvoiceId, string CreditNoteNumber, ReturnStatus Status, decimal RefundAmount, string? Reason);
public sealed record SalesReturnItemDto(Guid Id, Guid SalesReturnId, Guid ProductId, decimal Quantity, decimal UnitPrice, decimal RefundAmount);
public sealed record PurchaseReturnDto(Guid Id, Guid ShopId, Guid PurchaseInvoiceId, string DebitNoteNumber, ReturnStatus Status, decimal ReturnAmount, string? Reason);
public sealed record PurchaseReturnItemDto(Guid Id, Guid PurchaseReturnId, Guid ProductId, decimal Quantity, decimal UnitCost, decimal ReturnAmount);
public sealed record NotificationDto(Guid Id, Guid ShopId, Guid? AppUserId, NotificationSeverity Severity, string Title, string Message, bool IsRead, DateTimeOffset? ReadAt);
public sealed record ExpenseCategoryDto(Guid Id, Guid ShopId, string Name, string? Description, bool IsActive);
public sealed record ExpenseDto(Guid Id, Guid ShopId, Guid ExpenseCategoryId, string Description, decimal Amount, DateTimeOffset ExpenseDate, string? ReferenceNumber, string? Notes, bool IsApproved, Guid? ApprovedByUserId, DateTimeOffset? ApprovedAt);
public sealed record CreateExpenseRequest(Guid ShopId, Guid ExpenseCategoryId, string Description, decimal Amount, DateTimeOffset? ExpenseDate, string? ReferenceNumber, string? Notes);
public sealed record ApproveExpenseRequest(Guid ExpenseId);
public sealed record StockAdjustmentDto(Guid Id, Guid ShopId, string AdjustmentNumber, DateTimeOffset AdjustmentDate, string Reason, string? Notes, bool IsApproved, Guid? ApprovedByUserId, DateTimeOffset? ApprovedAt);
public sealed record StockAdjustmentItemDto(Guid Id, Guid StockAdjustmentId, Guid ProductId, Guid? ProductVariantId, decimal OldQuantity, decimal NewQuantity, string? Reason);
public sealed record CreateStockAdjustmentRequest(Guid ShopId, string Reason, string? Notes, IReadOnlyList<CreateStockAdjustmentItemRequest> Items);
public sealed record CreateStockAdjustmentItemRequest(Guid ProductId, Guid? ProductVariantId, decimal OldQuantity, decimal NewQuantity, string? Reason);
