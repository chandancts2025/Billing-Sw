using BillEasePro.Application.Dtos;
using BillEasePro.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Authorization;

namespace BillEasePro.Api.Controllers;

[Authorize(Policy = "SuperAdminOnly")]
public sealed class ShopsController : CrudController<Shop, ShopDto> { public ShopsController(IMediator mediator) : base(mediator) { } }

[Authorize(Policy = "AdminOnly")]
public sealed class UsersController : CrudController<AppUser, UserDto> { public UsersController(IMediator mediator) : base(mediator) { } }

public sealed class CategoriesController : CrudController<Category, CategoryDto> { public CategoriesController(IMediator mediator) : base(mediator) { } }
public sealed class UnitsController : CrudController<UnitOfMeasure, UnitOfMeasureDto> { public UnitsController(IMediator mediator) : base(mediator) { } }
public sealed class TaxSlabsController : CrudController<TaxSlab, TaxSlabDto> { public TaxSlabsController(IMediator mediator) : base(mediator) { } }
public sealed class DiscountTypesController : CrudController<DiscountType, DiscountTypeDto> { public DiscountTypesController(IMediator mediator) : base(mediator) { } }
public sealed class ProductsController : CrudController<Product, ProductDto> { public ProductsController(IMediator mediator) : base(mediator) { } }
public sealed class ProductVariantsController : CrudController<ProductVariant, ProductVariantDto> { public ProductVariantsController(IMediator mediator) : base(mediator) { } }
public sealed class InventoryStocksController : CrudController<InventoryStock, InventoryStockDto> { public InventoryStocksController(IMediator mediator) : base(mediator) { } }
public sealed class InventoryMovementsController : CrudController<InventoryMovement, InventoryMovementDto> { public InventoryMovementsController(IMediator mediator) : base(mediator) { } }
public sealed class CustomersController : CrudController<Customer, CustomerDto> { public CustomersController(IMediator mediator) : base(mediator) { } }
public sealed class SuppliersController : CrudController<Supplier, SupplierDto> { public SuppliersController(IMediator mediator) : base(mediator) { } }
public sealed class CouponsController : CrudController<Coupon, CouponDto> { public CouponsController(IMediator mediator) : base(mediator) { } }
public sealed class SalesInvoicesController : CrudController<SalesInvoice, SalesInvoiceDto> { public SalesInvoicesController(IMediator mediator) : base(mediator) { } }
public sealed class SalesInvoiceItemsController : CrudController<SalesInvoiceItem, SalesInvoiceItemDto> { public SalesInvoiceItemsController(IMediator mediator) : base(mediator) { } }
public sealed class PaymentsController : CrudController<Payment, PaymentDto> { public PaymentsController(IMediator mediator) : base(mediator) { } }
public sealed class PurchaseInvoicesController : CrudController<PurchaseInvoice, PurchaseInvoiceDto> { public PurchaseInvoicesController(IMediator mediator) : base(mediator) { } }
public sealed class PurchaseInvoiceItemsController : CrudController<PurchaseInvoiceItem, PurchaseInvoiceItemDto> { public PurchaseInvoiceItemsController(IMediator mediator) : base(mediator) { } }
public sealed class GoodsReceiptNotesController : CrudController<GoodsReceiptNote, GoodsReceiptNoteDto> { public GoodsReceiptNotesController(IMediator mediator) : base(mediator) { } }
public sealed class GoodsReceiptNoteItemsController : CrudController<GoodsReceiptNoteItem, GoodsReceiptNoteItemDto> { public GoodsReceiptNoteItemsController(IMediator mediator) : base(mediator) { } }
public sealed class SalesReturnsController : CrudController<SalesReturn, SalesReturnDto> { public SalesReturnsController(IMediator mediator) : base(mediator) { } }
public sealed class SalesReturnItemsController : CrudController<SalesReturnItem, SalesReturnItemDto> { public SalesReturnItemsController(IMediator mediator) : base(mediator) { } }
public sealed class PurchaseReturnsController : CrudController<PurchaseReturn, PurchaseReturnDto> { public PurchaseReturnsController(IMediator mediator) : base(mediator) { } }
public sealed class PurchaseReturnItemsController : CrudController<PurchaseReturnItem, PurchaseReturnItemDto> { public PurchaseReturnItemsController(IMediator mediator) : base(mediator) { } }
public sealed class NotificationsController : CrudController<Notification, NotificationDto> { public NotificationsController(IMediator mediator) : base(mediator) { } }

public sealed class ExpenseCategoriesController : CrudController<ExpenseCategory, ExpenseCategoryDto> { public ExpenseCategoriesController(IMediator mediator) : base(mediator) { } }
public sealed class ExpensesController : CrudController<Expense, ExpenseDto> { public ExpensesController(IMediator mediator) : base(mediator) { } }
public sealed class StockAdjustmentsController : CrudController<StockAdjustment, StockAdjustmentDto> { public StockAdjustmentsController(IMediator mediator) : base(mediator) { } }
public sealed class StockAdjustmentItemsController : CrudController<StockAdjustmentItem, StockAdjustmentItemDto> { public StockAdjustmentItemsController(IMediator mediator) : base(mediator) { } }
