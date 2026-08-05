using BillEasePro.Domain.Common;
using MediatR;

namespace BillEasePro.Application.Features.Crud;

public sealed record ListEntitiesQuery<TEntity, TDto>() : IRequest<IReadOnlyList<TDto>>
    where TEntity : BaseAuditableEntity;

public sealed record GetEntityByIdQuery<TEntity, TDto>(Guid Id) : IRequest<TDto?>
    where TEntity : BaseAuditableEntity;

public sealed record CreateEntityCommand<TEntity, TDto>(TDto Dto) : IRequest<TDto>
    where TEntity : BaseAuditableEntity;

public sealed record UpdateEntityCommand<TEntity, TDto>(Guid Id, TDto Dto) : IRequest<TDto?>
    where TEntity : BaseAuditableEntity;

public sealed record DeleteEntityCommand<TEntity>(Guid Id) : IRequest<bool>
    where TEntity : BaseAuditableEntity;
