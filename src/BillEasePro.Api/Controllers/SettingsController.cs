using BillEasePro.Application.Dtos;
using Asp.Versioning;
using Microsoft.EntityFrameworkCore;
using BillEasePro.Application.Abstractions;
using BillEasePro.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BillEasePro.Api.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Authorize(Policy = "AdminOnly")]
[Route("api/v{version:apiVersion}/settings")]
public sealed class SettingsController : ControllerBase
{
    private readonly IRepository<Shop> _shops;
    private readonly IRepository<ShopSetting> _settings;
    private readonly IUnitOfWork _unitOfWork;

    public SettingsController(IRepository<Shop> shops, IRepository<ShopSetting> settings, IUnitOfWork unitOfWork)
    {
        _shops = shops;
        _settings = settings;
        _unitOfWork = unitOfWork;
    }

    [HttpGet("shops/{shopId:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<ShopSettingsDto>> GetShopSettings(Guid shopId, CancellationToken cancellationToken)
    {
        var shop = await _shops.GetByIdAsync(shopId, cancellationToken);
        if (shop is null) return NotFound();

        var settings = await _settings.Query().Where(x => x.ShopId == shopId).ToDictionaryAsync(x => x.Key, x => x.Value, cancellationToken);

        string get(string key, string @default) => settings.TryGetValue(key, out var v) ? v : @default;

        var dto = new ShopSettingsDto(
            ShopId: shop.Id,
            ShopName: shop.Name,
            BrandColor: get("BrandColor", "#0f766e"),
            DarkModeEnabled: bool.TryParse(get("DarkModeEnabled", "false"), out var dm) && dm,
            IdleTimeoutMinutes: int.TryParse(get("IdleTimeoutMinutes", "30"), out var it) ? it : 30,
            PreventMultipleOperatorSessions: bool.TryParse(get("PreventMultipleOperatorSessions", "true"), out var pm) && pm
        );

        return Ok(dto);
    }

    [HttpPut("shops/{shopId:guid}")]
    public async Task<IActionResult> UpdateShopSettings(Guid shopId, [FromBody] ShopSettingsDto dto, CancellationToken cancellationToken)
    {
        var shop = await _shops.GetByIdAsync(shopId, cancellationToken);
        if (shop is null) return NotFound();

        // update shop name
        if (!string.Equals(shop.Name, dto.ShopName, StringComparison.Ordinal))
        {
            shop.Name = dto.ShopName;
            _shops.Update((Shop)shop);
        }

        // upsert settings
        async Task upsert(string key, string value)
        {
            var existing = await _settings.Query().FirstOrDefaultAsync(x => x.ShopId == shopId && x.Key == key, cancellationToken);
            if (existing is null)
            {
                var s = new ShopSetting { Id = Guid.NewGuid(), ShopId = shopId, Key = key, Value = value };
                await _settings.AddAsync(s, cancellationToken);
            }
            else
            {
                existing.Value = value;
            }
        }

        await upsert("BrandColor", dto.BrandColor ?? "#0f766e");
        await upsert("DarkModeEnabled", dto.DarkModeEnabled.ToString());
        await upsert("IdleTimeoutMinutes", dto.IdleTimeoutMinutes.ToString());
        await upsert("PreventMultipleOperatorSessions", dto.PreventMultipleOperatorSessions.ToString());

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return NoContent();
    }
}
