using BillEasePro.Domain.Common;
using BillEasePro.Domain.Enums;

namespace BillEasePro.Domain.Entities;

public sealed class Notification : BaseAuditableEntity
{
    public Guid ShopId { get; set; }
    public Shop? Shop { get; set; }
    public Guid? AppUserId { get; set; }
    public AppUser? AppUser { get; set; }
    public NotificationSeverity Severity { get; set; } = NotificationSeverity.Info;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public DateTimeOffset? ReadAt { get; set; }
}
