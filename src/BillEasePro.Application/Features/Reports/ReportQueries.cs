using BillEasePro.Application.Abstractions;
using BillEasePro.Application.Dtos;
using BillEasePro.Domain.Entities;
using BillEasePro.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BillEasePro.Application.Features.Reports;

public sealed record SalesSummaryQuery(Guid ShopId, DateTimeOffset From, DateTimeOffset To) : IRequest<SalesSummaryDto>;
public sealed record ProfitLossQuery(Guid ShopId, DateTimeOffset From, DateTimeOffset To) : IRequest<ProfitLossDto>;
public sealed record InventoryValuationQuery(Guid ShopId) : IRequest<IReadOnlyList<InventoryValuationDto>>;
public sealed record CustomerLedgerQuery(Guid ShopId, Guid CustomerId) : IRequest<CustomerLedgerDto>;
public sealed record ReportCatalogQuery() : IRequest<ReportCatalogDto>;
public sealed record RunReportQuery(ReportRequestDto Request) : IRequest<ReportResultDto>;
public sealed record AnalyticsDashboardQuery(Guid ShopId) : IRequest<AnalyticsDashboardDto>;

public sealed class ReportCatalogQueryHandler : IRequestHandler<ReportCatalogQuery, ReportCatalogDto>
{
    public Task<ReportCatalogDto> Handle(ReportCatalogQuery request, CancellationToken cancellationToken)
        => Task.FromResult(new ReportCatalogDto([
            new("sales", "Sales", [
                new("sales-summary", "Sales Summary", "Sales grouped by day, week, month, category, or operator.", true),
                new("itemised-sales", "Itemised Sales Register", "Bill line register with HSN, quantity, discount, tax, and total.", false),
                new("bill-profit", "Bill-wise Profit Report", "Bill margin based on product cost and sale amount.", false),
                new("sales-returns", "Sales Returns Register", "Credit notes, original bills, refund amount, mode, and reason.", false),
                new("customer-outstanding", "Customer Outstanding", "Customer purchases, payments, balance, and overdue days.", false)
            ]),
            new("purchase", "Purchase", [
                new("purchase-register", "Purchase Register", "Supplier invoice, items, tax, paid, and outstanding.", false),
                new("purchase-returns", "Purchase Returns", "Debit notes and supplier return impact.", false),
                new("supplier-ledger", "Supplier Ledger", "Supplier-wise account statement.", false),
                new("payment-due", "Payment Due", "Upcoming supplier payments by due date.", false)
            ]),
            new("inventory", "Inventory", [
                new("stock-valuation", "Stock Valuation", "Cost value, selling value, and potential margin.", true),
                new("stock-movement", "Stock Movement Register", "Product-wise in/out movement ledger.", false),
                new("expiry", "Expiry Report", "Batches expiring by urgency.", true),
                new("abc-analysis", "ABC Analysis", "A/B/C product contribution by revenue.", true),
                new("dead-stock", "Dead Stock", "Products with no sale in the configured threshold.", false),
                new("low-stock", "Low Stock Alert", "Products below reorder threshold.", false)
            ]),
            new("accounts", "Accounts", [
                new("day-book", "Day Book", "Cash and bank transactions with opening and closing balance.", false),
                new("profit-loss", "Profit & Loss Statement", "Revenue, COGS, gross profit, expenses, and net profit.", true),
                new("payment-mode", "Payment Mode Summary", "Cash, card, UPI, and credit breakdown.", true)
            ]),
            new("tax", "Tax", [new("tax-summary", "GST/VAT Summary", "Output tax, input tax, and net payable.", true)]),
            new("customer", "Customer", [
                new("customer-ledger", "Customer Ledger", "Customer invoices, returns, payments, and balance.", false),
                new("top-customers", "Top Customers by Revenue", "Highest revenue customers.", true),
                new("customer-frequency", "Customer Frequency Analysis", "Loyal, returning, and occasional customers.", true),
                new("loyalty-points", "Loyalty Points Report", "Earned, redeemed, and balance points.", false)
            ]),
            new("analytics", "Analytics", [new("dashboard", "Analytics Dashboard", "Business intelligence overview.", true)])
        ]));
}

public sealed class SalesSummaryQueryHandler : IRequestHandler<SalesSummaryQuery, SalesSummaryDto>
{
    private readonly IRepository<SalesInvoice> _invoices;

    public SalesSummaryQueryHandler(IRepository<SalesInvoice> invoices) => _invoices = invoices;

    public async Task<SalesSummaryDto> Handle(SalesSummaryQuery request, CancellationToken cancellationToken)
    {
        var rows = await _invoices.Query()
            .Include(x => x.Payments)
            .Where(x => x.ShopId == request.ShopId && x.InvoiceDate >= request.From && x.InvoiceDate <= request.To)
            .ToListAsync(cancellationToken);

        return new SalesSummaryDto(
            rows.Sum(x => x.GrandTotal),
            rows.Sum(x => x.TaxTotal),
            rows.Sum(x => x.DiscountTotal),
            rows.Sum(x => x.Payments.Sum(payment => payment.Amount)),
            rows.Count);
    }
}

public sealed class ProfitLossQueryHandler : IRequestHandler<ProfitLossQuery, ProfitLossDto>
{
    private readonly IRepository<SalesInvoice> _invoices;
    private readonly IRepository<PurchaseInvoice> _purchases;

    public ProfitLossQueryHandler(IRepository<SalesInvoice> invoices, IRepository<PurchaseInvoice> purchases)
    {
        _invoices = invoices;
        _purchases = purchases;
    }

    public async Task<ProfitLossDto> Handle(ProfitLossQuery request, CancellationToken cancellationToken)
    {
        var revenue = await _invoices.Query().Where(x => x.ShopId == request.ShopId && x.InvoiceDate >= request.From && x.InvoiceDate <= request.To).SumAsync(x => x.GrandTotal, cancellationToken);
        var cogs = await _purchases.Query().Where(x => x.ShopId == request.ShopId && x.InvoiceDate >= request.From && x.InvoiceDate <= request.To).SumAsync(x => x.GrandTotal, cancellationToken);
        var gross = revenue - cogs;
        return new ProfitLossDto(revenue, cogs, gross, 0, gross);
    }
}

