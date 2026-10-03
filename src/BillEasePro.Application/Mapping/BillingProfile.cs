using AutoMapper;
using BillEasePro.Application.Dtos;
using BillEasePro.Domain.Entities;

namespace BillEasePro.Application.Mapping;

public sealed class BillingProfile : Profile
{
    public BillingProfile()
    {
        CreateMap<Shop, ShopDto>().ReverseMap();
        CreateMap<AppUser, UserDto>();
        CreateMap<UserDto, AppUser>()
            .ForMember(dest => dest.PasswordHash, opt => opt.Ignore())
            .ForMember(dest => dest.TwoFactorSecret, opt => opt.Ignore())
            .ForMember(dest => dest.RefreshTokens, opt => opt.Ignore())
            .ForMember(dest => dest.Shop, opt => opt.Ignore());
        CreateMap<Category, CategoryDto>().ReverseMap();
        CreateMap<UnitOfMeasure, UnitOfMeasureDto>().ReverseMap();
        CreateMap<TaxSlab, TaxSlabDto>().ReverseMap();
        CreateMap<DiscountType, DiscountTypeDto>().ReverseMap();
        CreateMap<UnitConversion, UnitConversionCoreDto>().ReverseMap();
        CreateMap<Product, ProductDto>().ReverseMap();
        CreateMap<ProductVariant, ProductVariantDto>().ReverseMap();
        CreateMap<InventoryStock, InventoryStockDto>().ReverseMap();
        CreateMap<InventoryMovement, InventoryMovementDto>().ReverseMap();
        CreateMap<InventoryBatch, InventoryBatchCoreDto>().ReverseMap();
        CreateMap<Customer, CustomerDto>().ReverseMap();
        CreateMap<Supplier, SupplierDto>().ReverseMap();
        CreateMap<SupplierLedgerEntry, SupplierLedgerEntryDto>().ReverseMap();
        CreateMap<Coupon, CouponDto>().ReverseMap();
        CreateMap<SalesInvoice, SalesInvoiceDto>().ReverseMap();
        CreateMap<SalesInvoiceItem, SalesInvoiceItemDto>().ReverseMap();
        CreateMap<Payment, PaymentDto>().ReverseMap();
        CreateMap<PurchaseOrder, PurchaseOrderCoreDto>().ReverseMap();
        CreateMap<PurchaseOrderItem, PurchaseOrderItemCoreDto>().ReverseMap();
        CreateMap<PurchaseInvoice, PurchaseInvoiceDto>().ReverseMap();
        CreateMap<PurchaseInvoiceItem, PurchaseInvoiceItemDto>().ReverseMap();
        CreateMap<GoodsReceiptNote, GoodsReceiptNoteDto>().ReverseMap();
        CreateMap<GoodsReceiptNoteItem, GoodsReceiptNoteItemDto>().ReverseMap();
        CreateMap<SalesReturn, SalesReturnDto>().ReverseMap();
        CreateMap<SalesReturnItem, SalesReturnItemDto>().ReverseMap();
        CreateMap<PurchaseReturn, PurchaseReturnDto>().ReverseMap();
        CreateMap<PurchaseReturnItem, PurchaseReturnItemDto>().ReverseMap();
        CreateMap<Notification, NotificationDto>().ReverseMap();
        CreateMap<ExpenseCategory, ExpenseCategoryDto>().ReverseMap();
        CreateMap<Expense, ExpenseDto>().ReverseMap();
        CreateMap<StockAdjustment, StockAdjustmentDto>().ReverseMap();
        CreateMap<StockAdjustmentItem, StockAdjustmentItemDto>().ReverseMap();
    }
}
