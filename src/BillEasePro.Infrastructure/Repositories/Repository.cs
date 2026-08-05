using System.Linq.Expressions;
using BillEasePro.Application.Abstractions;
using BillEasePro.Domain.Common;
using BillEasePro.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BillEasePro.Infrastructure.Repositories;

public sealed class Repository<TEntity> : IRepository<TEntity> where TEntity : BaseAuditableEntity
{
    private readonly BillEaseDbContext _dbContext;

    public Repository(BillEaseDbContext dbContext) => _dbContext = dbContext;

    public IQueryable<TEntity> Query() => _dbContext.Set<TEntity>().AsQueryable();
    public Task<TEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) => _dbContext.Set<TEntity>().FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    public async Task<IReadOnlyList<TEntity>> ListAsync(CancellationToken cancellationToken = default) => await _dbContext.Set<TEntity>().ToListAsync(cancellationToken);
    public Task AddAsync(TEntity entity, CancellationToken cancellationToken = default) => _dbContext.Set<TEntity>().AddAsync(entity, cancellationToken).AsTask();
    public void Update(TEntity entity) => _dbContext.Set<TEntity>().Update(entity);
    public void Delete(TEntity entity) => _dbContext.Set<TEntity>().Remove(entity);
    public Task<bool> ExistsAsync(Expression<Func<TEntity, bool>> predicate, CancellationToken cancellationToken = default) => _dbContext.Set<TEntity>().AnyAsync(predicate, cancellationToken);
}