public sealed class InventoryValuationQueryHandler : IRequestHandler<InventoryValuationQuery, IReadOnlyList<InventoryValuationDto>>
{
    private readonly IRepository<InventoryStock> _stocks;

    public InventoryValuationQueryHandler(IRepository<InventoryStock> stocks) => _stocks = stocks;

    public async Task<IReadOnlyList<InventoryValuationDto>> Handle(InventoryValuationQuery request, CancellationToken cancellationToken)
        => await _stocks.Query()
            .Where(x => x.ShopId == request.ShopId)
            .Select(x => new InventoryValuationDto(x.ProductId, x.Product!.Name, x.QuantityOnHand, x.Product.CostPrice, x.QuantityOnHand * x.Product.CostPrice))
            .ToListAsync(cancellationToken);
}

public sealed class CustomerLedgerQueryHandler : IRequestHandler<CustomerLedgerQuery, CustomerLedgerDto>
{
    private readonly IRepository<Customer> _customers;
    private readonly IRepository<SalesInvoice> _invoices;

    public CustomerLedgerQueryHandler(IRepository<Customer> customers, IRepository<SalesInvoice> invoices)
    {
        _customers = customers;
        _invoices = invoices;
    }

    public async Task<CustomerLedgerDto> Handle(CustomerLedgerQuery request, CancellationToken cancellationToken)
    {
        var customer = await _customers.GetByIdAsync(request.CustomerId, cancellationToken) ?? throw new KeyNotFoundException("Customer not found.");
        var invoices = await _invoices.Query()
            .Include(x => x.Payments)
            .Where(x => x.ShopId == request.ShopId && x.CustomerId == request.CustomerId)
            .ToListAsync(cancellationToken);
        var sales = invoices.Sum(x => x.GrandTotal);
        var payments = invoices.Sum(x => x.Payments.Sum(payment => payment.Amount));
        return new CustomerLedgerDto(customer.Id, customer.Name, sales, payments, sales - payments);
    }
}

public sealed class RunReportQueryHandler : IRequestHandler<RunReportQuery, ReportResultDto>
{
    private readonly IRepository<SalesInvoice> _sales;
    private readonly IRepository<SalesReturn> _salesReturns;
    private readonly IRepository<PurchaseInvoice> _purchases;
    private readonly IRepository<PurchaseReturn> _purchaseReturns;
    private readonly IRepository<InventoryStock> _stocks;
    private readonly IRepository<InventoryMovement> _movements;
    private readonly IRepository<InventoryBatch> _batches;
    private readonly IRepository<Supplier> _suppliers;
    private readonly IRepository<SupplierLedgerEntry> _supplierLedger;
    private readonly IRepository<Customer> _customers;
    private readonly IRepository<Expense> _expenses;

    public RunReportQueryHandler(IRepository<SalesInvoice> sales, IRepository<SalesReturn> salesReturns, IRepository<PurchaseInvoice> purchases, IRepository<PurchaseReturn> purchaseReturns, IRepository<InventoryStock> stocks, IRepository<InventoryMovement> movements, IRepository<InventoryBatch> batches, IRepository<Supplier> suppliers, IRepository<SupplierLedgerEntry> supplierLedger, IRepository<Customer> customers, IRepository<Expense> expenses)
    {
        _sales = sales;
        _salesReturns = salesReturns;
        _purchases = purchases;
        _purchaseReturns = purchaseReturns;
        _stocks = stocks;
        _movements = movements;
        _batches = batches;
        _suppliers = suppliers;
        _supplierLedger = supplierLedger;
        _customers = customers;
        _expenses = expenses;
    }

    public async Task<ReportResultDto> Handle(RunReportQuery query, CancellationToken cancellationToken)
    {
        var r = query.Request;
        var sales = await _sales.Query().Include(x => x.Customer).Include(x => x.Items).ThenInclude(x => x.Product).ThenInclude(x => x!.Category).Include(x => x.Items).ThenInclude(x => x.Product).ThenInclude(x => x!.UnitOfMeasure).Include(x => x.Payments).Where(x => x.ShopId == r.ShopId && x.InvoiceDate >= r.From && x.InvoiceDate <= r.To).ToListAsync(cancellationToken);
        var purchases = await _purchases.Query().Include(x => x.Supplier).Include(x => x.Items).ThenInclude(x => x.Product).Where(x => x.ShopId == r.ShopId && x.InvoiceDate >= r.From && x.InvoiceDate <= r.To).ToListAsync(cancellationToken);
        var customers = await _customers.Query().Where(x => x.ShopId == r.ShopId).ToListAsync(cancellationToken);

        return r.ReportKey switch
        {
            "sales-summary" => SalesSummary(r, sales),
            "itemised-sales" => ItemisedSales(r, sales),
            "bill-profit" => BillProfit(r, sales),
            "sales-returns" => SalesReturns(r, await _salesReturns.Query().Include(x => x.SalesInvoice).ThenInclude(x => x!.Customer).Include(x => x.Items).Where(x => x.ShopId == r.ShopId && x.CreatedAt >= r.From && x.CreatedAt <= r.To).ToListAsync(cancellationToken)),
            "customer-outstanding" => CustomerOutstanding(r, sales, customers),
            "purchase-register" => PurchaseRegister(r, purchases),
            "purchase-returns" => PurchaseReturns(r, await _purchaseReturns.Query().Include(x => x.PurchaseInvoice).ThenInclude(x => x!.Supplier).Include(x => x.Items).Where(x => x.ShopId == r.ShopId && x.CreatedAt >= r.From && x.CreatedAt <= r.To).ToListAsync(cancellationToken)),
            "supplier-ledger" => SupplierLedger(r, await _supplierLedger.Query().Include(x => x.Supplier).Where(x => x.ShopId == r.ShopId && x.EntryDate >= r.From && x.EntryDate <= r.To).ToListAsync(cancellationToken)),
            "payment-due" => PaymentDue(r, await _supplierLedger.Query().Include(x => x.Supplier).Where(x => x.ShopId == r.ShopId && x.DueDate != null && x.BalanceAfter > 0).ToListAsync(cancellationToken)),
            "stock-valuation" => StockValuation(r, await _stocks.Query().Include(x => x.Product).ThenInclude(x => x!.Category).Include(x => x.Product).ThenInclude(x => x!.UnitOfMeasure).Where(x => x.ShopId == r.ShopId).ToListAsync(cancellationToken)),
            "stock-movement" => StockMovement(r, await _movements.Query().Include(x => x.Product).Where(x => x.ShopId == r.ShopId && x.CreatedAt >= r.From && x.CreatedAt <= r.To).ToListAsync(cancellationToken)),
            "expiry" => Expiry(r, await _batches.Query().Include(x => x.Product).Where(x => x.ShopId == r.ShopId && x.QuantityAvailable > 0).ToListAsync(cancellationToken)),
            "abc-analysis" => Abc(r, sales),
            "dead-stock" => DeadStock(r, await _stocks.Query().Include(x => x.Product).Where(x => x.ShopId == r.ShopId).ToListAsync(cancellationToken), await _movements.Query().Where(x => x.ShopId == r.ShopId && x.MovementType == StockMovementType.Sale).ToListAsync(cancellationToken)),
            "low-stock" => LowStock(r, await _stocks.Query().Include(x => x.Product).ThenInclude(x => x!.Category).Where(x => x.ShopId == r.ShopId).ToListAsync(cancellationToken)),
            "day-book" => DayBook(r, sales, purchases, await _expenses.Query().Where(x => x.ShopId == r.ShopId && x.ExpenseDate >= r.From && x.ExpenseDate <= r.To).ToListAsync(cancellationToken)),
            "profit-loss" => ProfitLossReport(r, sales, purchases, await _expenses.Query().Where(x => x.ShopId == r.ShopId && x.ExpenseDate >= r.From && x.ExpenseDate <= r.To).ToListAsync(cancellationToken), await _stocks.Query().Include(x => x.Product).Where(x => x.ShopId == r.ShopId).ToListAsync(cancellationToken)),
            "tax-summary" => TaxSummary(r, sales, purchases),
            "payment-mode" => PaymentMode(r, sales),
            "customer-ledger" => CustomerLedgerReport(r, sales, customers),
            "top-customers" => TopCustomers(r, sales),
            "customer-frequency" => CustomerFrequency(r, sales, customers),
            "loyalty-points" => Loyalty(r, customers),
            _ => Empty(r.ReportKey, "Report")
        };
    }

