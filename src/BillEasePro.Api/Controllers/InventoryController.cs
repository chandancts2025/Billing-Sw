using Asp.Versioning;
using BillEasePro.Application.Dtos;
using BillEasePro.Application.Features.Inventory;
using BillEasePro.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BillEasePro.Api.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Authorize(Policy = "OperatorOrAbove")]
[Route("api/v{version:apiVersion}/inventory")]
public sealed class InventoryController : ControllerBase
{
    private readonly IMediator _mediator;

    public InventoryController(IMediator mediator) => _mediator = mediator;

    [HttpGet("lookup")]
    public Task<InventoryLookupDto> Lookup(Guid shopId, CancellationToken cancellationToken)
        => _mediator.Send(new InventoryLookupQuery(shopId), cancellationToken);

    [HttpGet("products")]
    public Task<IReadOnlyList<InventoryProductListItemDto>> Products(Guid shopId, string? search, CancellationToken cancellationToken)
        => _mediator.Send(new InventoryProductsQuery(shopId, search), cancellationToken);

    [HttpGet("products/{id:guid}")]
    public Task<InventoryProductDetailDto> Product(Guid id, CancellationToken cancellationToken)
        => _mediator.Send(new InventoryProductDetailQuery(id), cancellationToken);

    [HttpPost("products")]
    [Authorize(Policy = "AdminOnly")]
    public Task<InventoryProductDetailDto> SaveProduct(SaveProductRequest request, CancellationToken cancellationToken)
        => _mediator.Send(new SaveInventoryProductCommand(request), cancellationToken);

    [HttpGet("categories/tree")]
    public Task<IReadOnlyList<CategoryTreeNodeDto>> CategoryTree(Guid shopId, CancellationToken cancellationToken)
        => _mediator.Send(new CategoryTreeQuery(shopId), cancellationToken);

    [HttpPost("categories")]
    [Authorize(Policy = "AdminOnly")]
    public Task<CategoryDto> SaveCategory(SaveCategoryRequest request, CancellationToken cancellationToken)
        => _mediator.Send(new SaveInventoryCategoryCommand(request), cancellationToken);

    [HttpGet("dashboard")]
    public Task<InventoryDashboardDto> Dashboard(Guid shopId, CancellationToken cancellationToken)
        => _mediator.Send(new InventoryDashboardQuery(shopId), cancellationToken);

    [HttpGet("batches")]
    public Task<IReadOnlyList<InventoryBatchDto>> Batches(Guid shopId, Guid? productId, bool expiringOnly, CancellationToken cancellationToken)
        => _mediator.Send(new InventoryBatchesQuery(shopId, productId, expiringOnly), cancellationToken);

    [HttpPost("batches/quarantine-expired")]
    [Authorize(Policy = "AdminOnly")]
    public Task<int> QuarantineExpired(Guid shopId, CancellationToken cancellationToken)
        => _mediator.Send(new QuarantineExpiredBatchesCommand(shopId), cancellationToken);

    [HttpGet("purchases/orders")]
    public Task<IReadOnlyList<PurchaseOrderDto>> PurchaseOrders(Guid shopId, CancellationToken cancellationToken)
        => _mediator.Send(new PurchaseOrdersQuery(shopId), cancellationToken);

    [HttpPost("purchases/orders")]
    [Authorize(Policy = "AdminOnly")]
    public Task<PurchaseOrderDto> CreatePurchaseOrder(CreatePurchaseOrderRequest request, CancellationToken cancellationToken)
        => _mediator.Send(new CreatePurchaseOrderCommand(request), cancellationToken);

    [HttpPost("purchases/grn")]
    [Authorize(Policy = "AdminOnly")]
    public Task<GrnDto> CreateGrn(CreateGrnRequest request, CancellationToken cancellationToken)
        => _mediator.Send(new CreateGrnCommand(request), cancellationToken);

    [HttpPost("purchases/grn/{id:guid}/approve")]
    [Authorize(Policy = "AdminOnly")]
    public Task<GrnDto> ApproveGrn(Guid id, CancellationToken cancellationToken)
        => _mediator.Send(new ApproveGrnCommand(id), cancellationToken);

