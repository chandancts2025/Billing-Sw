using System.Globalization;
using System.Text;
using BillEasePro.Application.Abstractions;
using BillEasePro.Application.Dtos;
using BillEasePro.Domain.Entities;
using BillEasePro.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BillEasePro.Application.Features.Inventory;

public sealed record InventoryLookupQuery(Guid ShopId) : IRequest<InventoryLookupDto>;
public sealed record InventoryProductsQuery(Guid ShopId, string? Search) : IRequest<IReadOnlyList<InventoryProductListItemDto>>;
public sealed record InventoryProductDetailQuery(Guid Id) : IRequest<InventoryProductDetailDto>;
public sealed record SaveInventoryProductCommand(SaveProductRequest Request) : IRequest<InventoryProductDetailDto>;
public sealed record CategoryTreeQuery(Guid ShopId) : IRequest<IReadOnlyList<CategoryTreeNodeDto>>;
public sealed record SaveInventoryCategoryCommand(SaveCategoryRequest Request) : IRequest<CategoryDto>;
public sealed record InventoryDashboardQuery(Guid ShopId) : IRequest<InventoryDashboardDto>;
public sealed record InventoryBatchesQuery(Guid ShopId, Guid? ProductId, bool ExpiringOnly) : IRequest<IReadOnlyList<InventoryBatchDto>>;
public sealed record QuarantineExpiredBatchesCommand(Guid ShopId) : IRequest<int>;
public sealed record CreatePurchaseOrderCommand(CreatePurchaseOrderRequest Request) : IRequest<PurchaseOrderDto>;
public sealed record PurchaseOrdersQuery(Guid ShopId) : IRequest<IReadOnlyList<PurchaseOrderDto>>;
public sealed record CreateGrnCommand(CreateGrnRequest Request) : IRequest<GrnDto>;
public sealed record ApproveGrnCommand(Guid GrnId) : IRequest<GrnDto>;
public sealed record SaveSupplierCommand(SaveSupplierRequest Request) : IRequest<SupplierDetailDto>;
public sealed record SuppliersQuery(Guid ShopId) : IRequest<IReadOnlyList<SupplierSummaryDto>>;
public sealed record SupplierLedgerQuery(Guid SupplierId) : IRequest<IReadOnlyList<SupplierLedgerRowDto>>;
public sealed record SupplierAnalysisQuery(Guid ShopId) : IRequest<IReadOnlyList<SupplierAnalysisDto>>;
public sealed record CreatePurchaseReturnCommand(PurchaseReturnRequest Request) : IRequest<PurchaseReturnDto>;
public sealed record CreateInventoryAdjustmentCommand(CreateInventoryAdjustmentRequest Request) : IRequest<InventoryAdjustmentDto>;
public sealed record InventoryAdjustmentsQuery(Guid ShopId) : IRequest<IReadOnlyList<InventoryAdjustmentDto>>;
public sealed record ApproveInventoryAdjustmentCommand(Guid AdjustmentId, Guid? ApprovedByUserId) : IRequest<InventoryAdjustmentDto>;
public sealed record AdjustmentVoucherQuery(Guid AdjustmentId) : IRequest<AdjustmentVoucherDto>;
public sealed record StockLedgerQuery(Guid ShopId, Guid ProductId, Guid? ProductVariantId, DateTimeOffset? From, DateTimeOffset? To, StockMovementType? MovementType) : IRequest<IReadOnlyList<StockLedgerRowDto>>;
public sealed record UnitConversionsQuery(Guid ShopId) : IRequest<IReadOnlyList<UnitConversionDto>>;
public sealed record SaveUnitConversionCommand(SaveUnitConversionRequest Request) : IRequest<UnitConversionDto>;
public sealed record InventoryAlertsQuery(Guid ShopId) : IRequest<IReadOnlyList<InventoryAlertDto>>;

public sealed class InventoryLookupQueryHandler : IRequestHandler<InventoryLookupQuery, InventoryLookupDto>
{
    private readonly IRepository<Category> _categories;
    private readonly IRepository<UnitOfMeasure> _units;
    private readonly IRepository<TaxSlab> _taxSlabs;
    private readonly IRepository<Supplier> _suppliers;

    public InventoryLookupQueryHandler(IRepository<Category> categories, IRepository<UnitOfMeasure> units, IRepository<TaxSlab> taxSlabs, IRepository<Supplier> suppliers)
    {
        _categories = categories;
        _units = units;
        _taxSlabs = taxSlabs;
        _suppliers = suppliers;
    }

    public async Task<InventoryLookupDto> Handle(InventoryLookupQuery request, CancellationToken cancellationToken)
    {
        var categories = await _categories.Query().Where(x => x.ShopId == request.ShopId).OrderBy(x => x.DisplayOrder).ThenBy(x => x.Name)
            .Select(x => new CategoryDto(x.Id, x.ShopId, x.Name, x.Description, x.ParentCategoryId)).ToListAsync(cancellationToken);
        var units = await _units.Query().OrderBy(x => x.Name).Select(x => new UnitOfMeasureDto(x.Id, x.Name, x.Symbol, x.UnitType)).ToListAsync(cancellationToken);
        var slabs = await _taxSlabs.Query().Where(x => x.IsActive).OrderBy(x => x.Rate).Select(x => new TaxSlabDto(x.Id, x.Name, x.Rate, x.TaxRegime, x.IsActive)).ToListAsync(cancellationToken);
        var suppliers = await _suppliers.Query().Where(x => x.ShopId == request.ShopId).OrderBy(x => x.Name).Select(x => new SupplierSummaryDto(x.Id, x.Name, x.Phone, x.Email, x.OutstandingBalance)).ToListAsync(cancellationToken);
        return new InventoryLookupDto(categories, units, slabs, suppliers);
    }
}

public sealed class InventoryProductsQueryHandler : IRequestHandler<InventoryProductsQuery, IReadOnlyList<InventoryProductListItemDto>>
{
    private readonly IRepository<Product> _products;
    private readonly IRepository<InventoryStock> _stocks;

    public InventoryProductsQueryHandler(IRepository<Product> products, IRepository<InventoryStock> stocks)
    {
        _products = products;
        _stocks = stocks;
    }

    public async Task<IReadOnlyList<InventoryProductListItemDto>> Handle(InventoryProductsQuery request, CancellationToken cancellationToken)
    {
        var query = _products.Query().Include(x => x.Category).Include(x => x.UnitOfMeasure).Include(x => x.TaxSlab).Where(x => x.ShopId == request.ShopId);
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim().ToLowerInvariant();
            query = query.Where(x => x.Name.ToLower().Contains(search) || x.Sku.ToLower().Contains(search) || (x.Barcode != null && x.Barcode.Contains(search)));
        }

        var products = await query.OrderBy(x => x.Name).Take(300).ToListAsync(cancellationToken);
        var ids = products.Select(x => x.Id).ToArray();
        var stock = await _stocks.Query().Where(x => x.ShopId == request.ShopId && ids.Contains(x.ProductId))
            .GroupBy(x => x.ProductId).Select(x => new { ProductId = x.Key, Qty = x.Sum(s => s.QuantityOnHand) }).ToListAsync(cancellationToken);