    private static ReportResultDto SalesSummary(ReportRequestDto r, IReadOnlyList<SalesInvoice> sales)
    {
        var groups = sales.GroupBy(x => GroupKey(x.InvoiceDate, r.GroupBy)).OrderBy(x => x.Key).ToList();
        var rows = groups.Select(g => Row(("date", g.Key), ("billsCount", g.Count()), ("itemsSold", g.Sum(x => x.Items.Sum(i => i.Quantity))), ("subTotal", g.Sum(x => x.SubTotal)), ("discount", g.Sum(x => x.DiscountTotal)), ("tax", g.Sum(x => x.TaxTotal)), ("grandTotal", g.Sum(x => x.GrandTotal)), ("cash", Pay(g, PaymentMethod.Cash)), ("card", Pay(g, PaymentMethod.Card)), ("upi", Pay(g, PaymentMethod.UPI)), ("credit", Pay(g, PaymentMethod.Credit)))).ToList();
        return Result("sales-summary", "Sales Summary", "Sales", SalesMetrics(sales), Cols(("date", "Date"), ("billsCount", "Bills Count"), ("itemsSold", "Items Sold"), ("subTotal", "Sub Total"), ("discount", "Discount"), ("tax", "Tax"), ("grandTotal", "Grand Total"), ("cash", "Cash"), ("card", "Card"), ("upi", "UPI"), ("credit", "Credit")), rows, [Line("Daily sales trend", rows.Select(x => x["date"]?.ToString() ?? "").ToList(), rows.Select(x => Convert.ToDecimal(x["grandTotal"])).ToList()), Donut("Payment mode split", ["Cash", "Card", "UPI", "Credit"], [sales.Sum(x => x.Payments.Where(p => p.Method == PaymentMethod.Cash).Sum(p => p.Amount)), sales.Sum(x => x.Payments.Where(p => p.Method == PaymentMethod.Card).Sum(p => p.Amount)), sales.Sum(x => x.Payments.Where(p => p.Method == PaymentMethod.UPI).Sum(p => p.Amount)), sales.Sum(x => x.Payments.Where(p => p.Method == PaymentMethod.Credit).Sum(p => p.Amount))])]);
    }

    private static ReportResultDto ItemisedSales(ReportRequestDto r, IReadOnlyList<SalesInvoice> sales)
        => Result("itemised-sales", "Itemised Sales Register", "Sales", SalesMetrics(sales), Cols(("billNo", "BillNo"), ("date", "Date"), ("customer", "Customer"), ("product", "Product"), ("hsn", "HSN"), ("qty", "Qty"), ("unit", "Unit"), ("rate", "Rate"), ("discount", "Discount"), ("taxRate", "Tax%"), ("taxAmount", "Tax Amt"), ("total", "Total")),
            sales.SelectMany(s => s.Items.Select(i => Row(("billNo", s.InvoiceNumber), ("date", s.InvoiceDate.Date.ToString("yyyy-MM-dd")), ("customer", s.Customer?.Name ?? "Walk-in Customer"), ("product", i.Description), ("hsn", i.Product?.HsnSacCode), ("qty", i.Quantity), ("unit", i.Product?.UnitOfMeasure?.Symbol ?? ""), ("rate", i.UnitPrice), ("discount", i.DiscountAmount), ("taxRate", i.TaxRate), ("taxAmount", i.TaxAmount), ("total", i.LineTotal)))).ToList(), []);