    [HttpPost("purchases/returns")]
    [Authorize(Policy = "AdminOnly")]
    public Task<PurchaseReturnDto> PurchaseReturn(PurchaseReturnRequest request, CancellationToken cancellationToken)
        => _mediator.Send(new CreatePurchaseReturnCommand(request), cancellationToken);

    [HttpGet("suppliers")]
    public Task<IReadOnlyList<SupplierSummaryDto>> Suppliers(Guid shopId, CancellationToken cancellationToken)
        => _mediator.Send(new SuppliersQuery(shopId), cancellationToken);

    [HttpPost("suppliers")]
    [Authorize(Policy = "AdminOnly")]
    public Task<SupplierDetailDto> SaveSupplier(SaveSupplierRequest request, CancellationToken cancellationToken)
        => _mediator.Send(new SaveSupplierCommand(request), cancellationToken);

    [HttpGet("suppliers/{id:guid}/ledger")]
    public Task<IReadOnlyList<SupplierLedgerRowDto>> SupplierLedger(Guid id, CancellationToken cancellationToken)
        => _mediator.Send(new SupplierLedgerQuery(id), cancellationToken);

    [HttpGet("suppliers/analysis")]
    public Task<IReadOnlyList<SupplierAnalysisDto>> SupplierAnalysis(Guid shopId, CancellationToken cancellationToken)
        => _mediator.Send(new SupplierAnalysisQuery(shopId), cancellationToken);

    [HttpGet("adjustments")]
    public Task<IReadOnlyList<InventoryAdjustmentDto>> Adjustments(Guid shopId, CancellationToken cancellationToken)
        => _mediator.Send(new InventoryAdjustmentsQuery(shopId), cancellationToken);

    [HttpPost("adjustments")]
    public Task<InventoryAdjustmentDto> CreateAdjustment(CreateInventoryAdjustmentRequest request, CancellationToken cancellationToken)
        => _mediator.Send(new CreateInventoryAdjustmentCommand(request), cancellationToken);

    [HttpPost("adjustments/{id:guid}/approve")]
    [Authorize(Policy = "AdminOnly")]
    public Task<InventoryAdjustmentDto> ApproveAdjustment(Guid id, Guid? approvedByUserId, CancellationToken cancellationToken)
        => _mediator.Send(new ApproveInventoryAdjustmentCommand(id, approvedByUserId), cancellationToken);

    [HttpGet("adjustments/{id:guid}/voucher")]
    public Task<AdjustmentVoucherDto> AdjustmentVoucher(Guid id, CancellationToken cancellationToken)
        => _mediator.Send(new AdjustmentVoucherQuery(id), cancellationToken);

    [HttpGet("stock-ledger")]
    public Task<IReadOnlyList<StockLedgerRowDto>> StockLedger(Guid shopId, Guid productId, Guid? productVariantId, DateTimeOffset? from, DateTimeOffset? to, StockMovementType? movementType, CancellationToken cancellationToken)
        => _mediator.Send(new StockLedgerQuery(shopId, productId, productVariantId, from, to, movementType), cancellationToken);

    [HttpGet("unit-conversions")]
    public Task<IReadOnlyList<UnitConversionDto>> UnitConversions(Guid shopId, CancellationToken cancellationToken)
        => _mediator.Send(new UnitConversionsQuery(shopId), cancellationToken);

    [HttpPost("unit-conversions")]
    [Authorize(Policy = "AdminOnly")]
    public Task<UnitConversionDto> SaveUnitConversion(SaveUnitConversionRequest request, CancellationToken cancellationToken)
        => _mediator.Send(new SaveUnitConversionCommand(request), cancellationToken);

    [HttpGet("alerts")]
    public Task<IReadOnlyList<InventoryAlertDto>> Alerts(Guid shopId, CancellationToken cancellationToken)
        => _mediator.Send(new InventoryAlertsQuery(shopId), cancellationToken);
}
