using BillEasePro.Domain.Common;
using BillEasePro.Domain.Enums;

namespace BillEasePro.Domain.Entities;

public sealed class ExpenseCategory : BaseAuditableEntity
{
    public Guid ShopId { get; set; }
    public Shop? Shop { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public ICollection<Expense> Expenses { get; set; } = new List<Expense>();
}

public sealed class Expense : BaseAuditableEntity
{
    public Guid ShopId { get; set; }
    public Shop? Shop { get; set; }
    public Guid ExpenseCategoryId { get; set; }
    public ExpenseCategory? ExpenseCategory { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTimeOffset ExpenseDate { get; set; } = DateTimeOffset.UtcNow;
    public string? ReferenceNumber { get; set; }
    public string? Notes { get; set; }
    public bool IsApproved { get; set; } = false;
    public Guid? ApprovedByUserId { get; set; }
    public AppUser? ApprovedByUser { get; set; }
    public DateTimeOffset? ApprovedAt { get; set; }
}