    private static ReportResultDto BillProfit(ReportRequestDto r, IReadOnlyList<SalesInvoice> sales)
        => Result("bill-profit", "Bill-wise Profit Report", "Sales", SalesMetrics(sales), Cols(("billNo", "BillNo"), ("date", "Date"), ("customer", "Customer"), ("saleAmount", "Sale Amount"), ("costPrice", "Cost Price"), ("grossProfit", "Gross Profit"), ("margin", "Margin%"), ("marginClass", "Flag")),
            sales.Select(s => { var cost = s.Items.Sum(i => i.Quantity * (i.Product?.CostPrice ?? 0)); var profit = s.GrandTotal - cost; var margin = s.GrandTotal == 0 ? 0 : profit / s.GrandTotal * 100; return Row(("billNo", s.InvoiceNumber), ("date", s.InvoiceDate.Date.ToString("yyyy-MM-dd")), ("customer", s.Customer?.Name ?? "Walk-in Customer"), ("saleAmount", s.GrandTotal), ("costPrice", cost), ("grossProfit", profit), ("margin", Math.Round(margin, 2)), ("marginClass", profit < 0 ? "negative" : "")); }).ToList(), []);

    private static ReportResultDto SalesReturns(ReportRequestDto r, IReadOnlyList<SalesReturn> returns)
        => Result("sales-returns", "Sales Returns Register", "Sales", [Metric("Refund Amount", returns.Sum(x => x.RefundAmount), "currency"), Metric("Credit Notes", returns.Count, "number")], Cols(("creditNote", "CreditNote#"), ("date", "Date"), ("originalBill", "Original Bill"), ("customer", "Customer"), ("reason", "Reason"), ("items", "Items"), ("refundAmount", "Refund Amount"), ("mode", "Mode")),
            returns.Select(x => Row(("creditNote", x.CreditNoteNumber), ("date", x.CreatedAt.Date.ToString("yyyy-MM-dd")), ("originalBill", x.SalesInvoice?.InvoiceNumber), ("customer", x.SalesInvoice?.Customer?.Name ?? "Walk-in Customer"), ("reason", x.Reason), ("items", x.Items.Count), ("refundAmount", x.RefundAmount), ("mode", ParseRefundMode(x.Reason)))).ToList(), []);

    private static ReportResultDto CustomerOutstanding(ReportRequestDto r, IReadOnlyList<SalesInvoice> sales, IReadOnlyList<Customer> customers)
        => Result("customer-outstanding", "Customer Outstanding Report", "Sales", [Metric("Outstanding", customers.Sum(x => x.OutstandingBalance), "currency"), Metric("Customers", customers.Count, "number")], Cols(("customer", "Customer"), ("totalPurchases", "Total Purchases"), ("amountPaid", "Amount Paid"), ("outstanding", "Outstanding"), ("lastPurchaseDate", "Last Purchase Date"), ("daysOverdue", "Days Overdue")),
            customers.Select(c => { var inv = sales.Where(x => x.CustomerId == c.Id).ToList(); var last = inv.OrderByDescending(x => x.InvoiceDate).FirstOrDefault()?.InvoiceDate; return Row(("customer", c.Name), ("totalPurchases", inv.Sum(x => x.GrandTotal)), ("amountPaid", inv.Sum(x => x.Payments.Sum(p => p.Amount))), ("outstanding", c.OutstandingBalance), ("lastPurchaseDate", last?.Date.ToString("yyyy-MM-dd")), ("daysOverdue", last is null ? 0 : Math.Max(0, (DateTimeOffset.UtcNow - last.Value).Days))); }).ToList(), []);

    private static ReportResultDto PurchaseRegister(ReportRequestDto r, IReadOnlyList<PurchaseInvoice> purchases)
        => Result("purchase-register", "Purchase Register", "Purchase", [Metric("Purchases", purchases.Sum(x => x.GrandTotal), "currency"), Metric("Invoices", purchases.Count, "number")], Cols(("invoice", "Invoice#"), ("date", "Date"), ("supplier", "Supplier"), ("items", "Items"), ("subTotal", "Sub Total"), ("tax", "Tax"), ("grandTotal", "Grand Total"), ("paid", "Paid"), ("outstanding", "Outstanding")),
            purchases.Select(x => Row(("invoice", x.SupplierInvoiceNumber), ("date", x.InvoiceDate.Date.ToString("yyyy-MM-dd")), ("supplier", x.Supplier?.Name), ("items", x.Items.Count), ("subTotal", x.SubTotal), ("tax", x.TaxTotal), ("grandTotal", x.GrandTotal), ("paid", x.PaymentStatus == PaymentStatus.Paid ? x.GrandTotal : 0), ("outstanding", x.PaymentStatus == PaymentStatus.Paid ? 0 : x.GrandTotal))).ToList(), []);

    private static ReportResultDto PurchaseReturns(ReportRequestDto r, IReadOnlyList<PurchaseReturn> returns)
        => Result("purchase-returns", "Purchase Returns", "Purchase", [Metric("Debit Notes", returns.Count, "number"), Metric("Return Amount", returns.Sum(x => x.ReturnAmount), "currency")], Cols(("debitNote", "Debit Note#"), ("date", "Date"), ("supplier", "Supplier"), ("items", "Items"), ("reason", "Reason"), ("amount", "Amount")), returns.Select(x => Row(("debitNote", x.DebitNoteNumber), ("date", x.CreatedAt.Date.ToString("yyyy-MM-dd")), ("supplier", x.PurchaseInvoice?.Supplier?.Name), ("items", x.Items.Count), ("reason", x.Reason), ("amount", x.ReturnAmount))).ToList(), []);

    private static ReportResultDto SupplierLedger(ReportRequestDto r, IReadOnlyList<SupplierLedgerEntry> rows)
        => Result("supplier-ledger", "Supplier Ledger", "Purchase", [Metric("Debit", rows.Sum(x => x.Debit), "currency"), Metric("Credit", rows.Sum(x => x.Credit), "currency")], Cols(("date", "Date"), ("supplier", "Supplier"), ("type", "Type"), ("reference", "Reference"), ("debit", "Debit"), ("credit", "Credit"), ("balance", "Balance")), rows.Select(x => Row(("date", x.EntryDate.Date.ToString("yyyy-MM-dd")), ("supplier", x.Supplier?.Name), ("type", x.EntryType), ("reference", x.ReferenceType), ("debit", x.Debit), ("credit", x.Credit), ("balance", x.BalanceAfter))).ToList(), []);

