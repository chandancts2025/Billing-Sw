using System.Globalization;
using System.Net;
using System.Text;
using AutoMapper;
using BillEasePro.Application.Abstractions;
using BillEasePro.Application.Dtos;
using BillEasePro.Domain.Entities;
using BillEasePro.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BillEasePro.Application.Features.Billing;

public sealed record SearchProductsQuery(Guid ShopId, string Term) : IRequest<IReadOnlyList<ProductSearchResultDto>>;
public sealed record SearchCustomersQuery(Guid ShopId, string Term) : IRequest<IReadOnlyList<CustomerSearchResultDto>>;
public sealed record AddInlineCustomerCommand(AddInlineCustomerRequest Request) : IRequest<CustomerSearchResultDto>;
public sealed record ValidateCouponQuery(CouponValidationRequest Request) : IRequest<CouponValidationDto>;
public sealed record QuoteBillCommand(BillQuoteRequest Request) : IRequest<BillQuoteDto>;
public sealed record CreateSaleInvoiceCommand(CreateSaleInvoiceRequest Request) : IRequest<SaleInvoiceDetailDto>;
public sealed record BillHistoryQueryCommand(BillHistoryQuery Query) : IRequest<IReadOnlyList<BillHistoryRowDto>>;
public sealed record GetSalesInvoiceForReturnQuery(Guid SalesInvoiceId) : IRequest<SalesReturnLookupDto>;
public sealed record FindSalesInvoiceForReturnQuery(Guid ShopId, string BillNo) : IRequest<SalesReturnLookupDto>;
public sealed record CreateSalesReturnCommand(CreateSalesReturnRequest Request) : IRequest<SalesReturnDto>;
public sealed record GetPrintInvoiceQuery(Guid SalesInvoiceId) : IRequest<PrintInvoiceDto>;
public sealed record ConfirmSalesInvoiceCommand(ConfirmSalesInvoiceRequest Request) : IRequest<SalesInvoiceDto>;
public sealed record CancelSalesInvoiceCommand(CancelSalesInvoiceRequest Request) : IRequest<bool>;
public sealed record ReturnSalesInvoiceCommand(ReturnSalesInvoiceRequest Request) : IRequest<SalesReturnDto>;
public sealed record PrintSalesInvoiceCommand(PrintSalesInvoiceRequest Request) : IRequest<PrintSalesInvoiceResponse>;

public sealed class SearchProductsQueryHandler : IRequestHandler<SearchProductsQuery, IReadOnlyList<ProductSearchResultDto>>
{
    private readonly IRepository<Product> _products;
    private readonly IRepository<InventoryStock> _stocks;

    public SearchProductsQueryHandler(IRepository<Product> products, IRepository<InventoryStock> stocks)
    {
        _products = products;
        _stocks = stocks;
    }

    public async Task<IReadOnlyList<ProductSearchResultDto>> Handle(SearchProductsQuery request, CancellationToken cancellationToken)
    {
        var term = request.Term.Trim().ToLowerInvariant();
        if (term.Length == 0) return [];

        var products = await _products.Query()
            .Include(x => x.Category)
            .Include(x => x.UnitOfMeasure)
            .Include(x => x.TaxSlab)
            .Include(x => x.Variants)
            .Where(x => x.ShopId == request.ShopId && x.IsActive &&
                (x.Name.ToLower().Contains(term) || x.Sku.ToLower().Contains(term) || (x.Barcode != null && x.Barcode.ToLower().Contains(term))))
            .OrderBy(x => x.Name)
            .Take(10)
            .ToListAsync(cancellationToken);

        var ids = products.Select(x => x.Id).ToArray();
        var stocks = await _stocks.Query()
            .Where(x => x.ShopId == request.ShopId && ids.Contains(x.ProductId))
            .GroupBy(x => new { x.ProductId, x.ProductVariantId })
            .Select(x => new { x.Key.ProductId, x.Key.ProductVariantId, Quantity = x.Sum(s => s.QuantityOnHand) })
            .ToListAsync(cancellationToken);

        return products.Select(product =>
        {
            var productStock = stocks.Where(x => x.ProductId == product.Id && x.ProductVariantId == null).Sum(x => x.Quantity);
            var batches = product.Variants
                .Select(variant => new ProductBatchOptionDto(
                    variant.Id,
                    variant.VariantName,
                    variant.SellingPrice,
                    TryReadExpiry(variant.AttributeJson),
                    stocks.FirstOrDefault(x => x.ProductId == product.Id && x.ProductVariantId == variant.Id)?.Quantity ?? 0))
                .ToList();

            return new ProductSearchResultDto(
                product.Id,
                null,
                product.Sku,
                product.Barcode,
                product.Name,
                product.Category?.Name ?? string.Empty,
                product.UnitOfMeasure?.Symbol ?? "pc",
                productStock + batches.Sum(x => x.StockQuantity),
                product.Mrp,
                product.SellingPrice,
                product.TaxSlab?.Rate ?? 0,
                product.HsnSacCode,
                product.MaxDiscountPercent,
                product.Category?.Name.Equals("Pharmacy", StringComparison.OrdinalIgnoreCase) == true && batches.Count > 0,
                batches);
        }).ToList();
    }

