using Asp.Versioning;
using BillEasePro.Application.Features.Crud;
using BillEasePro.Domain.Common;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BillEasePro.Api.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Authorize(Policy = "OperatorOrAbove")]
[Route("api/v{version:apiVersion}/[controller]")]
public abstract class CrudController<TEntity, TDto> : ControllerBase where TEntity : BaseAuditableEntity
{
    private readonly IMediator _mediator;

    protected CrudController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<TDto>>> List(CancellationToken cancellationToken)
        => Ok(await _mediator.Send(new ListEntitiesQuery<TEntity, TDto>(), cancellationToken));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TDto>> Get(Guid id, CancellationToken cancellationToken)
    {
        var dto = await _mediator.Send(new GetEntityByIdQuery<TEntity, TDto>(id), cancellationToken);
        return dto is null ? NotFound() : Ok(dto);
    }

    [HttpPost]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<TDto>> Create(TDto dto, CancellationToken cancellationToken)
    {
        var created = await _mediator.Send(new CreateEntityCommand<TEntity, TDto>(dto), cancellationToken);
        var id = typeof(TDto).GetProperty("Id")?.GetValue(created);
        return CreatedAtAction(nameof(Get), new { id, version = "1" }, created);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<TDto>> Update(Guid id, TDto dto, CancellationToken cancellationToken)
    {
        var updated = await _mediator.Send(new UpdateEntityCommand<TEntity, TDto>(id, dto), cancellationToken);
        return updated is null ? NotFound() : Ok(updated);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var deleted = await _mediator.Send(new DeleteEntityCommand<TEntity>(id), cancellationToken);
        return deleted ? NoContent() : NotFound();
    }
}