    private static ReportResultDto PaymentDue(ReportRequestDto r, IReadOnlyList<SupplierLedgerEntry> rows)
        => Result("payment-due", "Payment Due Report", "Purchase", [Metric("Due", rows.Sum(x => x.BalanceAfter), "currency"), Metric("Entries", rows.Count, "number")], Cols(("dueDate", "Due Date"), ("supplier", "Supplier"), ("reference", "Reference"), ("amount", "Amount"), ("daysLeft", "Days Left")), rows.Select(x => Row(("dueDate", x.DueDate?.Date.ToString("yyyy-MM-dd")), ("supplier", x.Supplier?.Name), ("reference", x.Notes), ("amount", x.BalanceAfter), ("daysLeft", x.DueDate is null ? 0 : (x.DueDate.Value - DateTimeOffset.UtcNow).Days))).ToList(), []);

    private static ReportResultDto StockValuation(ReportRequestDto r, IReadOnlyList<InventoryStock> stocks)
        => Result("stock-valuation", "Stock Valuation Report", "Inventory", [Metric("Purchase Value", stocks.Sum(x => x.QuantityOnHand * (x.Product?.CostPrice ?? 0)), "currency"), Metric("Selling Value", stocks.Sum(x => x.QuantityOnHand * (x.Product?.SellingPrice ?? 0)), "currency"), Metric("Potential Margin", stocks.Sum(x => x.QuantityOnHand * ((x.Product?.SellingPrice ?? 0) - (x.Product?.CostPrice ?? 0))), "currency")], Cols(("product", "Product"), ("category", "Category"), ("unit", "Unit"), ("qty", "Qty"), ("purchasePrice", "Purchase Price"), ("totalPurchaseValue", "Total Purchase Value"), ("mrp", "MRP"), ("sellingPrice", "Selling Price"), ("totalSellingValue", "Total Selling Value"), ("potentialProfit", "Potential Profit")),
            stocks.Select(x => Row(("product", x.Product?.Name), ("category", x.Product?.Category?.Name), ("unit", x.Product?.UnitOfMeasure?.Symbol), ("qty", x.QuantityOnHand), ("purchasePrice", x.Product?.CostPrice ?? 0), ("totalPurchaseValue", x.QuantityOnHand * (x.Product?.CostPrice ?? 0)), ("mrp", x.Product?.Mrp ?? 0), ("sellingPrice", x.Product?.SellingPrice ?? 0), ("totalSellingValue", x.QuantityOnHand * (x.Product?.SellingPrice ?? 0)), ("potentialProfit", x.QuantityOnHand * ((x.Product?.SellingPrice ?? 0) - (x.Product?.CostPrice ?? 0))))).ToList(), [Bar("Stock value", stocks.Take(10).Select(x => x.Product?.Name ?? "").ToList(), stocks.Take(10).Select(x => x.QuantityOnHand * (x.Product?.CostPrice ?? 0)).ToList())]);

    private static ReportResultDto StockMovement(ReportRequestDto r, IReadOnlyList<InventoryMovement> moves)
        => Result("stock-movement", "Stock Movement Register", "Inventory", [Metric("In", moves.Where(x => x.Quantity > 0).Sum(x => x.Quantity), "number"), Metric("Out", moves.Where(x => x.Quantity < 0).Sum(x => Math.Abs(x.Quantity)), "number")], Cols(("date", "Date"), ("product", "Product"), ("type", "Type"), ("in", "In"), ("out", "Out"), ("reference", "Reference"), ("notes", "Notes")), moves.Select(x => Row(("date", x.CreatedAt.Date.ToString("yyyy-MM-dd")), ("product", x.Product?.Name), ("type", x.MovementType), ("in", x.Quantity > 0 ? x.Quantity : 0), ("out", x.Quantity < 0 ? Math.Abs(x.Quantity) : 0), ("reference", x.ReferenceType), ("notes", x.Notes))).ToList(), []);

    private static ReportResultDto Expiry(ReportRequestDto r, IReadOnlyList<InventoryBatch> batches)
    {
        var today = DateTimeOffset.UtcNow.Date;
        var rows = batches.Where(x => x.ExpiryDate != null).Select(x => { var days = (x.ExpiryDate!.Value.Date - today).Days; return Row(("product", x.Product?.Name), ("batch", x.BatchNo), ("expiry", x.ExpiryDate.Value.Date.ToString("yyyy-MM-dd")), ("qty", x.QuantityAvailable), ("daysLeft", days), ("urgency", days <= 7 ? "7 days" : days <= 15 ? "15 days" : days <= 30 ? "30 days" : "Later")); }).ToList();
        var urgency = rows.GroupBy(x => x["urgency"]?.ToString() ?? "").ToList();
        return Result("expiry", "Expiry Report", "Inventory", [Metric("Expiring <= 30 days", rows.Count(x => Convert.ToInt32(x["daysLeft"]) <= 30), "number")], Cols(("product", "Product"), ("batch", "Batch"), ("expiry", "Expiry"), ("qty", "Qty"), ("daysLeft", "Days Left"), ("urgency", "Urgency")), rows, [Donut("Expiry urgency", urgency.Select(x => x.Key).ToList(), urgency.Select(x => (decimal)x.Count()).ToList())]);
    }

    private static ReportResultDto Abc(ReportRequestDto r, IReadOnlyList<SalesInvoice> sales)
    {
        var items = sales.SelectMany(x => x.Items).GroupBy(x => x.ProductId).Select(g => new { Product = g.First().Description, Revenue = g.Sum(i => i.LineTotal), Qty = g.Sum(i => i.Quantity) }).OrderByDescending(x => x.Revenue).ToList();
        var total = items.Sum(x => x.Revenue);
        decimal cumulative = 0;
        var rows = items.Select(x => { cumulative += x.Revenue; var pct = total == 0 ? 0 : cumulative / total * 100; return Row(("product", x.Product), ("qty", x.Qty), ("revenue", x.Revenue), ("contribution", Math.Round(total == 0 ? 0 : x.Revenue / total * 100, 2)), ("class", pct <= 80 ? "A" : pct <= 95 ? "B" : "C")); }).ToList();
        return Result("abc-analysis", "ABC Analysis", "Inventory", [Metric("Revenue", total, "currency"), Metric("A Items", rows.Count(x => x["class"]?.ToString() == "A"), "number")], Cols(("product", "Product"), ("qty", "Qty"), ("revenue", "Revenue"), ("contribution", "Contribution%"), ("class", "Class")), rows, [Bar("ABC revenue", rows.Take(15).Select(x => x["product"]?.ToString() ?? "").ToList(), rows.Take(15).Select(x => Convert.ToDecimal(x["revenue"])).ToList())]);
    }

