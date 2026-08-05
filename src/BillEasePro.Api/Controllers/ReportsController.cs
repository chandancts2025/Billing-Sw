using Asp.Versioning;
using BillEasePro.Application.Dtos;
using BillEasePro.Application.Features.Reports;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BillEasePro.Api.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Authorize(Policy = "OperatorOrAbove")]
[Route("api/v{version:apiVersion}/reports")]
public sealed class ReportsController : ControllerBase
{
    private readonly IMediator _mediator;

    public ReportsController(IMediator mediator) => _mediator = mediator;

    [HttpGet("catalog")]
    public Task<ReportCatalogDto> Catalog(CancellationToken cancellationToken)
        => _mediator.Send(new ReportCatalogQuery(), cancellationToken);

    [HttpPost("run")]
    public Task<ReportResultDto> Run(ReportRequestDto request, CancellationToken cancellationToken)
        => _mediator.Send(new RunReportQuery(request), cancellationToken);

    [HttpGet("dashboard")]
    [Authorize(Policy = "AdminOnly")]
    public Task<AnalyticsDashboardDto> Dashboard(Guid shopId, CancellationToken cancellationToken)
        => _mediator.Send(new AnalyticsDashboardQuery(shopId), cancellationToken);

    [HttpGet("sales-summary")]
    public Task<SalesSummaryDto> SalesSummary(Guid shopId, DateTimeOffset from, DateTimeOffset to, CancellationToken cancellationToken)
        => _mediator.Send(new SalesSummaryQuery(shopId, from, to), cancellationToken);

    [HttpGet("profit-loss")]
    [Authorize(Policy = "AdminOnly")]
    public Task<ProfitLossDto> ProfitLoss(Guid shopId, DateTimeOffset from, DateTimeOffset to, CancellationToken cancellationToken)
        => _mediator.Send(new ProfitLossQuery(shopId, from, to), cancellationToken);

    [HttpGet("inventory-valuation")]
    [Authorize(Policy = "AdminOnly")]
    public Task<IReadOnlyList<InventoryValuationDto>> InventoryValuation(Guid shopId, CancellationToken cancellationToken)
        => _mediator.Send(new InventoryValuationQuery(shopId), cancellationToken);

    [HttpGet("customer-ledger/{customerId:guid}")]
    public Task<CustomerLedgerDto> CustomerLedger(Guid shopId, Guid customerId, CancellationToken cancellationToken)
        => _mediator.Send(new CustomerLedgerQuery(shopId, customerId), cancellationToken);
}
