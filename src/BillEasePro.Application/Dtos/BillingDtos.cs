using BillEasePro.Domain.Enums;

namespace BillEasePro.Application.Dtos;

public sealed record CreateSaleInvoiceRequest(
    Guid ShopId,
    Guid? CustomerId,
    string? WalkInCustomerName,
    IReadOnlyList<CreateSaleInvoiceItemRequest> Items,
    DiscountValueType? BillDiscountType,
    decimal BillDiscountValue,
    string? CouponCode,
    IReadOnlyList<CreatePaymentRequest> Payments,
    bool Confirm,
    string? Notes);

public sealed record CreateSaleInvoiceItemRequest(Guid ProductId, Guid? ProductVariantId, decimal Quantity, decimal UnitPrice, DiscountValueType? DiscountType, decimal DiscountValue, decimal TaxRate);
public sealed record CreatePaymentRequest(PaymentMethod Method, decimal Amount, string? ReferenceNumber, string? Details);
public sealed record SaleInvoiceDetailDto(SalesInvoiceDto Invoice, IReadOnlyList<SalesInvoiceItemDto> Items, IReadOnlyList<PaymentDto> Payments, BillTotalsDto Totals, IReadOnlyList<TaxBreakupDto> TaxBreakup);
public sealed record ProductSearchResultDto(Guid ProductId, Guid? ProductVariantId, string Sku, string? Barcode, string Name, string Category, string Unit, decimal StockQuantity, decimal Mrp, decimal SellingPrice, decimal TaxRate, string? HsnSacCode, decimal MaxDiscountPercent, bool RequiresBatchSelection, IReadOnlyList<ProductBatchOptionDto> Batches);
public sealed record ProductBatchOptionDto(Guid ProductVariantId, string BatchName, decimal SellingPrice, DateTimeOffset? ExpiryDate, decimal StockQuantity);
public sealed record CustomerSearchResultDto(Guid Id, string Name, string? Phone, string? Email, decimal LoyaltyPoints, decimal OutstandingBalance, decimal CreditLimit);
public sealed record AddInlineCustomerRequest(Guid ShopId, string Name, string Phone, string? Email);
public sealed record CouponValidationRequest(Guid ShopId, string Code, decimal OrderAmount);
public sealed record CouponValidationDto(bool IsValid, string Code, decimal DiscountAmount, string? Message);
public sealed record BillQuoteRequest(Guid ShopId, Guid? CustomerId, IReadOnlyList<CreateSaleInvoiceItemRequest> Items, DiscountValueType? BillDiscountType, decimal BillDiscountValue, string? CouponCode, bool IsInterstate);
public sealed record BillQuoteDto(BillTotalsDto Totals, IReadOnlyList<TaxBreakupDto> TaxBreakup, CouponValidationDto? Coupon);
public sealed record BillTotalsDto(decimal SubTotal, decimal ItemDiscountTotal, decimal BillDiscountAmount, decimal CouponDiscountAmount, decimal TaxableAmount, decimal TaxTotal, decimal CgstTotal, decimal SgstTotal, decimal IgstTotal, decimal RoundOff, decimal GrandTotal, decimal AmountTendered, decimal ChangeDue);
public sealed record TaxBreakupDto(decimal Rate, decimal TaxableAmount, decimal Cgst, decimal Sgst, decimal Igst, decimal TotalTax);
public sealed record BillHistoryQuery(Guid ShopId, DateTimeOffset? From, DateTimeOffset? To, Guid? CustomerId, PaymentMethod? PaymentMode, SalesInvoiceStatus? Status, string? Search);
public sealed record BillHistoryRowDto(Guid Id, string BillNo, DateTimeOffset Date, string Customer, int ItemsCount, decimal Total, string Payment, SalesInvoiceStatus Status);
public sealed record PrintInvoiceDto(string InvoiceNumber, string A4Html, string Thermal80Html, string Thermal58Html, string WhatsAppUrl, string? CustomerEmail);
public sealed record SalesReturnLookupDto(SalesInvoiceDto Invoice, IReadOnlyList<SalesInvoiceItemDto> Items);
public sealed record CreateSalesReturnRequest(Guid SalesInvoiceId, IReadOnlyList<ReturnSalesInvoiceItemRequest> Items, string Reason, string RefundMode);
public sealed record SalesSummaryDto(decimal TotalSales, decimal TotalTax, decimal TotalDiscount, decimal TotalCollected, int InvoiceCount);
public sealed record ProfitLossDto(decimal Revenue, decimal CostOfGoodsSold, decimal GrossProfit, decimal Expenses, decimal NetProfit);
public sealed record InventoryValuationDto(Guid ProductId, string ProductName, decimal QuantityOnHand, decimal CostPrice, decimal Value);
public sealed record CustomerLedgerDto(Guid CustomerId, string CustomerName, decimal TotalSales, decimal Payments, decimal Outstanding);
public sealed record ConfirmSalesInvoiceRequest(Guid SalesInvoiceId);
public sealed record CancelSalesInvoiceRequest(Guid SalesInvoiceId, string? Reason);
public sealed record ReturnSalesInvoiceRequest(Guid SalesInvoiceId, IReadOnlyList<ReturnSalesInvoiceItemRequest> Items, string? Reason);
public sealed record ReturnSalesInvoiceItemRequest(Guid SalesInvoiceItemId, decimal Quantity, decimal RefundAmount);
public sealed record PrintSalesInvoiceRequest(Guid SalesInvoiceId);
public sealed record PrintSalesInvoiceResponse(string InvoiceNumber, string PrintContent);
