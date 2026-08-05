using BillEasePro.Domain.Common;
using BillEasePro.Domain.Enums;

namespace BillEasePro.Domain.Entities;

public sealed class StockAdjustment : BaseAuditableEntity
{
    public Guid ShopId { get; set; }
    public Shop? Shop { get; set; }
    public string AdjustmentNumber { get; set; } = string.Empty;
    public StockAdjustmentType AdjustmentType { get; set; } = StockAdjustmentType.Correction;
    public AdjustmentStatus Status { get; set; } = AdjustmentStatus.Pending;
    public DateTimeOffset AdjustmentDate { get; set; } = DateTimeOffset.UtcNow;
    public string Reason { get; set; } = string.Empty;
    public string? ReferenceNumber { get; set; }
    public string? Notes { get; set; }
    public Guid? ApprovedByUserId { get; set; }
    public AppUser? ApprovedByUser { get; set; }
    public bool IsApproved { get; set; } = false;
    public DateTimeOffset? ApprovedAt { get; set; }
    public ICollection<StockAdjustmentItem> Items { get; set; } = new List<StockAdjustmentItem>();
}

public sealed class StockAdjustmentItem : BaseAuditableEntity
{
    public Guid StockAdjustmentId { get; set; }
    public StockAdjustment? StockAdjustment { get; set; }
    public Guid ProductId { get; set; }
    public Product? Product { get; set; }
    public Guid? ProductVariantId { get; set; }
    public ProductVariant? ProductVariant { get; set; }
    public decimal OldQuantity { get; set; }
    public decimal NewQuantity { get; set; }
    public decimal QuantityDifference => NewQuantity - OldQuantity;
    public string? Reason { get; set; }
}