    private static ReportResultDto DeadStock(ReportRequestDto r, IReadOnlyList<InventoryStock> stocks, IReadOnlyList<InventoryMovement> moves)
    {
        var cutoff = DateTimeOffset.UtcNow.AddDays(-Math.Max(1, r.DeadStockDays));
        var lastSale = moves.GroupBy(x => x.ProductId).ToDictionary(x => x.Key, x => x.Max(m => m.CreatedAt));
        var rows = stocks.Where(x => !lastSale.ContainsKey(x.ProductId) || lastSale[x.ProductId] < cutoff).Select(x => Row(("product", x.Product?.Name), ("qty", x.QuantityOnHand), ("lastSaleDate", lastSale.GetValueOrDefault(x.ProductId).Date.ToString("yyyy-MM-dd")), ("thresholdDays", r.DeadStockDays))).ToList();
        return Result("dead-stock", "Dead Stock Report", "Inventory", [Metric("Dead Stock SKUs", rows.Count, "number")], Cols(("product", "Product"), ("qty", "Qty"), ("lastSaleDate", "Last Sale Date"), ("thresholdDays", "Threshold Days")), rows, []);
    }

    private static ReportResultDto LowStock(ReportRequestDto r, IReadOnlyList<InventoryStock> stocks)
        => Result("low-stock", "Low Stock Alert Report", "Inventory", [Metric("Low Stock SKUs", stocks.Count(x => x.QuantityOnHand <= (x.Product?.LowStockThreshold ?? 0)), "number")], Cols(("product", "Product"), ("category", "Category"), ("qty", "Qty"), ("minStock", "Min Stock"), ("reorderQty", "Reorder Qty")), stocks.Where(x => x.QuantityOnHand <= (x.Product?.LowStockThreshold ?? 0)).Select(x => Row(("product", x.Product?.Name), ("category", x.Product?.Category?.Name), ("qty", x.QuantityOnHand), ("minStock", x.Product?.LowStockThreshold ?? 0), ("reorderQty", x.Product?.ReorderQuantity ?? 0))).ToList(), []);

    private static ReportResultDto DayBook(ReportRequestDto r, IReadOnlyList<SalesInvoice> sales, IReadOnlyList<PurchaseInvoice> purchases, IReadOnlyList<Expense> expenses)
    {
        var rows = sales.Select(x => Row(("date", x.InvoiceDate.Date.ToString("yyyy-MM-dd")), ("type", "Sale"), ("reference", x.InvoiceNumber), ("in", x.Payments.Sum(p => p.Amount)), ("out", 0m))).Concat(purchases.Select(x => Row(("date", x.InvoiceDate.Date.ToString("yyyy-MM-dd")), ("type", "Purchase"), ("reference", x.SupplierInvoiceNumber), ("in", 0m), ("out", x.GrandTotal)))).Concat(expenses.Select(x => Row(("date", x.ExpenseDate.Date.ToString("yyyy-MM-dd")), ("type", "Expense"), ("reference", x.ReferenceNumber), ("in", 0m), ("out", x.Amount)))).OrderBy(x => x["date"]).ToList();
        return Result("day-book", "Day Book", "Accounts", [Metric("Inflow", rows.Sum(x => Convert.ToDecimal(x["in"])), "currency"), Metric("Outflow", rows.Sum(x => Convert.ToDecimal(x["out"])), "currency"), Metric("Closing", rows.Sum(x => Convert.ToDecimal(x["in"]) - Convert.ToDecimal(x["out"])), "currency")], Cols(("date", "Date"), ("type", "Type"), ("reference", "Reference"), ("in", "In"), ("out", "Out")), rows, []);
    }

    private static ReportResultDto ProfitLossReport(ReportRequestDto r, IReadOnlyList<SalesInvoice> sales, IReadOnlyList<PurchaseInvoice> purchases, IReadOnlyList<Expense> expenses, IReadOnlyList<InventoryStock> stocks)
    {
        var revenue = sales.Sum(x => x.GrandTotal);
        var cogs = purchases.Sum(x => x.GrandTotal);
        var closing = stocks.Sum(x => x.QuantityOnHand * (x.Product?.CostPrice ?? 0));
        var expense = expenses.Sum(x => x.Amount);
        var gross = revenue - cogs;
        var rows = new[] { Row(("section", "Revenue"), ("amount", revenue)), Row(("section", "COGS"), ("amount", cogs)), Row(("section", "Closing Stock"), ("amount", closing)), Row(("section", "Gross Profit"), ("amount", gross)), Row(("section", "Operating Expenses"), ("amount", expense)), Row(("section", "Net Profit"), ("amount", gross - expense)) }.ToList();
        return Result("profit-loss", "Profit & Loss Statement", "Accounts", [Metric("Revenue", revenue, "currency"), Metric("Gross Profit", gross, "currency"), Metric("Net Profit", gross - expense, "currency")], Cols(("section", "Section"), ("amount", "Amount")), rows, [Bar("P&L", rows.Select(x => x["section"]?.ToString() ?? "").ToList(), rows.Select(x => Convert.ToDecimal(x["amount"])).ToList())]);
    }

