using BillEasePro.Domain.Common;
using BillEasePro.Domain.Enums;

namespace BillEasePro.Domain.Entities;

public sealed class Supplier : BaseAuditableEntity
{
    public Guid ShopId { get; set; }
    public Shop? Shop { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ContactPerson { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? TaxRegistrationNumber { get; set; }
    public string? Pan { get; set; }
    public string? Address { get; set; }
    public string? BankDetails { get; set; }
    public int CreditDays { get; set; }
    public string? PaymentTerms { get; set; }
    public decimal OpeningBalance { get; set; }
    public decimal OutstandingBalance { get; set; }
    public ICollection<SupplierLedgerEntry> LedgerEntries { get; set; } = new List<SupplierLedgerEntry>();
}

public sealed class SupplierLedgerEntry : BaseAuditableEntity
{
    public Guid ShopId { get; set; }
    public Shop? Shop { get; set; }
    public Guid SupplierId { get; set; }
    public Supplier? Supplier { get; set; }
    public SupplierLedgerEntryType EntryType { get; set; } = SupplierLedgerEntryType.Purchase;
    public DateTimeOffset EntryDate { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? DueDate { get; set; }
    public decimal Debit { get; set; }
    public decimal Credit { get; set; }
    public decimal BalanceAfter { get; set; }
    public string ReferenceType { get; set; } = string.Empty;
    public Guid? ReferenceId { get; set; }
    public string? Notes { get; set; }
}

public sealed class Customer : BaseAuditableEntity
{
    public Guid ShopId { get; set; }
    public Shop? Shop { get; set; }
    public string Name { get; set; } = "Walk-in Customer";
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? TaxRegistrationNumber { get; set; }
    public string? BillingAddress { get; set; }
    public decimal LoyaltyPoints { get; set; }
    public decimal CreditLimit { get; set; }
    public decimal OutstandingBalance { get; set; }
    public bool IsWalkIn { get; set; }
}