    private static DateTimeOffset? TryReadExpiry(string? attributeJson)
        => attributeJson is not null && attributeJson.Contains("expiry", StringComparison.OrdinalIgnoreCase)
            ? DateTimeOffset.TryParse(attributeJson.Split("expiry", StringSplitOptions.RemoveEmptyEntries).LastOrDefault()?.Trim(' ', '"', ':', '}', '{'), out var expiry) ? expiry : null
            : null;
}

public sealed class SearchCustomersQueryHandler : IRequestHandler<SearchCustomersQuery, IReadOnlyList<CustomerSearchResultDto>>
{
    private readonly IRepository<Customer> _customers;

    public SearchCustomersQueryHandler(IRepository<Customer> customers) => _customers = customers;

    public async Task<IReadOnlyList<CustomerSearchResultDto>> Handle(SearchCustomersQuery request, CancellationToken cancellationToken)
    {
        var term = request.Term.Trim().ToLowerInvariant();
        if (term.Length == 0) return [];

        return await _customers.Query()
            .Where(x => x.ShopId == request.ShopId && (x.Name.ToLower().Contains(term) || (x.Phone != null && x.Phone.Contains(term))))
            .OrderBy(x => x.Name)
            .Take(10)
            .Select(x => new CustomerSearchResultDto(x.Id, x.Name, x.Phone, x.Email, x.LoyaltyPoints, x.OutstandingBalance, x.CreditLimit))
            .ToListAsync(cancellationToken);
    }
}

public sealed class AddInlineCustomerCommandHandler : IRequestHandler<AddInlineCustomerCommand, CustomerSearchResultDto>
{
    private readonly IRepository<Customer> _customers;
    private readonly IUnitOfWork _unitOfWork;

    public AddInlineCustomerCommandHandler(IRepository<Customer> customers, IUnitOfWork unitOfWork)
    {
        _customers = customers;
        _unitOfWork = unitOfWork;
    }

    public async Task<CustomerSearchResultDto> Handle(AddInlineCustomerCommand request, CancellationToken cancellationToken)
    {
        var customer = new Customer
        {
            ShopId = request.Request.ShopId,
            Name = request.Request.Name.Trim(),
            Phone = request.Request.Phone.Trim(),
            Email = request.Request.Email,
            IsWalkIn = false
        };

        await _customers.AddAsync(customer, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return new CustomerSearchResultDto(customer.Id, customer.Name, customer.Phone, customer.Email, customer.LoyaltyPoints, customer.OutstandingBalance, customer.CreditLimit);
    }
}

public sealed class ValidateCouponQueryHandler : IRequestHandler<ValidateCouponQuery, CouponValidationDto>
{
    private readonly IRepository<Coupon> _coupons;

    public ValidateCouponQueryHandler(IRepository<Coupon> coupons) => _coupons = coupons;

    public async Task<CouponValidationDto> Handle(ValidateCouponQuery request, CancellationToken cancellationToken)
        => await BillingCalculator.ValidateCouponAsync(_coupons, request.Request.ShopId, request.Request.Code, request.Request.OrderAmount, cancellationToken);
}

public sealed class QuoteBillCommandHandler : IRequestHandler<QuoteBillCommand, BillQuoteDto>
{
    private readonly IRepository<Product> _products;
    private readonly IRepository<Coupon> _coupons;
    private readonly IRepository<Shop> _shops;
    private readonly IRepository<ShopSetting> _settings;

    public QuoteBillCommandHandler(IRepository<Product> products, IRepository<Coupon> coupons, IRepository<Shop> shops, IRepository<ShopSetting> settings)
    {
        _products = products;
        _coupons = coupons;
        _shops = shops;
        _settings = settings;
    }