        return products.Select(product =>
        {
            var qty = stock.FirstOrDefault(x => x.ProductId == product.Id)?.Qty ?? 0;
            return new InventoryProductListItemDto(product.Id, product.Sku, product.Name, product.Category?.Name ?? string.Empty, product.Brand, product.UnitOfMeasure?.Symbol ?? "pc", qty, product.CostPrice, product.SellingPrice, product.Mrp, product.WholesalePrice, product.TaxSlab?.Rate ?? 0, product.IsTaxInclusive, product.ExpiryTracking, product.IsActive, product.IsFeatured);
        }).ToList();
    }
}

public sealed class InventoryProductDetailQueryHandler : IRequestHandler<InventoryProductDetailQuery, InventoryProductDetailDto>
{
    private readonly IRepository<Product> _products;
    private readonly IRepository<InventoryStock> _stocks;

    public InventoryProductDetailQueryHandler(IRepository<Product> products, IRepository<InventoryStock> stocks)
    {
        _products = products;
        _stocks = stocks;
    }

    public async Task<InventoryProductDetailDto> Handle(InventoryProductDetailQuery request, CancellationToken cancellationToken)
    {
        var product = await _products.Query().Include(x => x.Category).Include(x => x.Variants).FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken)
            ?? throw new KeyNotFoundException("Product not found.");
        var openingStock = await _stocks.Query().Where(x => x.ShopId == product.ShopId && x.ProductId == product.Id).SumAsync(x => x.QuantityOnHand, cancellationToken);
        return InventoryMapper.ToProductDetail(product, openingStock);
    }
}

public sealed class SaveInventoryProductCommandHandler : IRequestHandler<SaveInventoryProductCommand, InventoryProductDetailDto>
{
    private readonly IRepository<Product> _products;
    private readonly IRepository<ProductVariant> _variants;
    private readonly IRepository<InventoryStock> _stocks;
    private readonly IRepository<InventoryMovement> _movements;
    private readonly IUnitOfWork _unitOfWork;

    public SaveInventoryProductCommandHandler(IRepository<Product> products, IRepository<ProductVariant> variants, IRepository<InventoryStock> stocks, IRepository<InventoryMovement> movements, IUnitOfWork unitOfWork)
    {
        _products = products;
        _variants = variants;
        _stocks = stocks;
        _movements = movements;
        _unitOfWork = unitOfWork;
    }

