using System.Reflection;
using BillEasePro.Application.Validation;
using FluentValidation;
using MediatR;
using BillEasePro.Application.Features.Crud;
using BillEasePro.Domain.Entities;
using BillEasePro.Application.Dtos;
using Microsoft.Extensions.DependencyInjection;

namespace BillEasePro.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        var assembly = Assembly.GetExecutingAssembly();
        services.AddAutoMapper(_ => { }, assembly);
        services.AddValidatorsFromAssembly(assembly);
        services.AddMediatR(configuration => configuration.RegisterServicesFromAssembly(assembly));
        // Explicitly register CRUD handlers for known entity/dto pairs
        // This avoids open-generic registration issues and ensures correct handler resolution.
        // Entities and DTOs

        // Shops
        services.AddTransient(typeof(IRequestHandler<ListEntitiesQuery<Shop, ShopDto>, IReadOnlyList<ShopDto>>), typeof(ListEntitiesQueryHandler<Shop, ShopDto>));
        services.AddTransient(typeof(IRequestHandler<GetEntityByIdQuery<Shop, ShopDto>, ShopDto?>), typeof(GetEntityByIdQueryHandler<Shop, ShopDto>));
        services.AddTransient(typeof(IRequestHandler<CreateEntityCommand<Shop, ShopDto>, ShopDto>), typeof(CreateEntityCommandHandler<Shop, ShopDto>));
        services.AddTransient(typeof(IRequestHandler<UpdateEntityCommand<Shop, ShopDto>, ShopDto?>), typeof(UpdateEntityCommandHandler<Shop, ShopDto>));
        services.AddTransient(typeof(IRequestHandler<DeleteEntityCommand<Shop>, bool>), typeof(DeleteEntityCommandHandler<Shop>));

        // AppUsers
        services.AddTransient(typeof(IRequestHandler<ListEntitiesQuery<AppUser, UserDto>, IReadOnlyList<UserDto>>), typeof(ListEntitiesQueryHandler<AppUser, UserDto>));
        services.AddTransient(typeof(IRequestHandler<GetEntityByIdQuery<AppUser, UserDto>, UserDto?>), typeof(GetEntityByIdQueryHandler<AppUser, UserDto>));
        services.AddTransient(typeof(IRequestHandler<CreateEntityCommand<AppUser, UserDto>, UserDto>), typeof(CreateEntityCommandHandler<AppUser, UserDto>));
        services.AddTransient(typeof(IRequestHandler<UpdateEntityCommand<AppUser, UserDto>, UserDto?>), typeof(UpdateEntityCommandHandler<AppUser, UserDto>));
        services.AddTransient(typeof(IRequestHandler<DeleteEntityCommand<AppUser>, bool>), typeof(DeleteEntityCommandHandler<AppUser>));

        // Categories
        services.AddTransient(typeof(IRequestHandler<ListEntitiesQuery<Category, CategoryDto>, IReadOnlyList<CategoryDto>>), typeof(ListEntitiesQueryHandler<Category, CategoryDto>));
        services.AddTransient(typeof(IRequestHandler<GetEntityByIdQuery<Category, CategoryDto>, CategoryDto?>), typeof(GetEntityByIdQueryHandler<Category, CategoryDto>));
        services.AddTransient(typeof(IRequestHandler<CreateEntityCommand<Category, CategoryDto>, CategoryDto>), typeof(CreateEntityCommandHandler<Category, CategoryDto>));
        services.AddTransient(typeof(IRequestHandler<UpdateEntityCommand<Category, CategoryDto>, CategoryDto?>), typeof(UpdateEntityCommandHandler<Category, CategoryDto>));
        services.AddTransient(typeof(IRequestHandler<DeleteEntityCommand<Category>, bool>), typeof(DeleteEntityCommandHandler<Category>));

        // UnitOfMeasure
        services.AddTransient(typeof(IRequestHandler<ListEntitiesQuery<UnitOfMeasure, UnitOfMeasureDto>, IReadOnlyList<UnitOfMeasureDto>>), typeof(ListEntitiesQueryHandler<UnitOfMeasure, UnitOfMeasureDto>));
        services.AddTransient(typeof(IRequestHandler<GetEntityByIdQuery<UnitOfMeasure, UnitOfMeasureDto>, UnitOfMeasureDto?>), typeof(GetEntityByIdQueryHandler<UnitOfMeasure, UnitOfMeasureDto>));
        services.AddTransient(typeof(IRequestHandler<CreateEntityCommand<UnitOfMeasure, UnitOfMeasureDto>, UnitOfMeasureDto>), typeof(CreateEntityCommandHandler<UnitOfMeasure, UnitOfMeasureDto>));
        services.AddTransient(typeof(IRequestHandler<UpdateEntityCommand<UnitOfMeasure, UnitOfMeasureDto>, UnitOfMeasureDto?>), typeof(UpdateEntityCommandHandler<UnitOfMeasure, UnitOfMeasureDto>));
        services.AddTransient(typeof(IRequestHandler<DeleteEntityCommand<UnitOfMeasure>, bool>), typeof(DeleteEntityCommandHandler<UnitOfMeasure>));

        // TaxSlab
        services.AddTransient(typeof(IRequestHandler<ListEntitiesQuery<TaxSlab, TaxSlabDto>, IReadOnlyList<TaxSlabDto>>), typeof(ListEntitiesQueryHandler<TaxSlab, TaxSlabDto>));
        services.AddTransient(typeof(IRequestHandler<GetEntityByIdQuery<TaxSlab, TaxSlabDto>, TaxSlabDto?>), typeof(GetEntityByIdQueryHandler<TaxSlab, TaxSlabDto>));
        services.AddTransient(typeof(IRequestHandler<CreateEntityCommand<TaxSlab, TaxSlabDto>, TaxSlabDto>), typeof(CreateEntityCommandHandler<TaxSlab, TaxSlabDto>));
        services.AddTransient(typeof(IRequestHandler<UpdateEntityCommand<TaxSlab, TaxSlabDto>, TaxSlabDto?>), typeof(UpdateEntityCommandHandler<TaxSlab, TaxSlabDto>));
        services.AddTransient(typeof(IRequestHandler<DeleteEntityCommand<TaxSlab>, bool>), typeof(DeleteEntityCommandHandler<TaxSlab>));

        // DiscountType
        services.AddTransient(typeof(IRequestHandler<ListEntitiesQuery<DiscountType, DiscountTypeDto>, IReadOnlyList<DiscountTypeDto>>), typeof(ListEntitiesQueryHandler<DiscountType, DiscountTypeDto>));
        services.AddTransient(typeof(IRequestHandler<GetEntityByIdQuery<DiscountType, DiscountTypeDto>, DiscountTypeDto?>), typeof(GetEntityByIdQueryHandler<DiscountType, DiscountTypeDto>));
        services.AddTransient(typeof(IRequestHandler<CreateEntityCommand<DiscountType, DiscountTypeDto>, DiscountTypeDto>), typeof(CreateEntityCommandHandler<DiscountType, DiscountTypeDto>));
        services.AddTransient(typeof(IRequestHandler<UpdateEntityCommand<DiscountType, DiscountTypeDto>, DiscountTypeDto?>), typeof(UpdateEntityCommandHandler<DiscountType, DiscountTypeDto>));
        services.AddTransient(typeof(IRequestHandler<DeleteEntityCommand<DiscountType>, bool>), typeof(DeleteEntityCommandHandler<DiscountType>));

        // Product
        services.AddTransient(typeof(IRequestHandler<ListEntitiesQuery<Product, ProductDto>, IReadOnlyList<ProductDto>>), typeof(ListEntitiesQueryHandler<Product, ProductDto>));
        services.AddTransient(typeof(IRequestHandler<GetEntityByIdQuery<Product, ProductDto>, ProductDto?>), typeof(GetEntityByIdQueryHandler<Product, ProductDto>));
        services.AddTransient(typeof(IRequestHandler<CreateEntityCommand<Product, ProductDto>, ProductDto>), typeof(CreateEntityCommandHandler<Product, ProductDto>));
        services.AddTransient(typeof(IRequestHandler<UpdateEntityCommand<Product, ProductDto>, ProductDto?>), typeof(UpdateEntityCommandHandler<Product, ProductDto>));
        services.AddTransient(typeof(IRequestHandler<DeleteEntityCommand<Product>, bool>), typeof(DeleteEntityCommandHandler<Product>));

        // ProductVariant
        services.AddTransient(typeof(IRequestHandler<ListEntitiesQuery<ProductVariant, ProductVariantDto>, IReadOnlyList<ProductVariantDto>>), typeof(ListEntitiesQueryHandler<ProductVariant, ProductVariantDto>));
        services.AddTransient(typeof(IRequestHandler<GetEntityByIdQuery<ProductVariant, ProductVariantDto>, ProductVariantDto?>), typeof(GetEntityByIdQueryHandler<ProductVariant, ProductVariantDto>));
        services.AddTransient(typeof(IRequestHandler<CreateEntityCommand<ProductVariant, ProductVariantDto>, ProductVariantDto>), typeof(CreateEntityCommandHandler<ProductVariant, ProductVariantDto>));
        services.AddTransient(typeof(IRequestHandler<UpdateEntityCommand<ProductVariant, ProductVariantDto>, ProductVariantDto?>), typeof(UpdateEntityCommandHandler<ProductVariant, ProductVariantDto>));
        services.AddTransient(typeof(IRequestHandler<DeleteEntityCommand<ProductVariant>, bool>), typeof(DeleteEntityCommandHandler<ProductVariant>));

        // InventoryStock
        services.AddTransient(typeof(IRequestHandler<ListEntitiesQuery<InventoryStock, InventoryStockDto>, IReadOnlyList<InventoryStockDto>>), typeof(ListEntitiesQueryHandler<InventoryStock, InventoryStockDto>));
        services.AddTransient(typeof(IRequestHandler<GetEntityByIdQuery<InventoryStock, InventoryStockDto>, InventoryStockDto?>), typeof(GetEntityByIdQueryHandler<InventoryStock, InventoryStockDto>));
        services.AddTransient(typeof(IRequestHandler<CreateEntityCommand<InventoryStock, InventoryStockDto>, InventoryStockDto>), typeof(CreateEntityCommandHandler<InventoryStock, InventoryStockDto>));
        services.AddTransient(typeof(IRequestHandler<UpdateEntityCommand<InventoryStock, InventoryStockDto>, InventoryStockDto?>), typeof(UpdateEntityCommandHandler<InventoryStock, InventoryStockDto>));
        services.AddTransient(typeof(IRequestHandler<DeleteEntityCommand<InventoryStock>, bool>), typeof(DeleteEntityCommandHandler<InventoryStock>));

        // InventoryMovement
        services.AddTransient(typeof(IRequestHandler<ListEntitiesQuery<InventoryMovement, InventoryMovementDto>, IReadOnlyList<InventoryMovementDto>>), typeof(ListEntitiesQueryHandler<InventoryMovement, InventoryMovementDto>));
        services.AddTransient(typeof(IRequestHandler<GetEntityByIdQuery<InventoryMovement, InventoryMovementDto>, InventoryMovementDto?>), typeof(GetEntityByIdQueryHandler<InventoryMovement, InventoryMovementDto>));
        services.AddTransient(typeof(IRequestHandler<CreateEntityCommand<InventoryMovement, InventoryMovementDto>, InventoryMovementDto>), typeof(CreateEntityCommandHandler<InventoryMovement, InventoryMovementDto>));
        services.AddTransient(typeof(IRequestHandler<UpdateEntityCommand<InventoryMovement, InventoryMovementDto>, InventoryMovementDto?>), typeof(UpdateEntityCommandHandler<InventoryMovement, InventoryMovementDto>));
        services.AddTransient(typeof(IRequestHandler<DeleteEntityCommand<InventoryMovement>, bool>), typeof(DeleteEntityCommandHandler<InventoryMovement>));

        // Customer
        services.AddTransient(typeof(IRequestHandler<ListEntitiesQuery<Customer, CustomerDto>, IReadOnlyList<CustomerDto>>), typeof(ListEntitiesQueryHandler<Customer, CustomerDto>));
        services.AddTransient(typeof(IRequestHandler<GetEntityByIdQuery<Customer, CustomerDto>, CustomerDto?>), typeof(GetEntityByIdQueryHandler<Customer, CustomerDto>));
        services.AddTransient(typeof(IRequestHandler<CreateEntityCommand<Customer, CustomerDto>, CustomerDto>), typeof(CreateEntityCommandHandler<Customer, CustomerDto>));
        services.AddTransient(typeof(IRequestHandler<UpdateEntityCommand<Customer, CustomerDto>, CustomerDto?>), typeof(UpdateEntityCommandHandler<Customer, CustomerDto>));
        services.AddTransient(typeof(IRequestHandler<DeleteEntityCommand<Customer>, bool>), typeof(DeleteEntityCommandHandler<Customer>));

        // Supplier
        services.AddTransient(typeof(IRequestHandler<ListEntitiesQuery<Supplier, SupplierDto>, IReadOnlyList<SupplierDto>>), typeof(ListEntitiesQueryHandler<Supplier, SupplierDto>));
        services.AddTransient(typeof(IRequestHandler<GetEntityByIdQuery<Supplier, SupplierDto>, SupplierDto?>), typeof(GetEntityByIdQueryHandler<Supplier, SupplierDto>));
        services.AddTransient(typeof(IRequestHandler<CreateEntityCommand<Supplier, SupplierDto>, SupplierDto>), typeof(CreateEntityCommandHandler<Supplier, SupplierDto>));
        services.AddTransient(typeof(IRequestHandler<UpdateEntityCommand<Supplier, SupplierDto>, SupplierDto?>), typeof(UpdateEntityCommandHandler<Supplier, SupplierDto>));
        services.AddTransient(typeof(IRequestHandler<DeleteEntityCommand<Supplier>, bool>), typeof(DeleteEntityCommandHandler<Supplier>));

        // Coupon
        services.AddTransient(typeof(IRequestHandler<ListEntitiesQuery<Coupon, CouponDto>, IReadOnlyList<CouponDto>>), typeof(ListEntitiesQueryHandler<Coupon, CouponDto>));
        services.AddTransient(typeof(IRequestHandler<GetEntityByIdQuery<Coupon, CouponDto>, CouponDto?>), typeof(GetEntityByIdQueryHandler<Coupon, CouponDto>));
        services.AddTransient(typeof(IRequestHandler<CreateEntityCommand<Coupon, CouponDto>, CouponDto>), typeof(CreateEntityCommandHandler<Coupon, CouponDto>));
        services.AddTransient(typeof(IRequestHandler<UpdateEntityCommand<Coupon, CouponDto>, CouponDto?>), typeof(UpdateEntityCommandHandler<Coupon, CouponDto>));
        services.AddTransient(typeof(IRequestHandler<DeleteEntityCommand<Coupon>, bool>), typeof(DeleteEntityCommandHandler<Coupon>));

        // SalesInvoice
        services.AddTransient(typeof(IRequestHandler<ListEntitiesQuery<SalesInvoice, SalesInvoiceDto>, IReadOnlyList<SalesInvoiceDto>>), typeof(ListEntitiesQueryHandler<SalesInvoice, SalesInvoiceDto>));
        services.AddTransient(typeof(IRequestHandler<GetEntityByIdQuery<SalesInvoice, SalesInvoiceDto>, SalesInvoiceDto?>), typeof(GetEntityByIdQueryHandler<SalesInvoice, SalesInvoiceDto>));
        services.AddTransient(typeof(IRequestHandler<CreateEntityCommand<SalesInvoice, SalesInvoiceDto>, SalesInvoiceDto>), typeof(CreateEntityCommandHandler<SalesInvoice, SalesInvoiceDto>));
        services.AddTransient(typeof(IRequestHandler<UpdateEntityCommand<SalesInvoice, SalesInvoiceDto>, SalesInvoiceDto?>), typeof(UpdateEntityCommandHandler<SalesInvoice, SalesInvoiceDto>));
        services.AddTransient(typeof(IRequestHandler<DeleteEntityCommand<SalesInvoice>, bool>), typeof(DeleteEntityCommandHandler<SalesInvoice>));

        // SalesInvoiceItem
        services.AddTransient(typeof(IRequestHandler<ListEntitiesQuery<SalesInvoiceItem, SalesInvoiceItemDto>, IReadOnlyList<SalesInvoiceItemDto>>), typeof(ListEntitiesQueryHandler<SalesInvoiceItem, SalesInvoiceItemDto>));
        services.AddTransient(typeof(IRequestHandler<GetEntityByIdQuery<SalesInvoiceItem, SalesInvoiceItemDto>, SalesInvoiceItemDto?>), typeof(GetEntityByIdQueryHandler<SalesInvoiceItem, SalesInvoiceItemDto>));
        services.AddTransient(typeof(IRequestHandler<CreateEntityCommand<SalesInvoiceItem, SalesInvoiceItemDto>, SalesInvoiceItemDto>), typeof(CreateEntityCommandHandler<SalesInvoiceItem, SalesInvoiceItemDto>));
        services.AddTransient(typeof(IRequestHandler<UpdateEntityCommand<SalesInvoiceItem, SalesInvoiceItemDto>, SalesInvoiceItemDto?>), typeof(UpdateEntityCommandHandler<SalesInvoiceItem, SalesInvoiceItemDto>));
        services.AddTransient(typeof(IRequestHandler<DeleteEntityCommand<SalesInvoiceItem>, bool>), typeof(DeleteEntityCommandHandler<SalesInvoiceItem>));

        // Payment
        services.AddTransient(typeof(IRequestHandler<ListEntitiesQuery<Payment, PaymentDto>, IReadOnlyList<PaymentDto>>), typeof(ListEntitiesQueryHandler<Payment, PaymentDto>));
        services.AddTransient(typeof(IRequestHandler<GetEntityByIdQuery<Payment, PaymentDto>, PaymentDto?>), typeof(GetEntityByIdQueryHandler<Payment, PaymentDto>));
        services.AddTransient(typeof(IRequestHandler<CreateEntityCommand<Payment, PaymentDto>, PaymentDto>), typeof(CreateEntityCommandHandler<Payment, PaymentDto>));
        services.AddTransient(typeof(IRequestHandler<UpdateEntityCommand<Payment, PaymentDto>, PaymentDto?>), typeof(UpdateEntityCommandHandler<Payment, PaymentDto>));
        services.AddTransient(typeof(IRequestHandler<DeleteEntityCommand<Payment>, bool>), typeof(DeleteEntityCommandHandler<Payment>));

        // PurchaseInvoice
        services.AddTransient(typeof(IRequestHandler<ListEntitiesQuery<PurchaseInvoice, PurchaseInvoiceDto>, IReadOnlyList<PurchaseInvoiceDto>>), typeof(ListEntitiesQueryHandler<PurchaseInvoice, PurchaseInvoiceDto>));
        services.AddTransient(typeof(IRequestHandler<GetEntityByIdQuery<PurchaseInvoice, PurchaseInvoiceDto>, PurchaseInvoiceDto?>), typeof(GetEntityByIdQueryHandler<PurchaseInvoice, PurchaseInvoiceDto>));
        services.AddTransient(typeof(IRequestHandler<CreateEntityCommand<PurchaseInvoice, PurchaseInvoiceDto>, PurchaseInvoiceDto>), typeof(CreateEntityCommandHandler<PurchaseInvoice, PurchaseInvoiceDto>));
        services.AddTransient(typeof(IRequestHandler<UpdateEntityCommand<PurchaseInvoice, PurchaseInvoiceDto>, PurchaseInvoiceDto?>), typeof(UpdateEntityCommandHandler<PurchaseInvoice, PurchaseInvoiceDto>));
        services.AddTransient(typeof(IRequestHandler<DeleteEntityCommand<PurchaseInvoice>, bool>), typeof(DeleteEntityCommandHandler<PurchaseInvoice>));

        // PurchaseInvoiceItem
        services.AddTransient(typeof(IRequestHandler<ListEntitiesQuery<PurchaseInvoiceItem, PurchaseInvoiceItemDto>, IReadOnlyList<PurchaseInvoiceItemDto>>), typeof(ListEntitiesQueryHandler<PurchaseInvoiceItem, PurchaseInvoiceItemDto>));
        services.AddTransient(typeof(IRequestHandler<GetEntityByIdQuery<PurchaseInvoiceItem, PurchaseInvoiceItemDto>, PurchaseInvoiceItemDto?>), typeof(GetEntityByIdQueryHandler<PurchaseInvoiceItem, PurchaseInvoiceItemDto>));
        services.AddTransient(typeof(IRequestHandler<CreateEntityCommand<PurchaseInvoiceItem, PurchaseInvoiceItemDto>, PurchaseInvoiceItemDto>), typeof(CreateEntityCommandHandler<PurchaseInvoiceItem, PurchaseInvoiceItemDto>));
        services.AddTransient(typeof(IRequestHandler<UpdateEntityCommand<PurchaseInvoiceItem, PurchaseInvoiceItemDto>, PurchaseInvoiceItemDto?>), typeof(UpdateEntityCommandHandler<PurchaseInvoiceItem, PurchaseInvoiceItemDto>));
        services.AddTransient(typeof(IRequestHandler<DeleteEntityCommand<PurchaseInvoiceItem>, bool>), typeof(DeleteEntityCommandHandler<PurchaseInvoiceItem>));

        // GoodsReceiptNote
        services.AddTransient(typeof(IRequestHandler<ListEntitiesQuery<GoodsReceiptNote, GrnDto>, IReadOnlyList<GrnDto>>), typeof(ListEntitiesQueryHandler<GoodsReceiptNote, GrnDto>));
        services.AddTransient(typeof(IRequestHandler<GetEntityByIdQuery<GoodsReceiptNote, GrnDto>, GrnDto?>), typeof(GetEntityByIdQueryHandler<GoodsReceiptNote, GrnDto>));
        services.AddTransient(typeof(IRequestHandler<CreateEntityCommand<GoodsReceiptNote, GrnDto>, GrnDto>), typeof(CreateEntityCommandHandler<GoodsReceiptNote, GrnDto>));
        services.AddTransient(typeof(IRequestHandler<UpdateEntityCommand<GoodsReceiptNote, GrnDto>, GrnDto?>), typeof(UpdateEntityCommandHandler<GoodsReceiptNote, GrnDto>));
        services.AddTransient(typeof(IRequestHandler<DeleteEntityCommand<GoodsReceiptNote>, bool>), typeof(DeleteEntityCommandHandler<GoodsReceiptNote>));

        // GoodsReceiptNoteItem
        services.AddTransient(typeof(IRequestHandler<ListEntitiesQuery<GoodsReceiptNoteItem, GoodsReceiptNoteItemDto>, IReadOnlyList<GoodsReceiptNoteItemDto>>), typeof(ListEntitiesQueryHandler<GoodsReceiptNoteItem, GoodsReceiptNoteItemDto>));
        services.AddTransient(typeof(IRequestHandler<GetEntityByIdQuery<GoodsReceiptNoteItem, GoodsReceiptNoteItemDto>, GoodsReceiptNoteItemDto?>), typeof(GetEntityByIdQueryHandler<GoodsReceiptNoteItem, GoodsReceiptNoteItemDto>));
        services.AddTransient(typeof(IRequestHandler<CreateEntityCommand<GoodsReceiptNoteItem, GoodsReceiptNoteItemDto>, GoodsReceiptNoteItemDto>), typeof(CreateEntityCommandHandler<GoodsReceiptNoteItem, GoodsReceiptNoteItemDto>));
        services.AddTransient(typeof(IRequestHandler<UpdateEntityCommand<GoodsReceiptNoteItem, GoodsReceiptNoteItemDto>, GoodsReceiptNoteItemDto?>), typeof(UpdateEntityCommandHandler<GoodsReceiptNoteItem, GoodsReceiptNoteItemDto>));
        services.AddTransient(typeof(IRequestHandler<DeleteEntityCommand<GoodsReceiptNoteItem>, bool>), typeof(DeleteEntityCommandHandler<GoodsReceiptNoteItem>));

        // SalesReturn
        services.AddTransient(typeof(IRequestHandler<ListEntitiesQuery<SalesReturn, SalesReturnDto>, IReadOnlyList<SalesReturnDto>>), typeof(ListEntitiesQueryHandler<SalesReturn, SalesReturnDto>));
        services.AddTransient(typeof(IRequestHandler<GetEntityByIdQuery<SalesReturn, SalesReturnDto>, SalesReturnDto?>), typeof(GetEntityByIdQueryHandler<SalesReturn, SalesReturnDto>));
        services.AddTransient(typeof(IRequestHandler<CreateEntityCommand<SalesReturn, SalesReturnDto>, SalesReturnDto>), typeof(CreateEntityCommandHandler<SalesReturn, SalesReturnDto>));
        services.AddTransient(typeof(IRequestHandler<UpdateEntityCommand<SalesReturn, SalesReturnDto>, SalesReturnDto?>), typeof(UpdateEntityCommandHandler<SalesReturn, SalesReturnDto>));
        services.AddTransient(typeof(IRequestHandler<DeleteEntityCommand<SalesReturn>, bool>), typeof(DeleteEntityCommandHandler<SalesReturn>));

        // SalesReturnItem
        services.AddTransient(typeof(IRequestHandler<ListEntitiesQuery<SalesReturnItem, SalesReturnItemDto>, IReadOnlyList<SalesReturnItemDto>>), typeof(ListEntitiesQueryHandler<SalesReturnItem, SalesReturnItemDto>));
        services.AddTransient(typeof(IRequestHandler<GetEntityByIdQuery<SalesReturnItem, SalesReturnItemDto>, SalesReturnItemDto?>), typeof(GetEntityByIdQueryHandler<SalesReturnItem, SalesReturnItemDto>));
        services.AddTransient(typeof(IRequestHandler<CreateEntityCommand<SalesReturnItem, SalesReturnItemDto>, SalesReturnItemDto>), typeof(CreateEntityCommandHandler<SalesReturnItem, SalesReturnItemDto>));
        services.AddTransient(typeof(IRequestHandler<UpdateEntityCommand<SalesReturnItem, SalesReturnItemDto>, SalesReturnItemDto?>), typeof(UpdateEntityCommandHandler<SalesReturnItem, SalesReturnItemDto>));
        services.AddTransient(typeof(IRequestHandler<DeleteEntityCommand<SalesReturnItem>, bool>), typeof(DeleteEntityCommandHandler<SalesReturnItem>));

        // PurchaseReturn
        services.AddTransient(typeof(IRequestHandler<ListEntitiesQuery<PurchaseReturn, PurchaseReturnDto>, IReadOnlyList<PurchaseReturnDto>>), typeof(ListEntitiesQueryHandler<PurchaseReturn, PurchaseReturnDto>));
        services.AddTransient(typeof(IRequestHandler<GetEntityByIdQuery<PurchaseReturn, PurchaseReturnDto>, PurchaseReturnDto?>), typeof(GetEntityByIdQueryHandler<PurchaseReturn, PurchaseReturnDto>));
        services.AddTransient(typeof(IRequestHandler<CreateEntityCommand<PurchaseReturn, PurchaseReturnDto>, PurchaseReturnDto>), typeof(CreateEntityCommandHandler<PurchaseReturn, PurchaseReturnDto>));
        services.AddTransient(typeof(IRequestHandler<UpdateEntityCommand<PurchaseReturn, PurchaseReturnDto>, PurchaseReturnDto?>), typeof(UpdateEntityCommandHandler<PurchaseReturn, PurchaseReturnDto>));
        services.AddTransient(typeof(IRequestHandler<DeleteEntityCommand<PurchaseReturn>, bool>), typeof(DeleteEntityCommandHandler<PurchaseReturn>));

        // PurchaseReturnItem
        services.AddTransient(typeof(IRequestHandler<ListEntitiesQuery<PurchaseReturnItem, PurchaseReturnItemDto>, IReadOnlyList<PurchaseReturnItemDto>>), typeof(ListEntitiesQueryHandler<PurchaseReturnItem, PurchaseReturnItemDto>));
        services.AddTransient(typeof(IRequestHandler<GetEntityByIdQuery<PurchaseReturnItem, PurchaseReturnItemDto>, PurchaseReturnItemDto?>), typeof(GetEntityByIdQueryHandler<PurchaseReturnItem, PurchaseReturnItemDto>));
        services.AddTransient(typeof(IRequestHandler<CreateEntityCommand<PurchaseReturnItem, PurchaseReturnItemDto>, PurchaseReturnItemDto>), typeof(CreateEntityCommandHandler<PurchaseReturnItem, PurchaseReturnItemDto>));
        services.AddTransient(typeof(IRequestHandler<UpdateEntityCommand<PurchaseReturnItem, PurchaseReturnItemDto>, PurchaseReturnItemDto?>), typeof(UpdateEntityCommandHandler<PurchaseReturnItem, PurchaseReturnItemDto>));
        services.AddTransient(typeof(IRequestHandler<DeleteEntityCommand<PurchaseReturnItem>, bool>), typeof(DeleteEntityCommandHandler<PurchaseReturnItem>));

        // Notification
        services.AddTransient(typeof(IRequestHandler<ListEntitiesQuery<Notification, NotificationDto>, IReadOnlyList<NotificationDto>>), typeof(ListEntitiesQueryHandler<Notification, NotificationDto>));
        services.AddTransient(typeof(IRequestHandler<GetEntityByIdQuery<Notification, NotificationDto>, NotificationDto?>), typeof(GetEntityByIdQueryHandler<Notification, NotificationDto>));
        services.AddTransient(typeof(IRequestHandler<CreateEntityCommand<Notification, NotificationDto>, NotificationDto>), typeof(CreateEntityCommandHandler<Notification, NotificationDto>));
        services.AddTransient(typeof(IRequestHandler<UpdateEntityCommand<Notification, NotificationDto>, NotificationDto?>), typeof(UpdateEntityCommandHandler<Notification, NotificationDto>));
        services.AddTransient(typeof(IRequestHandler<DeleteEntityCommand<Notification>, bool>), typeof(DeleteEntityCommandHandler<Notification>));

        // ExpenseCategory
        services.AddTransient(typeof(IRequestHandler<ListEntitiesQuery<ExpenseCategory, ExpenseCategoryDto>, IReadOnlyList<ExpenseCategoryDto>>), typeof(ListEntitiesQueryHandler<ExpenseCategory, ExpenseCategoryDto>));
        services.AddTransient(typeof(IRequestHandler<GetEntityByIdQuery<ExpenseCategory, ExpenseCategoryDto>, ExpenseCategoryDto?>), typeof(GetEntityByIdQueryHandler<ExpenseCategory, ExpenseCategoryDto>));
        services.AddTransient(typeof(IRequestHandler<CreateEntityCommand<ExpenseCategory, ExpenseCategoryDto>, ExpenseCategoryDto>), typeof(CreateEntityCommandHandler<ExpenseCategory, ExpenseCategoryDto>));
        services.AddTransient(typeof(IRequestHandler<UpdateEntityCommand<ExpenseCategory, ExpenseCategoryDto>, ExpenseCategoryDto?>), typeof(UpdateEntityCommandHandler<ExpenseCategory, ExpenseCategoryDto>));
        services.AddTransient(typeof(IRequestHandler<DeleteEntityCommand<ExpenseCategory>, bool>), typeof(DeleteEntityCommandHandler<ExpenseCategory>));

        // Expense
        services.AddTransient(typeof(IRequestHandler<ListEntitiesQuery<Expense, ExpenseDto>, IReadOnlyList<ExpenseDto>>), typeof(ListEntitiesQueryHandler<Expense, ExpenseDto>));
        services.AddTransient(typeof(IRequestHandler<GetEntityByIdQuery<Expense, ExpenseDto>, ExpenseDto?>), typeof(GetEntityByIdQueryHandler<Expense, ExpenseDto>));
        services.AddTransient(typeof(IRequestHandler<CreateEntityCommand<Expense, ExpenseDto>, ExpenseDto>), typeof(CreateEntityCommandHandler<Expense, ExpenseDto>));
        services.AddTransient(typeof(IRequestHandler<UpdateEntityCommand<Expense, ExpenseDto>, ExpenseDto?>), typeof(UpdateEntityCommandHandler<Expense, ExpenseDto>));
        services.AddTransient(typeof(IRequestHandler<DeleteEntityCommand<Expense>, bool>), typeof(DeleteEntityCommandHandler<Expense>));

        // StockAdjustment
        services.AddTransient(typeof(IRequestHandler<ListEntitiesQuery<StockAdjustment, StockAdjustmentDto>, IReadOnlyList<StockAdjustmentDto>>), typeof(ListEntitiesQueryHandler<StockAdjustment, StockAdjustmentDto>));
        services.AddTransient(typeof(IRequestHandler<GetEntityByIdQuery<StockAdjustment, StockAdjustmentDto>, StockAdjustmentDto?>), typeof(GetEntityByIdQueryHandler<StockAdjustment, StockAdjustmentDto>));
        services.AddTransient(typeof(IRequestHandler<CreateEntityCommand<StockAdjustment, StockAdjustmentDto>, StockAdjustmentDto>), typeof(CreateEntityCommandHandler<StockAdjustment, StockAdjustmentDto>));
        services.AddTransient(typeof(IRequestHandler<UpdateEntityCommand<StockAdjustment, StockAdjustmentDto>, StockAdjustmentDto?>), typeof(UpdateEntityCommandHandler<StockAdjustment, StockAdjustmentDto>));
        services.AddTransient(typeof(IRequestHandler<DeleteEntityCommand<StockAdjustment>, bool>), typeof(DeleteEntityCommandHandler<StockAdjustment>));

        // StockAdjustmentItem
        services.AddTransient(typeof(IRequestHandler<ListEntitiesQuery<StockAdjustmentItem, StockAdjustmentItemDto>, IReadOnlyList<StockAdjustmentItemDto>>), typeof(ListEntitiesQueryHandler<StockAdjustmentItem, StockAdjustmentItemDto>));
        services.AddTransient(typeof(IRequestHandler<GetEntityByIdQuery<StockAdjustmentItem, StockAdjustmentItemDto>, StockAdjustmentItemDto?>), typeof(GetEntityByIdQueryHandler<StockAdjustmentItem, StockAdjustmentItemDto>));
        services.AddTransient(typeof(IRequestHandler<CreateEntityCommand<StockAdjustmentItem, StockAdjustmentItemDto>, StockAdjustmentItemDto>), typeof(CreateEntityCommandHandler<StockAdjustmentItem, StockAdjustmentItemDto>));
        services.AddTransient(typeof(IRequestHandler<UpdateEntityCommand<StockAdjustmentItem, StockAdjustmentItemDto>, StockAdjustmentItemDto?>), typeof(UpdateEntityCommandHandler<StockAdjustmentItem, StockAdjustmentItemDto>));
        services.AddTransient(typeof(IRequestHandler<DeleteEntityCommand<StockAdjustmentItem>, bool>), typeof(DeleteEntityCommandHandler<StockAdjustmentItem>));
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
        return services;
    }
}