    public async Task<BillQuoteDto> Handle(QuoteBillCommand request, CancellationToken cancellationToken)
    {
        var quote = await BillingCalculator.CalculateAsync(_products, _coupons, _shops, _settings, request.Request.ShopId, request.Request.Items, request.Request.BillDiscountType, request.Request.BillDiscountValue, request.Request.CouponCode, request.Request.IsInterstate, 0, cancellationToken);
        return new BillQuoteDto(quote.Totals, quote.TaxBreakup, quote.Coupon);
    }
}

public sealed class CreateSaleInvoiceCommandHandler : IRequestHandler<CreateSaleInvoiceCommand, SaleInvoiceDetailDto>
{
    private readonly IRepository<SalesInvoice> _invoices;
    private readonly IRepository<Product> _products;
    private readonly IRepository<InventoryStock> _stocks;
    private readonly IRepository<InventoryMovement> _movements;
    private readonly IRepository<Coupon> _coupons;
    private readonly IRepository<Shop> _shops;
    private readonly IRepository<ShopSetting> _settings;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public CreateSaleInvoiceCommandHandler(
        IRepository<SalesInvoice> invoices,
        IRepository<Product> products,
        IRepository<InventoryStock> stocks,
        IRepository<InventoryMovement> movements,
        IRepository<Coupon> coupons,
        IRepository<Shop> shops,
        IRepository<ShopSetting> settings,
        IUnitOfWork unitOfWork,
        IMapper mapper)
    {
        _invoices = invoices;
        _products = products;
        _stocks = stocks;
        _movements = movements;
        _coupons = coupons;
        _shops = shops;
        _settings = settings;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<SaleInvoiceDetailDto> Handle(CreateSaleInvoiceCommand request, CancellationToken cancellationToken)
    {
        if (request.Request.Items.Count == 0)
            throw new InvalidOperationException("At least one invoice item is required.");

        var amountTendered = request.Request.Payments.Sum(x => x.Amount);
        var calculation = await BillingCalculator.CalculateAsync(_products, _coupons, _shops, _settings, request.Request.ShopId, request.Request.Items, request.Request.BillDiscountType, request.Request.BillDiscountValue, request.Request.CouponCode, false, amountTendered, cancellationToken);
        var invoiceCount = await _invoices.Query().CountAsync(x => x.ShopId == request.Request.ShopId, cancellationToken);
        var invoice = new SalesInvoice
        {
            ShopId = request.Request.ShopId,
            CustomerId = request.Request.CustomerId,
            InvoiceNumber = $"INV-{DateTimeOffset.UtcNow:yyyyMMdd}-{invoiceCount + 1:0000}",
            InvoiceDate = DateTimeOffset.UtcNow,
            Status = request.Request.Confirm ? SalesInvoiceStatus.Confirmed : SalesInvoiceStatus.Draft,
            PaymentStatus = amountTendered >= calculation.Totals.GrandTotal ? PaymentStatus.Paid : amountTendered > 0 ? PaymentStatus.Partial : PaymentStatus.Pending,
            SubTotal = calculation.Totals.SubTotal,
            ItemDiscountTotal = calculation.Totals.ItemDiscountTotal,
            BillDiscountType = request.Request.BillDiscountType,
            BillDiscountValue = request.Request.BillDiscountValue,
            BillDiscountAmount = calculation.Totals.BillDiscountAmount,
            CouponCode = calculation.Coupon?.IsValid == true ? calculation.Coupon.Code : null,
            CouponDiscountAmount = calculation.Totals.CouponDiscountAmount,
            DiscountTotal = calculation.Totals.ItemDiscountTotal + calculation.Totals.BillDiscountAmount + calculation.Totals.CouponDiscountAmount,
            TaxableAmount = calculation.Totals.TaxableAmount,
            TaxTotal = calculation.Totals.TaxTotal,
            RoundOff = calculation.Totals.RoundOff,
            GrandTotal = calculation.Totals.GrandTotal,
            Notes = string.IsNullOrWhiteSpace(request.Request.WalkInCustomerName) ? request.Request.Notes : $"Walk-in: {request.Request.WalkInCustomerName}. {request.Request.Notes}".Trim()
        };

        foreach (var line in calculation.Lines)
        {
            invoice.Items.Add(new SalesInvoiceItem
            {
                ProductId = line.Request.ProductId,
                ProductVariantId = line.Request.ProductVariantId,
                Description = line.Product.Name,
                Quantity = line.Request.Quantity,
                UnitPrice = line.Request.UnitPrice,
                DiscountAmount = line.ItemDiscountAmount,
                TaxRate = line.TaxRate,
                TaxAmount = line.TaxAmount,
                LineTotal = line.LineTotal
            });

            if (request.Request.Confirm && line.Product.IsStockTracked)
            {
                var stock = await _stocks.Query().FirstOrDefaultAsync(
                    x => x.ShopId == invoice.ShopId && x.ProductId == line.Product.Id && x.ProductVariantId == line.Request.ProductVariantId,
                    cancellationToken);

                if (stock is not null)
                {
                    stock.QuantityOnHand -= line.Request.Quantity;
                    stock.LastMovementAt = DateTimeOffset.UtcNow;
                }

                await _movements.AddAsync(new InventoryMovement
                {
                    ShopId = invoice.ShopId,
                    ProductId = line.Product.Id,
                    ProductVariantId = line.Request.ProductVariantId,
                    MovementType = StockMovementType.Sale,
                    Quantity = line.Request.Quantity,
                    UnitCost = line.Product.CostPrice,
                    ReferenceType = nameof(SalesInvoice),
                    ReferenceId = invoice.Id
                }, cancellationToken);
            }
        }

        foreach (var payment in request.Request.Payments.Where(x => x.Amount > 0))
        {
            invoice.Payments.Add(new Payment
            {
                ShopId = invoice.ShopId,
                Method = payment.Method,
                Amount = payment.Amount,
                ReferenceNumber = payment.ReferenceNumber,
                Details = payment.Details
            });
        }

        if (invoice.CouponCode is not null)
        {
            var coupon = await _coupons.Query().FirstOrDefaultAsync(x => x.ShopId == invoice.ShopId && x.Code == invoice.CouponCode, cancellationToken);
            if (coupon is not null) coupon.UsedCount += 1;
        }

        await _invoices.AddAsync(invoice, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new SaleInvoiceDetailDto(
            _mapper.Map<SalesInvoiceDto>(invoice),
            _mapper.Map<IReadOnlyList<SalesInvoiceItemDto>>(invoice.Items),
            _mapper.Map<IReadOnlyList<PaymentDto>>(invoice.Payments),
            calculation.Totals,
            calculation.TaxBreakup);
    }
}

public sealed class BillHistoryQueryCommandHandler : IRequestHandler<BillHistoryQueryCommand, IReadOnlyList<BillHistoryRowDto>>
{
    private readonly IRepository<SalesInvoice> _invoices;

    public BillHistoryQueryCommandHandler(IRepository<SalesInvoice> invoices) => _invoices = invoices;

    public async Task<IReadOnlyList<BillHistoryRowDto>> Handle(BillHistoryQueryCommand request, CancellationToken cancellationToken)
    {
        var query = _invoices.Query().Include(x => x.Customer).Include(x => x.Items).Include(x => x.Payments).Where(x => x.ShopId == request.Query.ShopId);
        if (request.Query.From is not null) query = query.Where(x => x.InvoiceDate >= request.Query.From);
        if (request.Query.To is not null) query = query.Where(x => x.InvoiceDate <= request.Query.To);
        if (request.Query.CustomerId is not null) query = query.Where(x => x.CustomerId == request.Query.CustomerId);
        if (request.Query.Status is not null) query = query.Where(x => x.Status == request.Query.Status);
        if (request.Query.PaymentMode is not null) query = query.Where(x => x.Payments.Any(p => p.Method == request.Query.PaymentMode));
        if (!string.IsNullOrWhiteSpace(request.Query.Search)) query = query.Where(x => x.InvoiceNumber.Contains(request.Query.Search));

        return await query
            .OrderByDescending(x => x.InvoiceDate)
            .Take(250)
            .Select(x => new BillHistoryRowDto(
                x.Id,
                x.InvoiceNumber,
                x.InvoiceDate,
                x.Customer != null ? x.Customer.Name : "Walk-in Customer",
                x.Items.Count,
                x.GrandTotal,
                string.Join(", ", x.Payments.Select(p => p.Method.ToString())),
                x.Status))
            .ToListAsync(cancellationToken);
    }
}

public sealed class GetSalesInvoiceForReturnQueryHandler : IRequestHandler<GetSalesInvoiceForReturnQuery, SalesReturnLookupDto>
{
    private readonly IRepository<SalesInvoice> _invoices;
    private readonly IMapper _mapper;

    public GetSalesInvoiceForReturnQueryHandler(IRepository<SalesInvoice> invoices, IMapper mapper)
    {
        _invoices = invoices;
        _mapper = mapper;
    }

    public async Task<SalesReturnLookupDto> Handle(GetSalesInvoiceForReturnQuery request, CancellationToken cancellationToken)
    {
        var invoice = await _invoices.Query().Include(x => x.Items).FirstOrDefaultAsync(x => x.Id == request.SalesInvoiceId || x.InvoiceNumber == request.SalesInvoiceId.ToString(), cancellationToken)
            ?? throw new KeyNotFoundException("Sales invoice not found.");
        return new SalesReturnLookupDto(_mapper.Map<SalesInvoiceDto>(invoice), _mapper.Map<IReadOnlyList<SalesInvoiceItemDto>>(invoice.Items));
    }
}

public sealed class FindSalesInvoiceForReturnQueryHandler : IRequestHandler<FindSalesInvoiceForReturnQuery, SalesReturnLookupDto>
{
    private readonly IRepository<SalesInvoice> _invoices;
    private readonly IMapper _mapper;

    public FindSalesInvoiceForReturnQueryHandler(IRepository<SalesInvoice> invoices, IMapper mapper)
    {
        _invoices = invoices;
        _mapper = mapper;
    }

    public async Task<SalesReturnLookupDto> Handle(FindSalesInvoiceForReturnQuery request, CancellationToken cancellationToken)
    {
        var billNo = request.BillNo.Trim();
        var invoice = await _invoices.Query()
            .Include(x => x.Items)
            .FirstOrDefaultAsync(x => x.ShopId == request.ShopId && x.InvoiceNumber == billNo, cancellationToken)
            ?? throw new KeyNotFoundException("Sales invoice not found.");

        return new SalesReturnLookupDto(_mapper.Map<SalesInvoiceDto>(invoice), _mapper.Map<IReadOnlyList<SalesInvoiceItemDto>>(invoice.Items));
    }
}

public sealed class CreateSalesReturnCommandHandler : IRequestHandler<CreateSalesReturnCommand, SalesReturnDto>
{
    private readonly IRepository<SalesInvoice> _invoices;
    private readonly IRepository<SalesReturn> _returns;
    private readonly IRepository<InventoryStock> _stocks;
    private readonly IRepository<InventoryMovement> _movements;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public CreateSalesReturnCommandHandler(IRepository<SalesInvoice> invoices, IRepository<SalesReturn> returns, IRepository<InventoryStock> stocks, IRepository<InventoryMovement> movements, IUnitOfWork unitOfWork, IMapper mapper)
    {
        _invoices = invoices;
        _returns = returns;
        _stocks = stocks;
        _movements = movements;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<SalesReturnDto> Handle(CreateSalesReturnCommand request, CancellationToken cancellationToken)
    {
        var invoice = await _invoices.Query().Include(x => x.Items).ThenInclude(x => x.Product).FirstOrDefaultAsync(x => x.Id == request.Request.SalesInvoiceId, cancellationToken)
            ?? throw new KeyNotFoundException("Sales invoice not found.");
        var next = await _returns.Query().CountAsync(x => x.ShopId == invoice.ShopId, cancellationToken) + 1;
        var salesReturn = new SalesReturn
        {
            ShopId = invoice.ShopId,
            SalesInvoiceId = invoice.Id,
            CreditNoteNumber = $"CR-{DateTimeOffset.UtcNow:yyyyMMdd}-{next:0000}",
            Status = ReturnStatus.Approved,
            Reason = $"{request.Request.Reason} | Refund: {request.Request.RefundMode}"
        };

        foreach (var returnItem in request.Request.Items)
        {
            var invoiceItem = invoice.Items.FirstOrDefault(x => x.Id == returnItem.SalesInvoiceItemId)
                ?? throw new KeyNotFoundException("Sales invoice item not found.");
            if (returnItem.Quantity <= 0 || returnItem.Quantity > invoiceItem.Quantity)
                throw new InvalidOperationException("Invalid return quantity.");

            salesReturn.Items.Add(new SalesReturnItem
            {
                ProductId = invoiceItem.ProductId,
                Quantity = returnItem.Quantity,
                UnitPrice = invoiceItem.UnitPrice,
                RefundAmount = returnItem.RefundAmount
            });
            salesReturn.RefundAmount += returnItem.RefundAmount;

            if (invoiceItem.Product?.IsStockTracked == true)
            {
                var stock = await _stocks.Query().FirstOrDefaultAsync(x => x.ShopId == invoice.ShopId && x.ProductId == invoiceItem.ProductId && x.ProductVariantId == invoiceItem.ProductVariantId, cancellationToken);
                if (stock is null)
                {
                    stock = new InventoryStock { ShopId = invoice.ShopId, ProductId = invoiceItem.ProductId, ProductVariantId = invoiceItem.ProductVariantId };
                    await _stocks.AddAsync(stock, cancellationToken);
                }

                stock.QuantityOnHand += returnItem.Quantity;
                stock.LastMovementAt = DateTimeOffset.UtcNow;
                await _movements.AddAsync(new InventoryMovement
                {
                    ShopId = invoice.ShopId,
                    ProductId = invoiceItem.ProductId,
                    ProductVariantId = invoiceItem.ProductVariantId,
                    MovementType = StockMovementType.Return,
                    Quantity = returnItem.Quantity,
                    UnitCost = invoiceItem.Product.CostPrice,
                    ReferenceType = nameof(SalesReturn),
                    ReferenceId = salesReturn.Id,
                    Notes = request.Request.Reason
                }, cancellationToken);
            }
        }

        await _returns.AddAsync(salesReturn, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return _mapper.Map<SalesReturnDto>(salesReturn);
    }
}

public sealed class GetPrintInvoiceQueryHandler : IRequestHandler<GetPrintInvoiceQuery, PrintInvoiceDto>
{
    private readonly IRepository<SalesInvoice> _invoices;

    public GetPrintInvoiceQueryHandler(IRepository<SalesInvoice> invoices) => _invoices = invoices;

    public async Task<PrintInvoiceDto> Handle(GetPrintInvoiceQuery request, CancellationToken cancellationToken)
    {
        var invoice = await _invoices.Query()
            .Include(x => x.Shop)
            .Include(x => x.Customer)
            .Include(x => x.Items)
            .ThenInclude(x => x.Product)
            .Include(x => x.Payments)
            .FirstOrDefaultAsync(x => x.Id == request.SalesInvoiceId, cancellationToken)
            ?? throw new KeyNotFoundException("Sales invoice not found.");

        var summary = $"{invoice.Shop?.Name} {invoice.InvoiceNumber} Total {invoice.GrandTotal:0.00}";
        return new PrintInvoiceDto(
            invoice.InvoiceNumber,
            PrintTemplate(invoice, "a4"),
            PrintTemplate(invoice, "80"),
            PrintTemplate(invoice, "58"),
            $"https://wa.me/?text={Uri.EscapeDataString(summary)}",
            invoice.Customer?.Email);
    }

    private static string PrintTemplate(SalesInvoice invoice, string mode)
    {
        var compact = mode != "a4";
        var width = mode == "58" ? "58mm" : mode == "80" ? "80mm" : "210mm";
        var rows = string.Join("", invoice.Items.Select(item => $"<tr><td>{WebUtility.HtmlEncode(item.Description)}<br><small>{WebUtility.HtmlEncode(item.Product?.HsnSacCode ?? "")}</small></td><td>{item.Quantity:0.##}</td><td>{item.TaxRate:0.##}%</td><td>{item.LineTotal:0.00}</td></tr>"));
        return $$"""
        <html><head><style>
        body{font-family:Arial,sans-serif;width:{{width}};margin:0 auto;color:#111;font-size:{{(compact ? "11px" : "13px")}};}
        h1,h2,p{margin:0 0 4px;text-align:center;} table{width:100%;border-collapse:collapse;margin-top:8px;}
        th,td{border-bottom:1px solid #ddd;padding:4px;text-align:right;} th:first-child,td:first-child{text-align:left;}
        .totals{margin-top:8px;display:grid;gap:3px;} .totals div{display:flex;justify-content:space-between;}
        .grand{font-size:{{(compact ? "14px" : "18px")}};font-weight:700;}
        </style></head><body>
        <h1>{{WebUtility.HtmlEncode(invoice.Shop?.Name ?? "BillEase Pro")}}</h1>
        <p>{{WebUtility.HtmlEncode(invoice.Shop?.AddressLine1 ?? "")}}, {{WebUtility.HtmlEncode(invoice.Shop?.City ?? "")}}</p>
        <p>GSTIN {{WebUtility.HtmlEncode(invoice.Shop?.TaxRegistrationNumber ?? "")}}</p>
        <h2>{{(compact ? "Bill" : "Tax Invoice")}} #{{invoice.InvoiceNumber}}</h2>
        <p>{{invoice.InvoiceDate.ToString("dd MMM yyyy HH:mm", CultureInfo.InvariantCulture)}}</p>
        <table><thead><tr><th>Item</th><th>Qty</th><th>Tax</th><th>Total</th></tr></thead><tbody>{{rows}}</tbody></table>
        <section class="totals">
        <div><span>Subtotal</span><strong>{{invoice.SubTotal.ToString("0.00", CultureInfo.InvariantCulture)}}</strong></div>
        <div><span>Discount</span><strong>{{invoice.DiscountTotal.ToString("0.00", CultureInfo.InvariantCulture)}}</strong></div>
        <div><span>Tax</span><strong>{{invoice.TaxTotal.ToString("0.00", CultureInfo.InvariantCulture)}}</strong></div>
        <div><span>Round off</span><strong>{{invoice.RoundOff.ToString("0.00", CultureInfo.InvariantCulture)}}</strong></div>
        <div class="grand"><span>Total</span><strong>{{invoice.GrandTotal.ToString("0.00", CultureInfo.InvariantCulture)}}</strong></div>
        </section>
        {{(compact ? "" : "<p>Terms: Goods once sold are subject to store return policy.</p>")}}
        <p>Thank you for your business.</p>
        </body></html>
        """;
    }
}

public sealed class ConfirmSalesInvoiceCommandHandler : IRequestHandler<ConfirmSalesInvoiceCommand, SalesInvoiceDto>
{
    private readonly IRepository<SalesInvoice> _invoices;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public ConfirmSalesInvoiceCommandHandler(IRepository<SalesInvoice> invoices, IUnitOfWork unitOfWork, IMapper mapper)
    {
        _invoices = invoices;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<SalesInvoiceDto> Handle(ConfirmSalesInvoiceCommand request, CancellationToken cancellationToken)
    {
        var invoice = await _invoices.GetByIdAsync(request.Request.SalesInvoiceId, cancellationToken)
            ?? throw new KeyNotFoundException("Sales invoice not found.");
        if (invoice.Status == SalesInvoiceStatus.Confirmed) throw new InvalidOperationException("Sales invoice is already confirmed.");
        if (invoice.Status == SalesInvoiceStatus.Cancelled) throw new InvalidOperationException("Cannot confirm a cancelled sales invoice.");
        invoice.Status = SalesInvoiceStatus.Confirmed;
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return _mapper.Map<SalesInvoiceDto>(invoice);
    }
}

public sealed class CancelSalesInvoiceCommandHandler : IRequestHandler<CancelSalesInvoiceCommand, bool>
{
    private readonly IRepository<SalesInvoice> _invoices;
    private readonly IUnitOfWork _unitOfWork;

    public CancelSalesInvoiceCommandHandler(IRepository<SalesInvoice> invoices, IUnitOfWork unitOfWork)
    {
        _invoices = invoices;
        _unitOfWork = unitOfWork;
    }

    public async Task<bool> Handle(CancelSalesInvoiceCommand request, CancellationToken cancellationToken)
    {
        var invoice = await _invoices.GetByIdAsync(request.Request.SalesInvoiceId, cancellationToken)
            ?? throw new KeyNotFoundException("Sales invoice not found.");
        invoice.Status = SalesInvoiceStatus.Cancelled;
        invoice.Notes = string.IsNullOrWhiteSpace(request.Request.Reason) ? invoice.Notes : $"{invoice.Notes} Cancel: {request.Request.Reason}";
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }
}

public sealed class ReturnSalesInvoiceCommandHandler : IRequestHandler<ReturnSalesInvoiceCommand, SalesReturnDto>
{
    private readonly IMediator _mediator;

    public ReturnSalesInvoiceCommandHandler(IMediator mediator) => _mediator = mediator;

    public Task<SalesReturnDto> Handle(ReturnSalesInvoiceCommand request, CancellationToken cancellationToken)
        => _mediator.Send(new CreateSalesReturnCommand(new CreateSalesReturnRequest(request.Request.SalesInvoiceId, request.Request.Items, request.Request.Reason ?? "Customer Request", "Original Payment Mode")), cancellationToken);
}

public sealed class PrintSalesInvoiceCommandHandler : IRequestHandler<PrintSalesInvoiceCommand, PrintSalesInvoiceResponse>
{
    private readonly IMediator _mediator;

    public PrintSalesInvoiceCommandHandler(IMediator mediator) => _mediator = mediator;

    public async Task<PrintSalesInvoiceResponse> Handle(PrintSalesInvoiceCommand request, CancellationToken cancellationToken)
    {
        var print = await _mediator.Send(new GetPrintInvoiceQuery(request.Request.SalesInvoiceId), cancellationToken);
        return new PrintSalesInvoiceResponse(print.InvoiceNumber, print.A4Html);
    }
}

internal static class BillingCalculator
{
    internal sealed record CalculatedLine(CreateSaleInvoiceItemRequest Request, Product Product, decimal Gross, decimal ItemDiscountAmount, decimal AllocatedBillDiscount, decimal AllocatedCouponDiscount, decimal TaxableAmount, decimal TaxRate, decimal TaxAmount, decimal LineTotal);
    internal sealed record CalculationResult(IReadOnlyList<CalculatedLine> Lines, BillTotalsDto Totals, IReadOnlyList<TaxBreakupDto> TaxBreakup, CouponValidationDto? Coupon);

    public static async Task<CouponValidationDto> ValidateCouponAsync(IRepository<Coupon> coupons, Guid shopId, string code, decimal orderAmount, CancellationToken cancellationToken)
    {
        var coupon = await coupons.Query().FirstOrDefaultAsync(x => x.ShopId == shopId && x.Code == code.Trim().ToUpper(), cancellationToken);
        if (coupon is null || !coupon.IsActive) return new CouponValidationDto(false, code, 0, "Coupon not found.");
        if (coupon.ValidFrom > DateTimeOffset.UtcNow || coupon.ValidTo < DateTimeOffset.UtcNow) return new CouponValidationDto(false, code, 0, "Coupon is not active.");
        if (orderAmount < coupon.MinOrderAmount) return new CouponValidationDto(false, code, 0, $"Minimum order is {coupon.MinOrderAmount:0.00}.");
        if (coupon.UsageLimit is not null && coupon.UsedCount >= coupon.UsageLimit) return new CouponValidationDto(false, code, 0, "Coupon usage limit reached.");

        var discount = coupon.ValueType == DiscountValueType.Percentage ? orderAmount * coupon.Value / 100 : coupon.Value;
        if (coupon.MaxDiscountAmount is not null) discount = Math.Min(discount, coupon.MaxDiscountAmount.Value);
        return new CouponValidationDto(true, coupon.Code, Math.Round(Math.Min(discount, orderAmount), 2), null);
    }

    public static async Task<CalculationResult> CalculateAsync(
        IRepository<Product> products,
        IRepository<Coupon> coupons,
        IRepository<Shop> shops,
        IRepository<ShopSetting> settings,
        Guid shopId,
        IReadOnlyList<CreateSaleInvoiceItemRequest> items,
        DiscountValueType? billDiscountType,
        decimal billDiscountValue,
        string? couponCode,
        bool isInterstate,
        decimal amountTendered,
        CancellationToken cancellationToken)
    {
        var productIds = items.Select(x => x.ProductId).Distinct().ToArray();
        var productMap = await products.Query().Include(x => x.TaxSlab).Where(x => productIds.Contains(x.Id)).ToDictionaryAsync(x => x.Id, cancellationToken);
        var shop = await shops.GetByIdAsync(shopId, cancellationToken) ?? throw new KeyNotFoundException("Shop not found.");
        var shopSettings = await settings.Query().Where(x => x.ShopId == shopId).ToDictionaryAsync(x => x.Key, x => x.Value, cancellationToken);
        var taxModeInclusive = string.Equals(GetSetting(shopSettings, "TaxMode", "Exclusive"), "Inclusive", StringComparison.OrdinalIgnoreCase);
        var roundOffEnabled = !string.Equals(GetSetting(shopSettings, "RoundOff", "true"), "false", StringComparison.OrdinalIgnoreCase);
        var interstate = isInterstate || string.Equals(GetSetting(shopSettings, "IsInterstate", "false"), "true", StringComparison.OrdinalIgnoreCase);
        var taxDisabled = shop.TaxRegime == TaxRegime.Other || string.Equals(GetSetting(shopSettings, "TaxRegime", shop.TaxRegime.ToString()), "No Tax", StringComparison.OrdinalIgnoreCase);

        var preliminary = items.Select(item =>
        {
            if (!productMap.TryGetValue(item.ProductId, out var product)) throw new KeyNotFoundException($"Product '{item.ProductId}' was not found.");
            var gross = Math.Round(item.Quantity * item.UnitPrice, 2);
            var rawDiscount = item.DiscountType == DiscountValueType.Percentage ? gross * item.DiscountValue / 100 : item.DiscountValue;
            var maxDiscount = gross * product.MaxDiscountPercent / 100;
            var itemDiscount = Math.Round(Math.Min(Math.Max(0, rawDiscount), maxDiscount), 2);
            return new { item, product, gross, itemDiscount, afterItem = gross - itemDiscount };
        }).ToList();

        var subTotal = preliminary.Sum(x => x.gross);
        var itemDiscountTotal = preliminary.Sum(x => x.itemDiscount);
        var afterItemDiscount = preliminary.Sum(x => x.afterItem);
        var billDiscount = billDiscountType == DiscountValueType.Percentage ? afterItemDiscount * billDiscountValue / 100 : billDiscountType is null ? 0 : billDiscountValue;
        billDiscount = Math.Round(Math.Min(Math.Max(0, billDiscount), afterItemDiscount), 2);
        var afterBillDiscount = afterItemDiscount - billDiscount;
        CouponValidationDto? coupon = null;
        var couponDiscount = 0m;
        if (!string.IsNullOrWhiteSpace(couponCode))
        {
            coupon = await ValidateCouponAsync(coupons, shopId, couponCode, afterBillDiscount, cancellationToken);
            couponDiscount = coupon.IsValid ? coupon.DiscountAmount : 0;
        }

        var taxGroups = new Dictionary<decimal, (decimal taxable, decimal cgst, decimal sgst, decimal igst, decimal totalTax)>();
        var lines = new List<CalculatedLine>();
        foreach (var row in preliminary)
        {
            var ratio = afterItemDiscount == 0 ? 0 : row.afterItem / afterItemDiscount;
            var allocatedBill = Math.Round(billDiscount * ratio, 2);
            var allocatedCoupon = Math.Round(couponDiscount * ratio, 2);
            var discounted = Math.Max(0, row.afterItem - allocatedBill - allocatedCoupon);
            var rate = taxDisabled ? 0 : row.item.TaxRate != 0 ? row.item.TaxRate : row.product.TaxSlab?.Rate ?? 0;
            var tax = taxModeInclusive || row.product.IsTaxInclusive ? discounted * rate / (100 + rate) : discounted * rate / 100;
            tax = Math.Round(tax, 2);
            var taxable = taxModeInclusive || row.product.IsTaxInclusive ? discounted - tax : discounted;
            var lineTotal = taxModeInclusive || row.product.IsTaxInclusive ? discounted : discounted + tax;
            var cgst = !interstate ? Math.Round(tax / 2, 2) : 0;
            var sgst = !interstate ? tax - cgst : 0;
            var igst = interstate ? tax : 0;
            taxGroups[rate] = taxGroups.TryGetValue(rate, out var existing)
                ? (existing.taxable + taxable, existing.cgst + cgst, existing.sgst + sgst, existing.igst + igst, existing.totalTax + tax)
                : (taxable, cgst, sgst, igst, tax);

            lines.Add(new CalculatedLine(row.item, row.product, row.gross, row.itemDiscount, allocatedBill, allocatedCoupon, Math.Round(taxable, 2), rate, tax, Math.Round(lineTotal, 2)));
        }

        var taxableAmount = Math.Round(lines.Sum(x => x.TaxableAmount), 2);
        var taxTotal = Math.Round(lines.Sum(x => x.TaxAmount), 2);
        var beforeRoundOff = Math.Round(lines.Sum(x => x.LineTotal), 2);
        var rounded = roundOffEnabled ? Math.Round(beforeRoundOff, 0, MidpointRounding.AwayFromZero) : beforeRoundOff;
        var roundOff = Math.Round(rounded - beforeRoundOff, 2);
        var totals = new BillTotalsDto(
            Math.Round(subTotal, 2),
            Math.Round(itemDiscountTotal, 2),
            billDiscount,
            couponDiscount,
            taxableAmount,
            taxTotal,
            Math.Round(taxGroups.Values.Sum(x => x.cgst), 2),
            Math.Round(taxGroups.Values.Sum(x => x.sgst), 2),
            Math.Round(taxGroups.Values.Sum(x => x.igst), 2),
            roundOff,
            rounded,
            amountTendered,
            Math.Max(0, amountTendered - rounded));

        var breakup = taxGroups
            .OrderBy(x => x.Key)
            .Select(x => new TaxBreakupDto(x.Key, Math.Round(x.Value.taxable, 2), Math.Round(x.Value.cgst, 2), Math.Round(x.Value.sgst, 2), Math.Round(x.Value.igst, 2), Math.Round(x.Value.totalTax, 2)))
            .ToList();

        return new CalculationResult(lines, totals, breakup, coupon);
    }

    private static string GetSetting(Dictionary<string, string> settings, string key, string fallback)
        => settings.TryGetValue(key, out var value) ? value : fallback;
}