    public async Task<InventoryProductDetailDto> Handle(SaveInventoryProductCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        Product product;
        if (request.Id.HasValue)
        {
            product = await _products.Query().Include(x => x.Variants).FirstOrDefaultAsync(x => x.Id == request.Id.Value, cancellationToken)
                ?? throw new KeyNotFoundException("Product not found.");
        }
        else
        {
            product = new Product { ShopId = request.ShopId, Sku = string.IsNullOrWhiteSpace(request.Sku) ? await NextSku(request.ShopId, cancellationToken) : request.Sku.Trim() };
            await _products.AddAsync(product, cancellationToken);
        }

        product.Name = request.Name.Trim();
        product.Barcode = EmptyToNull(request.Barcode);
        product.CategoryId = request.CategoryId;
        product.SubCategory = EmptyToNull(request.SubCategory);
        product.Brand = EmptyToNull(request.Brand);
        product.HsnSacCode = EmptyToNull(request.HsnSacCode);
        product.UnitOfMeasureId = request.UnitOfMeasureId;
        product.TaxSlabId = request.TaxSlabId;
        product.CostPrice = request.CostPrice;
        product.SellingPrice = request.SellingPrice;
        product.Mrp = request.Mrp;
        product.WholesalePrice = request.WholesalePrice;
        product.LowStockThreshold = request.LowStockThreshold;
        product.MaxStockThreshold = request.MaxStockThreshold;
        product.ReorderQuantity = request.ReorderQuantity;
        product.IsTaxInclusive = request.IsTaxInclusive;
        product.ExpiryTracking = request.ExpiryTracking;
        product.BatchTracking = request.BatchTracking || request.ExpiryTracking;
        product.RequiresPrescription = request.RequiresPrescription;
        product.Composition = EmptyToNull(request.Composition);
        product.Manufacturer = EmptyToNull(request.Manufacturer);
        product.FoodType = request.FoodType;
        product.PreparationTimeMinutes = request.PreparationTimeMinutes;
        product.RecipeCost = request.RecipeCost;
        product.PortionSize = EmptyToNull(request.PortionSize);
        product.ImageUrl = InventoryImage.Normalize(request.ImageDataUrl);
        product.IsActive = request.IsActive;
        product.IsFeatured = request.IsFeatured;
        product.IsStockTracked = true;
        if (!string.IsNullOrWhiteSpace(request.Sku)) product.Sku = request.Sku.Trim();

        foreach (var variantRequest in request.Variants)
        {
            var name = string.Join(" / ", new[] { variantRequest.Size, variantRequest.Color }.Where(x => !string.IsNullOrWhiteSpace(x)));
            if (string.IsNullOrWhiteSpace(name)) continue;
            var sku = $"{product.Sku}-{Slug(variantRequest.Size)}-{Slug(variantRequest.Color)}".Trim('-');
            var existing = product.Variants.FirstOrDefault(x => x.Sku == sku);
            var variant = existing ?? new ProductVariant { Product = product, ProductId = product.Id, Sku = sku };
            variant.VariantName = name;
            variant.Size = EmptyToNull(variantRequest.Size);
            variant.Color = EmptyToNull(variantRequest.Color);
            variant.SellingPrice = variantRequest.SellingPrice ?? product.SellingPrice;
            variant.Mrp = variantRequest.Mrp ?? product.Mrp;
            variant.CostPrice = product.CostPrice;
            variant.AttributeJson = $$"""{"size":"{{variant.Size}}","color":"{{variant.Color}}"}""";
            if (existing is null) await _variants.AddAsync(variant, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        await SetOpeningStock(product.ShopId, product.Id, null, request.OpeningStock, product.CostPrice, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        var openingStock = await _stocks.Query().Where(x => x.ShopId == product.ShopId && x.ProductId == product.Id).SumAsync(x => x.QuantityOnHand, cancellationToken);
        return InventoryMapper.ToProductDetail(product, openingStock);
    }

    private async Task<string> NextSku(Guid shopId, CancellationToken cancellationToken)
    {
        var count = await _products.Query().CountAsync(x => x.ShopId == shopId, cancellationToken) + 1;
        return $"PRD-{count:00000}";
    }

    private async Task SetOpeningStock(Guid shopId, Guid productId, Guid? variantId, decimal target, decimal cost, CancellationToken cancellationToken)
    {
        var stock = await _stocks.Query().FirstOrDefaultAsync(x => x.ShopId == shopId && x.ProductId == productId && x.ProductVariantId == variantId, cancellationToken);
        if (stock is null)
        {
            stock = new InventoryStock { ShopId = shopId, ProductId = productId, ProductVariantId = variantId, ReorderLevel = 0 };
            await _stocks.AddAsync(stock, cancellationToken);
        }

        var diff = target - stock.QuantityOnHand;
        stock.QuantityOnHand = target;
        stock.LastMovementAt = DateTimeOffset.UtcNow;
        if (diff != 0)
        {
            await _movements.AddAsync(new InventoryMovement { ShopId = shopId, ProductId = productId, ProductVariantId = variantId, MovementType = StockMovementType.Opening, Quantity = diff, UnitCost = cost, ReferenceType = "OpeningStock", Notes = "Opening balance updated from product form." }, cancellationToken);
        }
    }

    private static string? EmptyToNull(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    private static string Slug(string? value) => string.IsNullOrWhiteSpace(value) ? string.Empty : new string(value.Trim().ToUpperInvariant().Where(char.IsLetterOrDigit).ToArray());
}

public sealed class CategoryHandlers :
    IRequestHandler<CategoryTreeQuery, IReadOnlyList<CategoryTreeNodeDto>>,
    IRequestHandler<SaveInventoryCategoryCommand, CategoryDto>
{
    private readonly IRepository<Category> _categories;
    private readonly IUnitOfWork _unitOfWork;

    public CategoryHandlers(IRepository<Category> categories, IUnitOfWork unitOfWork)
    {
        _categories = categories;
        _unitOfWork = unitOfWork;
    }

    public async Task<IReadOnlyList<CategoryTreeNodeDto>> Handle(CategoryTreeQuery request, CancellationToken cancellationToken)
    {
        var categories = await _categories.Query().Where(x => x.ShopId == request.ShopId).OrderBy(x => x.DisplayOrder).ThenBy(x => x.Name).ToListAsync(cancellationToken);
        return categories.Where(x => x.ParentCategoryId is null).Select(x => ToNode(x, categories)).ToList();
    }

    public async Task<CategoryDto> Handle(SaveInventoryCategoryCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        var category = request.Id.HasValue
            ? await _categories.GetByIdAsync(request.Id.Value, cancellationToken) ?? throw new KeyNotFoundException("Category not found.")
            : new Category { ShopId = request.ShopId };
        category.ParentCategoryId = request.ParentCategoryId;
        category.Name = request.Name.Trim();
        category.Description = request.Description;
        category.ImageUrl = request.ImageUrl;
        category.ColorHex = request.ColorHex;
        category.DisplayOrder = request.DisplayOrder;
        if (!request.Id.HasValue) await _categories.AddAsync(category, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return new CategoryDto(category.Id, category.ShopId, category.Name, category.Description, category.ParentCategoryId);
    }

    private static CategoryTreeNodeDto ToNode(Category category, IReadOnlyList<Category> all)
        => new(category.Id, category.Name, category.Description, category.ImageUrl, category.ColorHex, category.DisplayOrder, all.Where(x => x.ParentCategoryId == category.Id).OrderBy(x => x.DisplayOrder).Select(x => ToNode(x, all)).ToList());
}

public sealed class InventoryDashboardQueryHandler : IRequestHandler<InventoryDashboardQuery, InventoryDashboardDto>
{
    private readonly IRepository<Product> _products;
    private readonly IRepository<InventoryStock> _stocks;
    private readonly IRepository<InventoryBatch> _batches;
    private readonly IRepository<InventoryMovement> _movements;

    public InventoryDashboardQueryHandler(IRepository<Product> products, IRepository<InventoryStock> stocks, IRepository<InventoryBatch> batches, IRepository<InventoryMovement> movements)
    {
        _products = products;
        _stocks = stocks;
        _batches = batches;
        _movements = movements;
    }

    public async Task<InventoryDashboardDto> Handle(InventoryDashboardQuery request, CancellationToken cancellationToken)
    {
        var products = await _products.Query().Include(x => x.Category).Include(x => x.UnitOfMeasure).Include(x => x.TaxSlab).Where(x => x.ShopId == request.ShopId && x.IsActive).ToListAsync(cancellationToken);
        var stocks = await _stocks.Query().Include(x => x.Product).Where(x => x.ShopId == request.ShopId).ToListAsync(cancellationToken);
        var productStock = stocks.GroupBy(x => x.ProductId).ToDictionary(x => x.Key, x => x.Sum(s => s.QuantityOnHand));
        var lowStock = products.Where(x => productStock.GetValueOrDefault(x.Id) <= x.LowStockThreshold).Select(product => new InventoryProductListItemDto(product.Id, product.Sku, product.Name, product.Category?.Name ?? string.Empty, product.Brand, product.UnitOfMeasure?.Symbol ?? "pc", productStock.GetValueOrDefault(product.Id), product.CostPrice, product.SellingPrice, product.Mrp, product.WholesalePrice, product.TaxSlab?.Rate ?? 0, product.IsTaxInclusive, product.ExpiryTracking, product.IsActive, product.IsFeatured)).ToList();
        var today = DateTimeOffset.UtcNow.Date;
        var expiring = await _batches.Query().Include(x => x.Product).Where(x => x.ShopId == request.ShopId && x.QuantityAvailable > 0 && x.ExpiryDate != null && x.ExpiryDate <= today.AddDays(30) && !x.IsQuarantined)
            .OrderBy(x => x.ExpiryDate).Take(25).Select(x => new InventoryBatchDto(x.Id, x.ProductId, x.Product!.Name, x.ProductVariantId, x.BatchNo, x.ManufacturingDate, x.ExpiryDate, x.QuantityReceived, x.QuantityAvailable, x.Rate, x.Status, x.IsQuarantined)).ToListAsync(cancellationToken);
        var since90 = DateTimeOffset.UtcNow.AddDays(-90);
        var moved = await _movements.Query().Where(x => x.ShopId == request.ShopId && x.CreatedAt >= since90 && (x.MovementType == StockMovementType.Sale || x.MovementType == StockMovementType.Purchase))
            .GroupBy(x => x.ProductId).Select(x => new { ProductId = x.Key, Qty = x.Sum(m => Math.Abs(m.Quantity)) }).ToListAsync(cancellationToken);
        var movementByProduct = moved.ToDictionary(x => x.ProductId, x => x.Qty);
        var velocity = products.Select(x => new StockVelocityDto(x.Id, x.Name, movementByProduct.GetValueOrDefault(x.Id), movementByProduct.GetValueOrDefault(x.Id) >= 100 ? "A" : movementByProduct.GetValueOrDefault(x.Id) >= 25 ? "B" : "C")).OrderByDescending(x => x.MovementQty).ToList();

        return new InventoryDashboardDto(
            products.Count,
            stocks.Sum(x => x.QuantityOnHand * (x.Product?.CostPrice ?? 0)),
            stocks.Sum(x => x.QuantityOnHand * (x.Product?.SellingPrice ?? 0)),
            lowStock.Count,
            expiring.Count,
            products.Count(x => !movementByProduct.ContainsKey(x.Id) && productStock.GetValueOrDefault(x.Id) > 0),
            lowStock.Take(25).ToList(),
            expiring,
            velocity.Take(10).ToList(),
            velocity.OrderBy(x => x.MovementQty).Take(10).ToList());
    }
}

public sealed class InventoryBatchHandlers :
    IRequestHandler<InventoryBatchesQuery, IReadOnlyList<InventoryBatchDto>>,
    IRequestHandler<QuarantineExpiredBatchesCommand, int>
{
    private readonly IRepository<InventoryBatch> _batches;
    private readonly IRepository<Notification> _notifications;
    private readonly IUnitOfWork _unitOfWork;

    public InventoryBatchHandlers(IRepository<InventoryBatch> batches, IRepository<Notification> notifications, IUnitOfWork unitOfWork)
    {
        _batches = batches;
        _notifications = notifications;
        _unitOfWork = unitOfWork;
    }

    public async Task<IReadOnlyList<InventoryBatchDto>> Handle(InventoryBatchesQuery request, CancellationToken cancellationToken)
    {
        var today = DateTimeOffset.UtcNow.Date;
        var query = _batches.Query().Include(x => x.Product).Where(x => x.ShopId == request.ShopId);
        if (request.ProductId.HasValue) query = query.Where(x => x.ProductId == request.ProductId.Value);
        if (request.ExpiringOnly) query = query.Where(x => x.ExpiryDate != null && x.ExpiryDate <= today.AddDays(30));
        return await query.OrderBy(x => x.ExpiryDate ?? DateTimeOffset.MaxValue)
            .Select(x => new InventoryBatchDto(x.Id, x.ProductId, x.Product!.Name, x.ProductVariantId, x.BatchNo, x.ManufacturingDate, x.ExpiryDate, x.QuantityReceived, x.QuantityAvailable, x.Rate, x.Status, x.IsQuarantined))
            .ToListAsync(cancellationToken);
    }

    public async Task<int> Handle(QuarantineExpiredBatchesCommand request, CancellationToken cancellationToken)
    {
        var today = DateTimeOffset.UtcNow.Date;
        var expired = await _batches.Query().Include(x => x.Product).Where(x => x.ShopId == request.ShopId && x.ExpiryDate != null && x.ExpiryDate < today && !x.IsQuarantined).ToListAsync(cancellationToken);
        foreach (var batch in expired)
        {
            batch.IsQuarantined = true;
            batch.Status = InventoryBatchStatus.Expired;
            await _notifications.AddAsync(new Notification { ShopId = request.ShopId, Severity = NotificationSeverity.Critical, Title = "Expired batch quarantined", Message = $"{batch.Product?.Name ?? "Product"} batch {batch.BatchNo} expired and was blocked from sale." }, cancellationToken);
        }
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return expired.Count;
    }
}

public sealed class PurchaseOrderHandlers :
    IRequestHandler<CreatePurchaseOrderCommand, PurchaseOrderDto>,
    IRequestHandler<PurchaseOrdersQuery, IReadOnlyList<PurchaseOrderDto>>
{
    private readonly IRepository<PurchaseOrder> _orders;
    private readonly IRepository<Product> _products;
    private readonly IUnitOfWork _unitOfWork;

    public PurchaseOrderHandlers(IRepository<PurchaseOrder> orders, IRepository<Product> products, IUnitOfWork unitOfWork)
    {
        _orders = orders;
        _products = products;
        _unitOfWork = unitOfWork;
    }

    public async Task<PurchaseOrderDto> Handle(CreatePurchaseOrderCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        var next = await _orders.Query().CountAsync(x => x.ShopId == request.ShopId, cancellationToken) + 1;
        var order = new PurchaseOrder { ShopId = request.ShopId, SupplierId = request.SupplierId, PurchaseOrderNumber = $"PO-{DateTimeOffset.UtcNow:yyyyMMdd}-{next:0000}", ExpectedDate = request.ExpectedDate, Status = PurchaseOrderStatus.Ordered, Notes = request.Notes };
        var productIds = request.Items.Select(x => x.ProductId).ToArray();
        var products = await _products.Query().Where(x => productIds.Contains(x.Id)).ToDictionaryAsync(x => x.Id, cancellationToken);
        foreach (var item in request.Items)
        {
            var lineTotal = item.ExpectedQuantity * item.UnitCost;
            var tax = lineTotal * item.TaxRate / 100;
            order.Items.Add(new PurchaseOrderItem { ProductId = item.ProductId, ProductVariantId = item.ProductVariantId, ExpectedQuantity = item.ExpectedQuantity, UnitCost = item.UnitCost, TaxRate = item.TaxRate, LineTotal = lineTotal + tax });
            order.SubTotal += lineTotal;
            order.TaxTotal += tax;
        }
        order.GrandTotal = order.SubTotal + order.TaxTotal;
        await _orders.AddAsync(order, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return ToOrderDto(order, products, null);
    }

    public async Task<IReadOnlyList<PurchaseOrderDto>> Handle(PurchaseOrdersQuery request, CancellationToken cancellationToken)
    {
        var orders = await _orders.Query().Include(x => x.Supplier).Include(x => x.Items).ThenInclude(x => x.Product).Where(x => x.ShopId == request.ShopId).OrderByDescending(x => x.OrderDate).Take(100).ToListAsync(cancellationToken);
        return orders.Select(x => ToOrderDto(x, null, x.Supplier?.Name)).ToList();
    }

    internal static PurchaseOrderDto ToOrderDto(PurchaseOrder order, IReadOnlyDictionary<Guid, Product>? products, string? supplierName)
        => new(order.Id, order.ShopId, order.SupplierId, supplierName ?? order.Supplier?.Name ?? string.Empty, order.PurchaseOrderNumber, order.OrderDate, order.ExpectedDate, order.Status, order.SubTotal, order.TaxTotal, order.GrandTotal, order.Notes,
            order.Items.Select(item => new PurchaseOrderItemDto(item.Id, item.ProductId, item.Product?.Name ?? (products?.GetValueOrDefault(item.ProductId)?.Name ?? string.Empty), item.ProductVariantId, item.ExpectedQuantity, item.ReceivedQuantity, item.UnitCost, item.TaxRate, item.LineTotal)).ToList());
}

public sealed class GrnHandlers :
    IRequestHandler<CreateGrnCommand, GrnDto>,
    IRequestHandler<ApproveGrnCommand, GrnDto>
{
    private readonly IRepository<GoodsReceiptNote> _grns;
    private readonly IRepository<PurchaseInvoice> _invoices;
    private readonly IRepository<PurchaseOrder> _orders;
    private readonly IRepository<InventoryStock> _stocks;
    private readonly IRepository<InventoryMovement> _movements;
    private readonly IRepository<InventoryBatch> _batches;
    private readonly IRepository<Supplier> _suppliers;
    private readonly IRepository<SupplierLedgerEntry> _ledger;
    private readonly IUnitOfWork _unitOfWork;

    public GrnHandlers(IRepository<GoodsReceiptNote> grns, IRepository<PurchaseInvoice> invoices, IRepository<PurchaseOrder> orders, IRepository<InventoryStock> stocks, IRepository<InventoryMovement> movements, IRepository<InventoryBatch> batches, IRepository<Supplier> suppliers, IRepository<SupplierLedgerEntry> ledger, IUnitOfWork unitOfWork)
    {
        _grns = grns;
        _invoices = invoices;
        _orders = orders;
        _stocks = stocks;
        _movements = movements;
        _batches = batches;
        _suppliers = suppliers;
        _ledger = ledger;
        _unitOfWork = unitOfWork;
    }

    public async Task<GrnDto> Handle(CreateGrnCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        var next = await _grns.Query().CountAsync(x => x.ShopId == request.ShopId, cancellationToken) + 1;
        var invoice = new PurchaseInvoice { ShopId = request.ShopId, SupplierId = request.SupplierId, PurchaseOrderId = request.PurchaseOrderId, SupplierInvoiceNumber = request.SupplierInvoiceNumber, InvoiceDate = request.InvoiceDate ?? DateTimeOffset.UtcNow };
        foreach (var item in request.Items)
        {
            var line = item.QuantityReceived * item.Rate;
            var tax = line * item.TaxRate / 100;
            invoice.Items.Add(new PurchaseInvoiceItem { ProductId = item.ProductId, Quantity = item.QuantityReceived, UnitCost = item.Rate, TaxRate = item.TaxRate, LineTotal = line + tax });
            invoice.SubTotal += line;
            invoice.TaxTotal += tax;
        }
        invoice.GrandTotal = invoice.SubTotal + invoice.TaxTotal;
        var grn = new GoodsReceiptNote { ShopId = request.ShopId, PurchaseInvoice = invoice, PurchaseOrderId = request.PurchaseOrderId, GrnNumber = $"GRN-{DateTimeOffset.UtcNow:yyyyMMdd}-{next:0000}" };
        foreach (var item in request.Items)
        {
            grn.Items.Add(new GoodsReceiptNoteItem { ProductId = item.ProductId, ProductVariantId = item.ProductVariantId, ExpectedQuantity = item.ExpectedQuantity, QuantityReceived = item.QuantityReceived, QuantityRejected = item.QuantityRejected, Rate = item.Rate, BatchNo = item.BatchNo, ManufacturingDate = item.ManufacturingDate, ExpiryDate = item.ExpiryDate });
        }
        grn.MismatchSummary = BuildMismatch(grn.Items);
        await _invoices.AddAsync(invoice, cancellationToken);
        await _grns.AddAsync(grn, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return ToGrnDto(grn);
    }

    public async Task<GrnDto> Handle(ApproveGrnCommand request, CancellationToken cancellationToken)
    {
        var grn = await _grns.Query().Include(x => x.PurchaseInvoice).ThenInclude(x => x!.Supplier).Include(x => x.Items).ThenInclude(x => x.Product).FirstOrDefaultAsync(x => x.Id == request.GrnId, cancellationToken)
            ?? throw new KeyNotFoundException("GRN not found.");
        if (grn.IsApproved) return ToGrnDto(grn);
        foreach (var item in grn.Items)
        {
            var stock = await _stocks.Query().FirstOrDefaultAsync(x => x.ShopId == grn.ShopId && x.ProductId == item.ProductId && x.ProductVariantId == item.ProductVariantId, cancellationToken);
            if (stock is null)
            {
                stock = new InventoryStock { ShopId = grn.ShopId, ProductId = item.ProductId, ProductVariantId = item.ProductVariantId };
                await _stocks.AddAsync(stock, cancellationToken);
            }
            stock.QuantityOnHand += item.QuantityReceived;
            stock.LastMovementAt = DateTimeOffset.UtcNow;
            await _movements.AddAsync(new InventoryMovement { ShopId = grn.ShopId, ProductId = item.ProductId, ProductVariantId = item.ProductVariantId, MovementType = StockMovementType.Purchase, Quantity = item.QuantityReceived, UnitCost = item.Rate, ReferenceType = nameof(GoodsReceiptNote), ReferenceId = grn.Id, Notes = grn.GrnNumber }, cancellationToken);
            if (!string.IsNullOrWhiteSpace(item.BatchNo))
            {
                await _batches.AddAsync(new InventoryBatch { ShopId = grn.ShopId, ProductId = item.ProductId, ProductVariantId = item.ProductVariantId, BatchNo = item.BatchNo.Trim(), ManufacturingDate = item.ManufacturingDate, ExpiryDate = item.ExpiryDate, QuantityReceived = item.QuantityReceived, QuantityAvailable = item.QuantityReceived, Rate = item.Rate, GoodsReceiptNoteId = grn.Id }, cancellationToken);
            }
        }
        grn.IsApproved = true;
        grn.ApprovedAt = DateTimeOffset.UtcNow;
        if (grn.PurchaseOrderId.HasValue)
        {
            var order = await _orders.Query().Include(x => x.Items).FirstOrDefaultAsync(x => x.Id == grn.PurchaseOrderId.Value, cancellationToken);
            if (order is not null)
            {
                foreach (var line in order.Items)
                {
                    line.ReceivedQuantity += grn.Items.Where(x => x.ProductId == line.ProductId && x.ProductVariantId == line.ProductVariantId).Sum(x => x.QuantityReceived);
                }
                order.Status = order.Items.All(x => x.ReceivedQuantity >= x.ExpectedQuantity) ? PurchaseOrderStatus.Received : PurchaseOrderStatus.PartiallyReceived;
            }
        }
        await AddSupplierPurchaseLedger(grn, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return ToGrnDto(grn);
    }

    private async Task AddSupplierPurchaseLedger(GoodsReceiptNote grn, CancellationToken cancellationToken)
    {
        var invoice = grn.PurchaseInvoice!;
        var supplier = await _suppliers.GetByIdAsync(invoice.SupplierId, cancellationToken);
        if (supplier is null) return;
        supplier.OutstandingBalance += invoice.GrandTotal;
        var due = invoice.InvoiceDate.AddDays(supplier.CreditDays);
        await _ledger.AddAsync(new SupplierLedgerEntry { ShopId = grn.ShopId, SupplierId = supplier.Id, EntryType = SupplierLedgerEntryType.Purchase, EntryDate = invoice.InvoiceDate, DueDate = due, Debit = invoice.GrandTotal, BalanceAfter = supplier.OutstandingBalance, ReferenceType = nameof(PurchaseInvoice), ReferenceId = invoice.Id, Notes = invoice.SupplierInvoiceNumber }, cancellationToken);
    }

    private static string? BuildMismatch(IEnumerable<GoodsReceiptNoteItem> items)
    {
        var mismatches = items.Where(x => x.ExpectedQuantity != x.QuantityReceived + x.QuantityRejected).Select(x => $"{x.ProductId}: expected {x.ExpectedQuantity}, received {x.QuantityReceived}, rejected {x.QuantityRejected}");
        return string.Join("; ", mismatches);
    }

    private static GrnDto ToGrnDto(GoodsReceiptNote grn)
        => new(grn.Id, grn.ShopId, grn.PurchaseInvoiceId, grn.PurchaseOrderId, grn.GrnNumber, grn.ReceivedAt, grn.IsApproved, grn.MismatchSummary,
            grn.Items.Select(x => new GrnItemDto(x.Id, x.ProductId, x.Product?.Name ?? string.Empty, x.ProductVariantId, x.ExpectedQuantity, x.QuantityReceived, x.QuantityRejected, x.BatchNo, x.ManufacturingDate, x.ExpiryDate, x.Rate)).ToList());
}

public sealed class SupplierHandlers :
    IRequestHandler<SuppliersQuery, IReadOnlyList<SupplierSummaryDto>>,
    IRequestHandler<SaveSupplierCommand, SupplierDetailDto>,
    IRequestHandler<SupplierLedgerQuery, IReadOnlyList<SupplierLedgerRowDto>>,
    IRequestHandler<SupplierAnalysisQuery, IReadOnlyList<SupplierAnalysisDto>>
{
    private readonly IRepository<Supplier> _suppliers;
    private readonly IRepository<SupplierLedgerEntry> _ledger;
    private readonly IUnitOfWork _unitOfWork;

    public SupplierHandlers(IRepository<Supplier> suppliers, IRepository<SupplierLedgerEntry> ledger, IUnitOfWork unitOfWork)
    {
        _suppliers = suppliers;
        _ledger = ledger;
        _unitOfWork = unitOfWork;
    }

    public async Task<IReadOnlyList<SupplierSummaryDto>> Handle(SuppliersQuery request, CancellationToken cancellationToken)
        => await _suppliers.Query().Where(x => x.ShopId == request.ShopId).OrderBy(x => x.Name).Select(x => new SupplierSummaryDto(x.Id, x.Name, x.Phone, x.Email, x.OutstandingBalance)).ToListAsync(cancellationToken);

    public async Task<SupplierDetailDto> Handle(SaveSupplierCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        var supplier = request.Id.HasValue
            ? await _suppliers.GetByIdAsync(request.Id.Value, cancellationToken) ?? throw new KeyNotFoundException("Supplier not found.")
            : new Supplier { ShopId = request.ShopId };
        var wasNew = supplier.Id == Guid.Empty || !request.Id.HasValue;
        supplier.Name = request.Name.Trim();
        supplier.ContactPerson = request.ContactPerson;
        supplier.Phone = request.Phone;
        supplier.Email = request.Email;
        supplier.TaxRegistrationNumber = request.TaxRegistrationNumber;
        supplier.Pan = request.Pan;
        supplier.Address = request.Address;
        supplier.BankDetails = request.BankDetails;
        supplier.CreditDays = request.CreditDays;
        supplier.PaymentTerms = request.PaymentTerms;
        if (wasNew)
        {
            supplier.OpeningBalance = request.OpeningBalance;
            supplier.OutstandingBalance = request.OpeningBalance;
            await _suppliers.AddAsync(supplier, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            if (request.OpeningBalance != 0)
            {
                await _ledger.AddAsync(new SupplierLedgerEntry { ShopId = supplier.ShopId, SupplierId = supplier.Id, EntryType = SupplierLedgerEntryType.OpeningBalance, EntryDate = DateTimeOffset.UtcNow, Debit = Math.Max(0, request.OpeningBalance), Credit = Math.Max(0, -request.OpeningBalance), BalanceAfter = supplier.OutstandingBalance, ReferenceType = "OpeningBalance" }, cancellationToken);
            }
        }
        else
        {
            supplier.OpeningBalance = request.OpeningBalance;
        }
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return InventoryMapper.ToSupplierDetail(supplier);
    }

    public async Task<IReadOnlyList<SupplierLedgerRowDto>> Handle(SupplierLedgerQuery request, CancellationToken cancellationToken)
        => await _ledger.Query().Where(x => x.SupplierId == request.SupplierId).OrderBy(x => x.EntryDate)
            .Select(x => new SupplierLedgerRowDto(x.EntryDate, x.EntryType.ToString(), x.ReferenceType, x.Debit, x.Credit, x.BalanceAfter, x.DueDate, x.Notes)).ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<SupplierAnalysisDto>> Handle(SupplierAnalysisQuery request, CancellationToken cancellationToken)
    {
        var suppliers = await _suppliers.Query().Where(x => x.ShopId == request.ShopId).ToListAsync(cancellationToken);
        var entries = await _ledger.Query().Where(x => x.ShopId == request.ShopId).ToListAsync(cancellationToken);
        return suppliers.Select(s =>
        {
            var rows = entries.Where(x => x.SupplierId == s.Id).ToList();
            var purchases = rows.Where(x => x.EntryType == SupplierLedgerEntryType.Purchase).Sum(x => x.Debit);
            var paid = rows.Where(x => x.EntryType == SupplierLedgerEntryType.Payment || x.EntryType == SupplierLedgerEntryType.DebitNote).Sum(x => x.Credit);
            return new SupplierAnalysisDto(s.Id, s.Name, purchases, paid, s.OutstandingBalance, s.CreditDays);
        }).OrderByDescending(x => x.PurchaseTotal).ToList();
    }
}

public sealed class PurchaseReturnCommandHandler : IRequestHandler<CreatePurchaseReturnCommand, PurchaseReturnDto>
{
    private readonly IRepository<PurchaseInvoice> _invoices;
    private readonly IRepository<PurchaseReturn> _returns;
    private readonly IRepository<InventoryStock> _stocks;
    private readonly IRepository<InventoryMovement> _movements;
    private readonly IRepository<Supplier> _suppliers;
    private readonly IRepository<SupplierLedgerEntry> _ledger;
    private readonly IUnitOfWork _unitOfWork;

    public PurchaseReturnCommandHandler(IRepository<PurchaseInvoice> invoices, IRepository<PurchaseReturn> returns, IRepository<InventoryStock> stocks, IRepository<InventoryMovement> movements, IRepository<Supplier> suppliers, IRepository<SupplierLedgerEntry> ledger, IUnitOfWork unitOfWork)
    {
        _invoices = invoices;
        _returns = returns;
        _stocks = stocks;
        _movements = movements;
        _suppliers = suppliers;
        _ledger = ledger;
        _unitOfWork = unitOfWork;
    }

    public async Task<PurchaseReturnDto> Handle(CreatePurchaseReturnCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        var invoice = await _invoices.GetByIdAsync(request.PurchaseInvoiceId, cancellationToken) ?? throw new KeyNotFoundException("Purchase invoice not found.");
        var next = await _returns.Query().CountAsync(x => x.ShopId == request.ShopId, cancellationToken) + 1;
        var purchaseReturn = new PurchaseReturn { ShopId = request.ShopId, PurchaseInvoiceId = request.PurchaseInvoiceId, DebitNoteNumber = $"DN-{DateTimeOffset.UtcNow:yyyyMMdd}-{next:0000}", Status = ReturnStatus.Approved, Reason = request.Reason };
        foreach (var item in request.Items)
        {
            var amount = item.Quantity * item.UnitCost;
            purchaseReturn.Items.Add(new PurchaseReturnItem { ProductId = item.ProductId, Quantity = item.Quantity, UnitCost = item.UnitCost, ReturnAmount = amount });
            purchaseReturn.ReturnAmount += amount;
            var stock = await _stocks.Query().FirstOrDefaultAsync(x => x.ShopId == request.ShopId && x.ProductId == item.ProductId && x.ProductVariantId == item.ProductVariantId, cancellationToken);
            if (stock is not null) stock.QuantityOnHand -= item.Quantity;
            await _movements.AddAsync(new InventoryMovement { ShopId = request.ShopId, ProductId = item.ProductId, ProductVariantId = item.ProductVariantId, MovementType = StockMovementType.Return, Quantity = -item.Quantity, UnitCost = item.UnitCost, ReferenceType = nameof(PurchaseReturn), ReferenceId = purchaseReturn.Id, Notes = request.Reason }, cancellationToken);
        }
        var supplier = await _suppliers.GetByIdAsync(invoice.SupplierId, cancellationToken);
        if (supplier is not null)
        {
            supplier.OutstandingBalance -= purchaseReturn.ReturnAmount;
            await _ledger.AddAsync(new SupplierLedgerEntry { ShopId = request.ShopId, SupplierId = supplier.Id, EntryType = SupplierLedgerEntryType.DebitNote, EntryDate = DateTimeOffset.UtcNow, Credit = purchaseReturn.ReturnAmount, BalanceAfter = supplier.OutstandingBalance, ReferenceType = nameof(PurchaseReturn), ReferenceId = purchaseReturn.Id, Notes = purchaseReturn.DebitNoteNumber }, cancellationToken);
        }
        await _returns.AddAsync(purchaseReturn, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return new PurchaseReturnDto(purchaseReturn.Id, purchaseReturn.ShopId, purchaseReturn.PurchaseInvoiceId, purchaseReturn.DebitNoteNumber, purchaseReturn.Status, purchaseReturn.ReturnAmount, purchaseReturn.Reason);
    }
}

public sealed class InventoryAdjustmentHandlers :
    IRequestHandler<CreateInventoryAdjustmentCommand, InventoryAdjustmentDto>,
    IRequestHandler<InventoryAdjustmentsQuery, IReadOnlyList<InventoryAdjustmentDto>>,
    IRequestHandler<ApproveInventoryAdjustmentCommand, InventoryAdjustmentDto>,
    IRequestHandler<AdjustmentVoucherQuery, AdjustmentVoucherDto>
{
    private readonly IRepository<StockAdjustment> _adjustments;
    private readonly IRepository<InventoryStock> _stocks;
    private readonly IRepository<InventoryMovement> _movements;
    private readonly IUnitOfWork _unitOfWork;

    public InventoryAdjustmentHandlers(IRepository<StockAdjustment> adjustments, IRepository<InventoryStock> stocks, IRepository<InventoryMovement> movements, IUnitOfWork unitOfWork)
    {
        _adjustments = adjustments;
        _stocks = stocks;
        _movements = movements;
        _unitOfWork = unitOfWork;
    }

    public async Task<InventoryAdjustmentDto> Handle(CreateInventoryAdjustmentCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        var next = await _adjustments.Query().CountAsync(x => x.ShopId == request.ShopId, cancellationToken) + 1;
        var adjustment = new StockAdjustment { ShopId = request.ShopId, AdjustmentNumber = $"ADJ-{DateTimeOffset.UtcNow:yyyyMMdd}-{next:0000}", AdjustmentType = request.AdjustmentType, Status = AdjustmentStatus.Pending, Reason = request.Reason, ReferenceNumber = request.ReferenceNumber, Notes = request.Notes };
        foreach (var item in request.Items)
        {
            var oldQty = await _stocks.Query().Where(x => x.ShopId == request.ShopId && x.ProductId == item.ProductId && x.ProductVariantId == item.ProductVariantId).Select(x => x.QuantityOnHand).FirstOrDefaultAsync(cancellationToken);
            adjustment.Items.Add(new StockAdjustmentItem { ProductId = item.ProductId, ProductVariantId = item.ProductVariantId, OldQuantity = oldQty, NewQuantity = item.NewQuantity, Reason = item.Reason });
        }
        await _adjustments.AddAsync(adjustment, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return ToAdjustmentDto(adjustment);
    }

    public async Task<IReadOnlyList<InventoryAdjustmentDto>> Handle(InventoryAdjustmentsQuery request, CancellationToken cancellationToken)
        => (await _adjustments.Query().Include(x => x.Items).Where(x => x.ShopId == request.ShopId).OrderByDescending(x => x.AdjustmentDate).Take(100).ToListAsync(cancellationToken)).Select(ToAdjustmentDto).ToList();

    public async Task<InventoryAdjustmentDto> Handle(ApproveInventoryAdjustmentCommand request, CancellationToken cancellationToken)
    {
        var adjustment = await _adjustments.Query().Include(x => x.Items).FirstOrDefaultAsync(x => x.Id == request.AdjustmentId, cancellationToken)
            ?? throw new KeyNotFoundException("Adjustment not found.");
        if (adjustment.IsApproved) return ToAdjustmentDto(adjustment);
        foreach (var item in adjustment.Items)
        {
            var stock = await _stocks.Query().FirstOrDefaultAsync(x => x.ShopId == adjustment.ShopId && x.ProductId == item.ProductId && x.ProductVariantId == item.ProductVariantId, cancellationToken);
            if (stock is null)
            {
                stock = new InventoryStock { ShopId = adjustment.ShopId, ProductId = item.ProductId, ProductVariantId = item.ProductVariantId };
                await _stocks.AddAsync(stock, cancellationToken);
            }
            var diff = item.NewQuantity - stock.QuantityOnHand;
            stock.QuantityOnHand = item.NewQuantity;
            stock.LastMovementAt = DateTimeOffset.UtcNow;
            await _movements.AddAsync(new InventoryMovement { ShopId = adjustment.ShopId, ProductId = item.ProductId, ProductVariantId = item.ProductVariantId, MovementType = StockMovementType.Adjustment, Quantity = diff, ReferenceType = nameof(StockAdjustment), ReferenceId = adjustment.Id, Notes = adjustment.Reason }, cancellationToken);
        }
        adjustment.IsApproved = true;
        adjustment.Status = AdjustmentStatus.Approved;
        adjustment.ApprovedByUserId = request.ApprovedByUserId;
        adjustment.ApprovedAt = DateTimeOffset.UtcNow;
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return ToAdjustmentDto(adjustment);
    }

    public async Task<AdjustmentVoucherDto> Handle(AdjustmentVoucherQuery request, CancellationToken cancellationToken)
    {
        var adjustment = await _adjustments.Query().Include(x => x.Items).ThenInclude(x => x.Product).FirstOrDefaultAsync(x => x.Id == request.AdjustmentId, cancellationToken)
            ?? throw new KeyNotFoundException("Adjustment not found.");
        var rows = string.Join("", adjustment.Items.Select(x => $"<tr><td>{x.Product?.Name}</td><td>{x.OldQuantity}</td><td>{x.NewQuantity}</td><td>{x.QuantityDifference}</td><td>{x.Reason}</td></tr>"));
        var html = $$"""<html><head><title>{{adjustment.AdjustmentNumber}}</title><style>body{font-family:Arial,sans-serif;margin:24px}table{width:100%;border-collapse:collapse}td,th{border:1px solid #bbb;padding:6px;text-align:left}</style></head><body><h2>Stock Adjustment Voucher</h2><p><strong>No:</strong> {{adjustment.AdjustmentNumber}}<br><strong>Date:</strong> {{adjustment.AdjustmentDate:dd-MMM-yyyy}}<br><strong>Type:</strong> {{adjustment.AdjustmentType}}<br><strong>Status:</strong> {{adjustment.Status}}</p><table><thead><tr><th>Product</th><th>Old</th><th>New</th><th>Diff</th><th>Reason</th></tr></thead><tbody>{{rows}}</tbody></table></body></html>""";
        return new AdjustmentVoucherDto(adjustment.AdjustmentNumber, html);
    }

    private static InventoryAdjustmentDto ToAdjustmentDto(StockAdjustment adjustment)
        => new(adjustment.Id, adjustment.ShopId, adjustment.AdjustmentNumber, adjustment.AdjustmentDate, adjustment.AdjustmentType, adjustment.Status, adjustment.Reason, adjustment.ReferenceNumber, adjustment.IsApproved, adjustment.Items.Sum(x => x.QuantityDifference));
}

public sealed class StockLedgerQueryHandler : IRequestHandler<StockLedgerQuery, IReadOnlyList<StockLedgerRowDto>>
{
    private readonly IRepository<InventoryMovement> _movements;

    public StockLedgerQueryHandler(IRepository<InventoryMovement> movements) => _movements = movements;

    public async Task<IReadOnlyList<StockLedgerRowDto>> Handle(StockLedgerQuery request, CancellationToken cancellationToken)
    {
        var query = _movements.Query().Where(x => x.ShopId == request.ShopId && x.ProductId == request.ProductId);
        if (request.ProductVariantId.HasValue) query = query.Where(x => x.ProductVariantId == request.ProductVariantId.Value);
        if (request.From.HasValue) query = query.Where(x => x.CreatedAt >= request.From.Value);
        if (request.To.HasValue) query = query.Where(x => x.CreatedAt <= request.To.Value);
        if (request.MovementType.HasValue) query = query.Where(x => x.MovementType == request.MovementType.Value);
        var rows = await query.OrderBy(x => x.CreatedAt).ToListAsync(cancellationToken);
        decimal balance = 0;
        return rows.Select(row =>
        {
            balance += row.Quantity;
            return new StockLedgerRowDto(row.CreatedAt, row.MovementType.ToString(), row.Quantity >= 0 ? "In" : "Out", row.Quantity > 0 ? row.Quantity : 0, row.Quantity < 0 ? Math.Abs(row.Quantity) : 0, balance, row.ReferenceType, row.Notes);
        }).ToList();
    }
}

public sealed class UnitConversionHandlers :
    IRequestHandler<UnitConversionsQuery, IReadOnlyList<UnitConversionDto>>,
    IRequestHandler<SaveUnitConversionCommand, UnitConversionDto>
{
    private readonly IRepository<UnitConversion> _conversions;
    private readonly IUnitOfWork _unitOfWork;

    public UnitConversionHandlers(IRepository<UnitConversion> conversions, IUnitOfWork unitOfWork)
    {
        _conversions = conversions;
        _unitOfWork = unitOfWork;
    }

    public async Task<IReadOnlyList<UnitConversionDto>> Handle(UnitConversionsQuery request, CancellationToken cancellationToken)
        => await _conversions.Query().Include(x => x.BaseUnit).Include(x => x.AlternateUnit).Where(x => x.ShopId == request.ShopId).OrderBy(x => x.BaseUnit!.Name)
            .Select(x => new UnitConversionDto(x.Id, x.ShopId, x.BaseUnitId, x.BaseUnit!.Name, x.AlternateUnitId, x.AlternateUnit!.Name, x.Factor, x.IsActive)).ToListAsync(cancellationToken);

    public async Task<UnitConversionDto> Handle(SaveUnitConversionCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        var conversion = request.Id.HasValue
            ? await _conversions.Query().Include(x => x.BaseUnit).Include(x => x.AlternateUnit).FirstOrDefaultAsync(x => x.Id == request.Id.Value, cancellationToken) ?? throw new KeyNotFoundException("Unit conversion not found.")
            : new UnitConversion { ShopId = request.ShopId };
        conversion.BaseUnitId = request.BaseUnitId;
        conversion.AlternateUnitId = request.AlternateUnitId;
        conversion.Factor = request.Factor;
        conversion.IsActive = request.IsActive;
        if (!request.Id.HasValue) await _conversions.AddAsync(conversion, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return new UnitConversionDto(conversion.Id, conversion.ShopId, conversion.BaseUnitId, conversion.BaseUnit?.Name ?? string.Empty, conversion.AlternateUnitId, conversion.AlternateUnit?.Name ?? string.Empty, conversion.Factor, conversion.IsActive);
    }
}

public sealed class InventoryAlertsQueryHandler : IRequestHandler<InventoryAlertsQuery, IReadOnlyList<InventoryAlertDto>>
{
    private readonly IRepository<Notification> _notifications;
    public InventoryAlertsQueryHandler(IRepository<Notification> notifications) => _notifications = notifications;

    public async Task<IReadOnlyList<InventoryAlertDto>> Handle(InventoryAlertsQuery request, CancellationToken cancellationToken)
        => await _notifications.Query().Where(x => x.ShopId == request.ShopId).OrderByDescending(x => x.CreatedAt).Take(50)
            .Select(x => new InventoryAlertDto(x.Id, x.Severity, x.Title, x.Message, x.IsRead, x.CreatedAt)).ToListAsync(cancellationToken);
}

internal static class InventoryMapper
{
    public static InventoryProductDetailDto ToProductDetail(Product product, decimal openingStock)
        => new(product.Id, product.ShopId, product.Name, product.Sku, product.Barcode, product.CategoryId, product.Category?.ParentCategoryId, product.SubCategory, product.Brand, product.HsnSacCode, product.UnitOfMeasureId, product.TaxSlabId, product.CostPrice, product.SellingPrice, product.Mrp, product.WholesalePrice, product.LowStockThreshold, product.MaxStockThreshold, openingStock, product.ReorderQuantity, product.IsTaxInclusive, product.IsStockTracked, product.ExpiryTracking, product.BatchTracking, product.RequiresPrescription, product.Composition, product.Manufacturer, product.FoodType, product.PreparationTimeMinutes, product.RecipeCost, product.PortionSize, product.ImageUrl, product.IsActive, product.IsFeatured,
            product.Variants.Select(x => new InventoryVariantDto(x.Id, x.VariantName, x.Sku, x.Size, x.Color, x.CostPrice, x.SellingPrice, x.Mrp, x.IsActive)).ToList());

    public static SupplierDetailDto ToSupplierDetail(Supplier supplier)
        => new(supplier.Id, supplier.ShopId, supplier.Name, supplier.ContactPerson, supplier.Phone, supplier.Email, supplier.TaxRegistrationNumber, supplier.Pan, supplier.Address, supplier.BankDetails, supplier.CreditDays, supplier.PaymentTerms, supplier.OpeningBalance, supplier.OutstandingBalance);
}

internal static class InventoryImage
{
    public static string? Normalize(string? imageDataUrl)
    {
        if (string.IsNullOrWhiteSpace(imageDataUrl)) return null;
        var value = imageDataUrl.Trim();
        var comma = value.IndexOf(',');
        if (comma >= 0)
        {
            var base64Length = value.Length - comma - 1;
            var estimatedBytes = base64Length * 3 / 4;
            if (estimatedBytes > 200 * 1024) throw new InvalidOperationException("Product image must be compressed to 200KB or less.");
        }
        return value;
    }
}