    private static ReportResultDto TaxSummary(ReportRequestDto r, IReadOnlyList<SalesInvoice> sales, IReadOnlyList<PurchaseInvoice> purchases)
    {
        var output = sales.SelectMany(x => x.Items).GroupBy(x => x.TaxRate).Select(g => Row(("section", "Output Tax"), ("taxSlab", $"{g.Key}%"), ("taxableAmount", g.Sum(i => i.LineTotal - i.TaxAmount)), ("cgst", g.Sum(i => i.TaxAmount) / 2), ("sgst", g.Sum(i => i.TaxAmount) / 2), ("igst", 0m), ("totalTax", g.Sum(i => i.TaxAmount))));
        var input = purchases.SelectMany(x => x.Items).GroupBy(x => x.TaxRate).Select(g =>
        {
            var inputTax = g.Sum(i => i.TaxRate == 0 ? 0 : i.LineTotal * i.TaxRate / (100 + i.TaxRate));
            return Row(("section", "Input Tax"), ("taxSlab", $"{g.Key}%"), ("taxableAmount", g.Sum(i => i.LineTotal) - inputTax), ("cgst", inputTax / 2), ("sgst", inputTax / 2), ("igst", 0m), ("totalTax", inputTax));
        });
        var rows = output.Concat(input).ToList();
        return Result("tax-summary", "GST/VAT Summary Report", "Tax", [Metric("Output Tax", rows.Where(x => x["section"]?.ToString() == "Output Tax").Sum(x => Convert.ToDecimal(x["totalTax"])), "currency"), Metric("Input Tax", rows.Where(x => x["section"]?.ToString() == "Input Tax").Sum(x => Convert.ToDecimal(x["totalTax"])), "currency")], Cols(("section", "Section"), ("taxSlab", "Tax Slab"), ("taxableAmount", "Taxable Amount"), ("cgst", "CGST"), ("sgst", "SGST"), ("igst", "IGST"), ("totalTax", "Total Tax")), rows, [Bar("Tax by slab", rows.Select(x => $"{x["section"]} {x["taxSlab"]}").ToList(), rows.Select(x => Convert.ToDecimal(x["totalTax"])).ToList())]);
    }

    private static ReportResultDto PaymentMode(ReportRequestDto r, IReadOnlyList<SalesInvoice> sales)
    {
        var payments = sales.SelectMany(x => x.Payments).GroupBy(x => x.Method).Select(g => Row(("mode", g.Key.ToString()), ("amount", g.Sum(p => p.Amount)), ("count", g.Count()))).ToList();
        return Result("payment-mode", "Payment Mode Summary", "Accounts", [Metric("Collected", payments.Sum(x => Convert.ToDecimal(x["amount"])), "currency")], Cols(("mode", "Mode"), ("amount", "Amount"), ("count", "Count")), payments, [Donut("Payment mode", payments.Select(x => x["mode"]?.ToString() ?? "").ToList(), payments.Select(x => Convert.ToDecimal(x["amount"])).ToList())]);
    }

    private static ReportResultDto CustomerLedgerReport(ReportRequestDto r, IReadOnlyList<SalesInvoice> sales, IReadOnlyList<Customer> customers)
        => Result("customer-ledger", "Customer Ledger", "Customer", [Metric("Outstanding", customers.Sum(x => x.OutstandingBalance), "currency")], Cols(("date", "Date"), ("customer", "Customer"), ("reference", "Reference"), ("debit", "Debit"), ("credit", "Credit"), ("balance", "Balance")), sales.Where(x => x.CustomerId != null).Select(x => Row(("date", x.InvoiceDate.Date.ToString("yyyy-MM-dd")), ("customer", x.Customer?.Name), ("reference", x.InvoiceNumber), ("debit", x.GrandTotal), ("credit", x.Payments.Sum(p => p.Amount)), ("balance", x.GrandTotal - x.Payments.Sum(p => p.Amount)))).ToList(), []);

    private static ReportResultDto TopCustomers(ReportRequestDto r, IReadOnlyList<SalesInvoice> sales)
    {
        var rows = sales.GroupBy(x => x.Customer?.Name ?? "Walk-in Customer").Select(g => Row(("customer", g.Key), ("revenue", g.Sum(x => x.GrandTotal)), ("bills", g.Count()))).OrderByDescending(x => x["revenue"]).Take(25).ToList();
        return Result("top-customers", "Top Customers by Revenue", "Customer", [Metric("Revenue", rows.Sum(x => Convert.ToDecimal(x["revenue"])), "currency")], Cols(("customer", "Customer"), ("revenue", "Revenue"), ("bills", "Bills")), rows, [Bar("Top customers", rows.Take(10).Select(x => x["customer"]?.ToString() ?? "").ToList(), rows.Take(10).Select(x => Convert.ToDecimal(x["revenue"])).ToList())]);
    }

    private static ReportResultDto CustomerFrequency(ReportRequestDto r, IReadOnlyList<SalesInvoice> sales, IReadOnlyList<Customer> customers)
    {
        var rows = customers.Select(c => { var count = sales.Count(x => x.CustomerId == c.Id); return Row(("customer", c.Name), ("bills", count), ("segment", count >= 5 ? "Loyal" : count >= 2 ? "Returning" : "Occasional")); }).ToList();
        var segments = rows.GroupBy(x => x["segment"]?.ToString() ?? "").ToList();
        return Result("customer-frequency", "Customer Frequency Analysis", "Customer", [Metric("Customers", rows.Count, "number")], Cols(("customer", "Customer"), ("bills", "Bills"), ("segment", "Segment")), rows, [Donut("Customer segments", segments.Select(x => x.Key).ToList(), segments.Select(x => (decimal)x.Count()).ToList())]);
    }

    private static ReportResultDto Loyalty(ReportRequestDto r, IReadOnlyList<Customer> customers)
        => Result("loyalty-points", "Loyalty Points Report", "Customer", [Metric("Balance Points", customers.Sum(x => x.LoyaltyPoints), "number")], Cols(("customer", "Customer"), ("earned", "Earned"), ("redeemed", "Redeemed"), ("balance", "Balance")), customers.Select(x => Row(("customer", x.Name), ("earned", x.LoyaltyPoints), ("redeemed", 0m), ("balance", x.LoyaltyPoints))).ToList(), []);

