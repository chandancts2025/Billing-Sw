using Asp.Versioning;
using BillEasePro.Application.Dtos;
using BillEasePro.Application.Features.Billing;
using BillEasePro.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BillEasePro.Api.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Authorize(Policy = "OperatorOrAbove")]
[Route("api/v{version:apiVersion}/billing")]
public sealed class BillingController : ControllerBase
{
    private readonly IMediator _mediator;

    public BillingController(IMediator mediator) => _mediator = mediator;

    [HttpGet("products/search")]
    public Task<IReadOnlyList<ProductSearchResultDto>> SearchProducts(Guid shopId, string term, CancellationToken cancellationToken)
        => _mediator.Send(new SearchProductsQuery(shopId, term), cancellationToken);

    [HttpGet("customers/search")]
    public Task<IReadOnlyList<CustomerSearchResultDto>> SearchCustomers(Guid shopId, string term, CancellationToken cancellationToken)
        => _mediator.Send(new SearchCustomersQuery(shopId, term), cancellationToken);

    [HttpPost("customers")]
    public Task<CustomerSearchResultDto> AddCustomer(AddInlineCustomerRequest request, CancellationToken cancellationToken)
        => _mediator.Send(new AddInlineCustomerCommand(request), cancellationToken);

    [HttpPost("quote")]
    public Task<BillQuoteDto> Quote(BillQuoteRequest request, CancellationToken cancellationToken)
        => _mediator.Send(new QuoteBillCommand(request), cancellationToken);

    [HttpPost("coupon/validate")]
    public Task<CouponValidationDto> ValidateCoupon(CouponValidationRequest request, CancellationToken cancellationToken)
        => _mediator.Send(new ValidateCouponQuery(request), cancellationToken);

    [HttpPost("sales")]
    public Task<SaleInvoiceDetailDto> CreateSaleInvoice(CreateSaleInvoiceRequest request, CancellationToken cancellationToken)
        => _mediator.Send(new CreateSaleInvoiceCommand(request), cancellationToken);

    [HttpGet("sales/history")]
    public Task<IReadOnlyList<BillHistoryRowDto>> History(
        Guid shopId,
        DateTimeOffset? from,
        DateTimeOffset? to,
        Guid? customerId,
        PaymentMethod? paymentMode,
        SalesInvoiceStatus? status,
        string? search,
        CancellationToken cancellationToken)
        => _mediator.Send(new BillHistoryQueryCommand(new BillHistoryQuery(shopId, from, to, customerId, paymentMode, status, search)), cancellationToken);

    [HttpPost("sales/{salesInvoiceId:guid}/confirm")]
    public Task<SalesInvoiceDto> ConfirmSalesInvoice(Guid salesInvoiceId, CancellationToken cancellationToken)
        => _mediator.Send(new ConfirmSalesInvoiceCommand(new ConfirmSalesInvoiceRequest(salesInvoiceId)), cancellationToken);

    [HttpPost("sales/{salesInvoiceId:guid}/cancel")]
    public Task<bool> CancelSalesInvoice(Guid salesInvoiceId, [FromBody] CancelSalesInvoiceRequest request, CancellationToken cancellationToken)
        => _mediator.Send(new CancelSalesInvoiceCommand(new CancelSalesInvoiceRequest(salesInvoiceId, request.Reason)), cancellationToken);

    [HttpPost("sales/{salesInvoiceId:guid}/return")]
    public Task<SalesReturnDto> ReturnSalesInvoice(Guid salesInvoiceId, ReturnSalesInvoiceRequest request, CancellationToken cancellationToken)
        => _mediator.Send(new ReturnSalesInvoiceCommand(new ReturnSalesInvoiceRequest(salesInvoiceId, request.Items, request.Reason)), cancellationToken);

    [HttpGet("sales/{salesInvoiceId:guid}/return")]
    public Task<SalesReturnLookupDto> GetForReturn(Guid salesInvoiceId, CancellationToken cancellationToken)
        => _mediator.Send(new GetSalesInvoiceForReturnQuery(salesInvoiceId), cancellationToken);

    [HttpGet("sales/return-lookup")]
    public Task<SalesReturnLookupDto> FindForReturn(Guid shopId, string billNo, CancellationToken cancellationToken)
        => _mediator.Send(new FindSalesInvoiceForReturnQuery(shopId, billNo), cancellationToken);

    [HttpPost("returns")]
    public Task<SalesReturnDto> CreateReturn(CreateSalesReturnRequest request, CancellationToken cancellationToken)
        => _mediator.Send(new CreateSalesReturnCommand(request), cancellationToken);

    [HttpGet("sales/{salesInvoiceId:guid}/print")]
    public Task<PrintInvoiceDto> GetPrintInvoice(Guid salesInvoiceId, CancellationToken cancellationToken)
        => _mediator.Send(new GetPrintInvoiceQuery(salesInvoiceId), cancellationToken);

    [HttpPost("sales/{salesInvoiceId:guid}/print")]
    public Task<PrintSalesInvoiceResponse> PrintSalesInvoice(Guid salesInvoiceId, CancellationToken cancellationToken)
        => _mediator.Send(new PrintSalesInvoiceCommand(new PrintSalesInvoiceRequest(salesInvoiceId)), cancellationToken);
}
