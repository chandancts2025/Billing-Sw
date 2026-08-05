using AutoMapper;
using AutoMapper.QueryableExtensions;
using BillEasePro.Application.Abstractions;
using BillEasePro.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BillEasePro.Application.Features.Crud;

public sealed class ListEntitiesQueryHandler<TEntity, TDto> : IRequestHandler<ListEntitiesQuery<TEntity, TDto>, IReadOnlyList<TDto>>
    where TEntity : BaseAuditableEntity
{
    private readonly IRepository<TEntity> _repository;
    private readonly IMapper _mapper;

    public ListEntitiesQueryHandler(IRepository<TEntity> repository, IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }

    public async Task<IReadOnlyList<TDto>> Handle(ListEntitiesQuery<TEntity, TDto> request, CancellationToken cancellationToken)
        => await _repository.Query()
            .OrderByDescending(x => x.CreatedAt)
            .ProjectTo<TDto>(_mapper.ConfigurationProvider)
            .ToListAsync(cancellationToken);
}

public sealed class GetEntityByIdQueryHandler<TEntity, TDto> : IRequestHandler<GetEntityByIdQuery<TEntity, TDto>, TDto?>
    where TEntity : BaseAuditableEntity
{
    private readonly IRepository<TEntity> _repository;
    private readonly IMapper _mapper;

    public GetEntityByIdQueryHandler(IRepository<TEntity> repository, IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }

    public async Task<TDto?> Handle(GetEntityByIdQuery<TEntity, TDto> request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.Id, cancellationToken);
        return entity is null ? default : _mapper.Map<TDto>(entity);
    }
}

public sealed class CreateEntityCommandHandler<TEntity, TDto> : IRequestHandler<CreateEntityCommand<TEntity, TDto>, TDto>
    where TEntity : BaseAuditableEntity
{
    private readonly IRepository<TEntity> _repository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public CreateEntityCommandHandler(IRepository<TEntity> repository, IUnitOfWork unitOfWork, IMapper mapper)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<TDto> Handle(CreateEntityCommand<TEntity, TDto> request, CancellationToken cancellationToken)
    {
        var entity = _mapper.Map<TEntity>(request.Dto);
        if (entity.Id == Guid.Empty) entity.Id = Guid.NewGuid();
        await _repository.AddAsync(entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return _mapper.Map<TDto>(entity);
    }
}

public sealed class UpdateEntityCommandHandler<TEntity, TDto> : IRequestHandler<UpdateEntityCommand<TEntity, TDto>, TDto?>
    where TEntity : BaseAuditableEntity
{
    private readonly IRepository<TEntity> _repository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public UpdateEntityCommandHandler(IRepository<TEntity> repository, IUnitOfWork unitOfWork, IMapper mapper)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<TDto?> Handle(UpdateEntityCommand<TEntity, TDto> request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.Id, cancellationToken);
        if (entity is null) return default;

        _mapper.Map(request.Dto, entity);
        entity.Id = request.Id;
        _repository.Update(entity);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return _mapper.Map<TDto>(entity);
    }
}

public sealed class DeleteEntityCommandHandler<TEntity> : IRequestHandler<DeleteEntityCommand<TEntity>, bool>
    where TEntity : BaseAuditableEntity
{
    private readonly IRepository<TEntity> _repository;
    private readonly IUnitOfWork _unitOfWork;

    public DeleteEntityCommandHandler(IRepository<TEntity> repository, IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    public async Task<bool> Handle(DeleteEntityCommand<TEntity> request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.Id, cancellationToken);
        if (entity is null) return false;
        _repository.Delete(entity);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }
}
