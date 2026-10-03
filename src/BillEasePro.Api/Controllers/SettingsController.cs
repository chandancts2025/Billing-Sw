using System.Text.Json;
using Asp.Versioning;
using BillEasePro.Application.Abstractions;
using BillEasePro.Application.Dtos;
using BillEasePro.Domain.Entities;
using BillEasePro.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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
    public async Task<ActionResult<object>> GetShopSettings(Guid shopId, CancellationToken cancellationToken)
    {
        var shop = await _shops.GetByIdAsync(shopId, cancellationToken);
        if (shop is null) return NotFound();

        var settings = await _settings.Query()
            .Where(x => x.ShopId == shopId)
            .ToDictionaryAsync(x => x.Key, x => x.Value, cancellationToken);

        string get(string key, string @default) => settings.TryGetValue(key, out var v) ? v : @default;

        return Ok(new
        {
            shopId = shop.Id,
            shopName = shop.Name,
            legalName = shop.LegalName,
            taxRegistrationNumber = shop.TaxRegistrationNumber,
            industryType = shop.IndustryType.ToString(),
            taxRegime = shop.TaxRegime.ToString(),
            currencyCode = shop.CurrencyCode,
            phone = shop.Phone,
            email = shop.Email,
            addressLine1 = shop.AddressLine1,
            addressLine2 = shop.AddressLine2,
            city = shop.City,
            state = shop.State,
            postalCode = shop.PostalCode,
            country = shop.Country,
            brandColor = get("BrandColor", "#0f766e"),
            darkModeEnabled = bool.TryParse(get("DarkModeEnabled", "false"), out var dm) && dm,
            idleTimeoutMinutes = int.TryParse(get("IdleTimeoutMinutes", "30"), out var it) ? it : 30,
            preventMultipleOperatorSessions = bool.TryParse(get("PreventMultipleOperatorSessions", "true"), out var pm) && pm,
            settings
        });
    }

    [HttpPut("shops/{shopId:guid}")]
    public async Task<IActionResult> UpdateShopSettings(Guid shopId, [FromBody] JsonElement payload, CancellationToken cancellationToken)
    {
        var shop = await _shops.GetByIdAsync(shopId, cancellationToken);
        if (shop is null) return NotFound();

        if (payload.ValueKind == JsonValueKind.Object)
        {
            foreach (var prop in payload.EnumerateObject())
            {
                var name = prop.Name;
                var val = prop.Value.ValueKind switch
                {
                    JsonValueKind.String => prop.Value.GetString() ?? "",
                    JsonValueKind.Number => prop.Value.GetRawText(),
                    JsonValueKind.True => "true",
                    JsonValueKind.False => "false",
                    JsonValueKind.Null => "",
                    _ => prop.Value.GetRawText()
                };

                // Map direct Shop entity properties
                if (name.Equals("shopName", StringComparison.OrdinalIgnoreCase) || name.Equals("name", StringComparison.OrdinalIgnoreCase))
                {
                    if (!string.IsNullOrWhiteSpace(val)) shop.Name = val;
                }
                else if (name.Equals("legalName", StringComparison.OrdinalIgnoreCase)) shop.LegalName = val;
                else if (name.Equals("taxRegistrationNumber", StringComparison.OrdinalIgnoreCase) || name.Equals("gstin", StringComparison.OrdinalIgnoreCase)) shop.TaxRegistrationNumber = val;
                else if (name.Equals("phone", StringComparison.OrdinalIgnoreCase) || name.Equals("primaryPhone", StringComparison.OrdinalIgnoreCase)) shop.Phone = val;
                else if (name.Equals("email", StringComparison.OrdinalIgnoreCase)) shop.Email = val;
                else if (name.Equals("addressLine1", StringComparison.OrdinalIgnoreCase) || name.Equals("line1", StringComparison.OrdinalIgnoreCase)) shop.AddressLine1 = val;
                else if (name.Equals("addressLine2", StringComparison.OrdinalIgnoreCase) || name.Equals("line2", StringComparison.OrdinalIgnoreCase)) shop.AddressLine2 = val;
                else if (name.Equals("city", StringComparison.OrdinalIgnoreCase)) shop.City = val;
                else if (name.Equals("state", StringComparison.OrdinalIgnoreCase)) shop.State = val;
                else if (name.Equals("postalCode", StringComparison.OrdinalIgnoreCase) || name.Equals("pincode", StringComparison.OrdinalIgnoreCase)) shop.PostalCode = val;
                else if (name.Equals("country", StringComparison.OrdinalIgnoreCase)) shop.Country = val;
                else if (name.Equals("currencyCode", StringComparison.OrdinalIgnoreCase)) shop.CurrencyCode = val;
                else if (name.Equals("industryType", StringComparison.OrdinalIgnoreCase) && Enum.TryParse<IndustryType>(val, true, out var ind)) shop.IndustryType = ind;
                else if (name.Equals("taxRegime", StringComparison.OrdinalIgnoreCase) && Enum.TryParse<TaxRegime>(val, true, out var tr)) shop.TaxRegime = tr;

                // Also persist to ShopSetting key-values
                await UpsertSettingAsync(shopId, name, val, cancellationToken);
            }

            _shops.Update(shop);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpGet("workspace/{shopId:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<Dictionary<string, string>>> GetWorkspaceSettings(Guid shopId, CancellationToken cancellationToken)
    {
        var settings = await _settings.Query()
            .Where(x => x.ShopId == shopId)
            .ToDictionaryAsync(x => x.Key, x => x.Value, cancellationToken);
        return Ok(settings);
    }

    [HttpPut("workspace/{shopId:guid}")]
    public async Task<IActionResult> SaveWorkspaceSettings(Guid shopId, [FromBody] Dictionary<string, string> settings, CancellationToken cancellationToken)
    {
        foreach (var (key, val) in settings)
        {
            await UpsertSettingAsync(shopId, key, val, cancellationToken);
        }
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private async Task UpsertSettingAsync(Guid shopId, string key, string value, CancellationToken cancellationToken)
    {
        var existing = await _settings.Query().FirstOrDefaultAsync(x => x.ShopId == shopId && x.Key == key, cancellationToken);
        if (existing is null)
        {
            await _settings.AddAsync(new ShopSetting
            {
                Id = Guid.NewGuid(),
                ShopId = shopId,
                Key = key,
                Value = value,
                DataType = SettingDataType.String
            }, cancellationToken);
        }
        else
        {
            existing.Value = value;
            existing.UpdatedAt = DateTimeOffset.UtcNow;
        }
    }
}
