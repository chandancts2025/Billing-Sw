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
    private readonly IEmailService _emailService;
    private readonly IConfiguration _configuration;

    public SettingsController(
        IRepository<Shop> shops,
        IRepository<ShopSetting> settings,
        IUnitOfWork unitOfWork,
        IEmailService emailService,
        IConfiguration configuration)
    {
        _shops = shops;
        _settings = settings;
        _unitOfWork = unitOfWork;
        _emailService = emailService;
        _configuration = configuration;
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
            phone = string.IsNullOrWhiteSpace(shop.Phone) ? "9851632391" : shop.Phone,
            email = string.IsNullOrWhiteSpace(shop.Email) ? "chandankr.mandal87@gmail.com" : shop.Email,
            addressLine1 = string.IsNullOrWhiteSpace(shop.AddressLine1) ? "3B8-2D, Sanhita Township" : shop.AddressLine1,
            addressLine2 = string.IsNullOrWhiteSpace(shop.AddressLine2) ? "Newtown" : shop.AddressLine2,
            city = string.IsNullOrWhiteSpace(shop.City) ? "Kolkata" : shop.City,
            state = string.IsNullOrWhiteSpace(shop.State) ? "West Bengal" : shop.State,
            postalCode = string.IsNullOrWhiteSpace(shop.PostalCode) ? "700135" : shop.PostalCode,
            country = string.IsNullOrWhiteSpace(shop.Country) ? "India" : shop.Country,
            productOwner = new
            {
                name = "Chandan Kr Mandal",
                phone = "9851632391",
                email = "chandankr.mandal87@gmail.com",
                address = "3B8-2D, Sanhita Township, Newtown, 700135, WB"
            },
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

    /// <summary>
    /// Tests the SMTP email service configuration by dispatching a test email.
    /// </summary>
    [HttpPost("test-email")]
    [AllowAnonymous]
    public async Task<IActionResult> TestEmail([FromQuery] string? email, CancellationToken cancellationToken)
    {
        var targetEmail = string.IsNullOrWhiteSpace(email) ? _configuration["SmtpSettings:FromEmail"] ?? "chandankr.mandal87@gmail.com" : email.Trim();
        var success = await _emailService.SendTestEmailAsync(targetEmail, cancellationToken);
        if (success)
        {
            return Ok(new
            {
                Success = true,
                Message = $"Test email sent successfully to {targetEmail} via {_configuration["SmtpSettings:Host"]}:{_configuration["SmtpSettings:Port"]}.",
                Recipient = targetEmail,
                ServerUtcTime = DateTime.UtcNow
            });
        }

        return StatusCode(StatusCodes.Status500InternalServerError, new
        {
            Success = false,
            Message = $"Failed to send test email to {targetEmail}. Check server logs for details.",
            Recipient = targetEmail
        });
    }

    /// <summary>
    /// Retrieves current SMTP server configuration status.
    /// </summary>
    [HttpGet("smtp-status")]
    [AllowAnonymous]
    public IActionResult GetSmtpStatus()
    {
        var host = _configuration["SmtpSettings:Host"];
        var port = _configuration["SmtpSettings:Port"];
        var ssl = _configuration["SmtpSettings:EnableSsl"];
        var fromEmail = _configuration["SmtpSettings:FromEmail"];
        var fromName = _configuration["SmtpSettings:FromName"];
        var devMode = _configuration["SmtpSettings:DevMode"];

        return Ok(new
        {
            Configured = !string.IsNullOrWhiteSpace(host) && !string.IsNullOrWhiteSpace(fromEmail),
            Host = host,
            Port = port,
            EnableSsl = ssl,
            FromEmail = fromEmail,
            FromName = fromName,
            DevMode = devMode
        });
    }
}

