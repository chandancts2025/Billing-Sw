namespace BillEasePro.Application.Abstractions;

public interface ICurrentUserService
{
    string UserId { get; }
    string Email { get; }
    string Role { get; }
    Guid? ShopId { get; }
}