    private static IReadOnlyList<ReportMetricDto> SalesMetrics(IReadOnlyList<SalesInvoice> sales) => [Metric("Grand Total", sales.Sum(x => x.GrandTotal), "currency"), Metric("Bills", sales.Count, "number"), Metric("Tax", sales.Sum(x => x.TaxTotal), "currency"), Metric("Discount", sales.Sum(x => x.DiscountTotal), "currency")];
    private static decimal Pay(IEnumerable<SalesInvoice> invoices, PaymentMethod method) => invoices.Sum(x => x.Payments.Where(p => p.Method == method).Sum(p => p.Amount));
    private static string GroupKey(DateTimeOffset date, string groupBy) => groupBy.ToLowerInvariant() switch { "week" => $"{date.Year}-W{System.Globalization.ISOWeek.GetWeekOfYear(date.DateTime):00}", "month" => date.ToString("yyyy-MM"), _ => date.Date.ToString("yyyy-MM-dd") };
    private static string ParseRefundMode(string? reason) => reason?.Split("Refund:", StringSplitOptions.TrimEntries).LastOrDefault() ?? string.Empty;
    private static ReportResultDto Empty(string key, string title) => Result(key, title, "Reports", [], [], [], []);
    private static ReportResultDto Result(string key, string title, string category, IReadOnlyList<ReportMetricDto> metrics, IReadOnlyList<ReportColumnDto> columns, IReadOnlyList<IReadOnlyDictionary<string, object?>> rows, IReadOnlyList<ReportChartDto> charts) => new(key, title, category, metrics, columns, rows, charts);
    private static ReportMetricDto Metric(string label, decimal value, string format) => new(label, value, format);
    private static IReadOnlyDictionary<string, object?> Row(params (string Key, object? Value)[] values) => values.ToDictionary(x => x.Key, x => x.Value);
    private static IReadOnlyList<ReportColumnDto> Cols(params (string Field, string Header)[] cols) => cols.Select(x => new ReportColumnDto(x.Field, x.Header, "text")).ToList();
    private static ReportChartDto Line(string title, IReadOnlyList<string> labels, IReadOnlyList<decimal> data) => new("line", title, labels, [new("Value", data)]);
    private static ReportChartDto Bar(string title, IReadOnlyList<string> labels, IReadOnlyList<decimal> data) => new("bar", title, labels, [new("Value", data)]);
    private static ReportChartDto Donut(string title, IReadOnlyList<string> labels, IReadOnlyList<decimal> data) => new("doughnut", title, labels, [new("Value", data)]);
}

public sealed class AnalyticsDashboardQueryHandler : IRequestHandler<AnalyticsDashboardQuery, AnalyticsDashboardDto>
{
    private readonly IRepository<SalesInvoice> _sales;
    private readonly IRepository<PurchaseInvoice> _purchases;
    private readonly IRepository<Customer> _customers;

    public AnalyticsDashboardQueryHandler(IRepository<SalesInvoice> sales, IRepository<PurchaseInvoice> purchases, IRepository<Customer> customers)
    {
        _sales = sales;
        _purchases = purchases;
        _customers = customers;
    }

    public async Task<AnalyticsDashboardDto> Handle(AnalyticsDashboardQuery request, CancellationToken cancellationToken)
    {
        var from = DateTimeOffset.UtcNow.Date.AddDays(-30);
        var sales = await _sales.Query().Include(x => x.Customer).Include(x => x.Items).ThenInclude(x => x.Product).ThenInclude(x => x!.Category).Include(x => x.Payments).Where(x => x.ShopId == request.ShopId && x.InvoiceDate >= from).ToListAsync(cancellationToken);
        var purchases = await _purchases.Query().Where(x => x.ShopId == request.ShopId && x.InvoiceDate >= from).ToListAsync(cancellationToken);
        var customers = await _customers.Query().Where(x => x.ShopId == request.ShopId).ToListAsync(cancellationToken);
        var trend = sales.GroupBy(x => x.InvoiceDate.Date.ToString("yyyy-MM-dd")).OrderBy(x => x.Key).ToList();
        var topQty = sales.SelectMany(x => x.Items).GroupBy(x => x.Description).OrderByDescending(x => x.Sum(i => i.Quantity)).Take(5).ToList();
        var topRevenue = sales.SelectMany(x => x.Items).GroupBy(x => x.Description).OrderByDescending(x => x.Sum(i => i.LineTotal)).Take(5).ToList();
        var category = sales.SelectMany(x => x.Items).GroupBy(x => x.Product?.Category?.Name ?? "Uncategorised").ToList();
        var payment = sales.SelectMany(x => x.Payments).GroupBy(x => x.Method.ToString()).ToList();
        var heatmap = trend.Select(x => new CalendarHeatmapPointDto(DateOnly.Parse(x.Key), x.Count())).ToList();
        var returning = sales.Where(x => x.CustomerId != null).GroupBy(x => x.CustomerId).Count(x => x.Count() > 1);
        var newCustomers = customers.Count(x => x.CreatedAt >= DateTimeOffset.UtcNow.Date.AddDays(-30));
        var purchaseCost = purchases.Sum(x => x.GrandTotal);
        var revenue = sales.Sum(x => x.GrandTotal);

        return new AnalyticsDashboardDto(
            [new("Revenue", revenue, "currency"), new("Bills", sales.Count, "number"), new("Purchase Cost", purchaseCost, "currency"), new("Net Profit", revenue - purchaseCost, "currency")],
            [
                new("line", "Revenue trend", trend.Select(x => x.Key).ToList(), [new("Revenue", trend.Select(x => x.Sum(s => s.GrandTotal)).ToList())]),
                new("bar", "Top 5 products by quantity", topQty.Select(x => x.Key).ToList(), [new("Qty", topQty.Select(x => x.Sum(i => i.Quantity)).ToList())]),
                new("bar", "Top 5 products by revenue", topRevenue.Select(x => x.Key).ToList(), [new("Revenue", topRevenue.Select(x => x.Sum(i => i.LineTotal)).ToList())]),
                new("doughnut", "Revenue by category", category.Select(x => x.Key).ToList(), [new("Revenue", category.Select(x => x.Sum(i => i.LineTotal)).ToList())]),
                new("doughnut", "Payment mode split", payment.Select(x => x.Key).ToList(), [new("Amount", payment.Select(x => x.Sum(p => p.Amount)).ToList())]),
                new("bar", "Purchase vs sales cost", ["Purchases", "Sales"], [new("Amount", [purchaseCost, revenue])]),
                new("line", "Net profit trend", trend.Select(x => x.Key).ToList(), [new("Net Profit", trend.Select(x => x.Sum(s => s.GrandTotal) - purchaseCost / Math.Max(1, trend.Count)).ToList())])
            ],
            heatmap,
            newCustomers,
            returning);
    }
}
