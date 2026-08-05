using BillEasePro.Domain.Common;
using BillEasePro.Domain.Enums;

namespace BillEasePro.Domain.Entities;

public sealed class Coupon : BaseAuditableEntity
{
    public Guid ShopId { get; set; }
    public Shop? Shop { get; set; }
    public string Code { get; set; } = string.Empty;
    public DiscountValueType ValueType { get; set; } = DiscountValueType.Percentage;
    public decimal Value { get; set; }
    public decimal MinOrderAmount { get; set; }
    public decimal? MaxDiscountAmount { get; set; }
    public int? UsageLimit { get; set; }
    public int UsedCount { get; set; }
    public DateTimeOffset ValidFrom { get; set; }
    public DateTimeOffset ValidTo { get; set; }
    public bool IsActive { get; set; } = true;
}

public sealed class SalesInvoice : BaseAuditableEntity
{
    public Guid ShopId { get; set; }
    public Shop? Shop { get; set; }
    public Guid? CustomerId { get; set; }
    public Customer? Customer { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public DateTimeOffset InvoiceDate { get; set; } = DateTimeOffset.UtcNow;
    public SalesInvoiceStatus Status { get; set; } = SalesInvoiceStatus.Draft;
    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending;
    public decimal SubTotal { get; set; }
    public decimal ItemDiscountTotal { get; set; }
    public DiscountValueType? BillDiscountType { get; set; }
    public decimal BillDiscountValue { get; set; }
    public decimal BillDiscountAmount { get; set; }
    public string? CouponCode { get; set; }
    public decimal CouponDiscountAmount { get; set; }
    public decimal DiscountTotal { get; set; }
    public decimal TaxableAmount { get; set; }
    public decimal TaxTotal { get; set; }
    public decimal RoundOff { get; set; }
    public decimal GrandTotal { get; set; }
    public string? Notes { get; set; }
    public ICollection<SalesInvoiceItem> Items { get; set; } = new List<SalesInvoiceItem>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}

public sealed class SalesInvoiceItem : BaseAuditableEntity
{
    public Guid SalesInvoiceId { get; set; }
    public SalesInvoice? SalesInvoice { get; set; }
    public Guid ProductId { get; set; }
    public Product? Product { get; set; }
    public Guid? ProductVariantId { get; set; }
    public ProductVariant? ProductVariant { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TaxRate { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal LineTotal { get; set; }
}

public sealed class Payment : BaseAuditableEntity
{
    public Guid ShopId { get; set; }
    public Shop? Shop { get; set; }
    public Guid? SalesInvoiceId { get; set; }
    public SalesInvoice? SalesInvoice { get; set; }
    public PaymentMethod Method { get; set; } = PaymentMethod.Cash;
    public decimal Amount { get; set; }
    public string? ReferenceNumber { get; set; }
    public string? Details { get; set; }
    public DateTimeOffset PaidAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class SalesReturn : BaseAuditableEntity
{
    public Guid ShopId { get; set; }
    public Shop? Shop { get; set; }
    public Guid SalesInvoiceId { get; set; }
    public SalesInvoice? SalesInvoice { get; set; }
    public string CreditNoteNumber { get; set; } = string.Empty;
    public ReturnStatus Status { get; set; } = ReturnStatus.Requested;
    public decimal RefundAmount { get; set; }
    public string? Reason { get; set; }
    public ICollection<SalesReturnItem> Items { get; set; } = new List<SalesReturnItem>();
}

public sealed class SalesReturnItem : BaseAuditableEntity
{
    public Guid SalesReturnId { get; set; }
    public SalesReturn? SalesReturn { get; set; }
    public Guid ProductId { get; set; }
    public Product? Product { get; set; }
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal RefundAmount { get; set; }
}
