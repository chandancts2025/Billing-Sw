using System.Net;
using System.Net.Mail;
using System.Text;
using BillEasePro.Application.Abstractions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace BillEasePro.Infrastructure.Services;

public sealed class SmtpSettings
{
    public const string SectionName = "SmtpSettings";

    public string Host { get; set; } = "smtp.gmail.com";
    public int Port { get; set; } = 587;
    public bool EnableSsl { get; set; } = true;
    public string UserName { get; set; } = "chandankr.mandal87@gmail.com";
    public string Password { get; set; } = "gknv jgrw xiee zhat";
    public string FromEmail { get; set; } = "chandankr.mandal87@gmail.com";
    public string FromName { get; set; } = "BillEasePro";
    public bool DevMode { get; set; } = false;

    public static SmtpSettings FromConfiguration(IConfiguration configuration)
    {
        var section = configuration.GetSection(SectionName);
        var settings = new SmtpSettings();
        if (!section.Exists()) return settings;

        if (!string.IsNullOrWhiteSpace(section["Host"]))
            settings.Host = section["Host"]!;

        if (int.TryParse(section["Port"], out var port))
            settings.Port = port;

        if (bool.TryParse(section["EnableSsl"], out var ssl))
            settings.EnableSsl = ssl;

        if (!string.IsNullOrWhiteSpace(section["UserName"]))
            settings.UserName = section["UserName"]!;

        if (!string.IsNullOrWhiteSpace(section["Password"]))
            settings.Password = section["Password"]!;

        if (!string.IsNullOrWhiteSpace(section["FromEmail"]))
            settings.FromEmail = section["FromEmail"]!;

        if (!string.IsNullOrWhiteSpace(section["FromName"]))
            settings.FromName = section["FromName"]!;

        if (bool.TryParse(section["DevMode"], out var dev))
            settings.DevMode = dev;

        return settings;
    }
}

public sealed class SmtpEmailService : IEmailService
{
    private readonly SmtpSettings _settings;
    private readonly ILogger<SmtpEmailService> _logger;

    public SmtpEmailService(IConfiguration configuration, ILogger<SmtpEmailService> logger)
    {
        _settings = SmtpSettings.FromConfiguration(configuration);
        _logger = logger;
    }

    public async Task SendEmailAsync(string toEmail, string subject, string body, bool isHtml = true, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(toEmail))
        {
            _logger.LogWarning("Email sending skipped: recipient email is null or empty");
            return;
        }

        if (_settings.DevMode)
        {
            _logger.LogInformation("[DEV MODE] Email to {ToEmail} skipped actual transmission. Subject: {Subject}, Body length: {Length}",
                toEmail, subject, body.Length);
            return;
        }

        using var message = new MailMessage
        {
            From = new MailAddress(_settings.FromEmail, _settings.FromName),
            Subject = subject,
            Body = body,
            IsBodyHtml = isHtml,
            BodyEncoding = Encoding.UTF8,
            SubjectEncoding = Encoding.UTF8
        };
        message.To.Add(toEmail.Trim());

        using var client = CreateClient();
        try
        {
            _logger.LogInformation("Sending email to {ToEmail} with subject '{Subject}' via {Host}:{Port}...",
                toEmail, subject, _settings.Host, _settings.Port);

            await client.SendMailAsync(message, cancellationToken);
            _logger.LogInformation("Email successfully sent to {ToEmail}", toEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {ToEmail} via {Host}:{Port}", toEmail, _settings.Host, _settings.Port);
            throw;
        }
    }

    public async Task SendEmailWithAttachmentAsync(string toEmail, string subject, string body, byte[] attachmentBytes, string attachmentFilename, bool isHtml = true, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(toEmail)) return;

        if (_settings.DevMode)
        {
            _logger.LogInformation("[DEV MODE] Email with attachment to {ToEmail} skipped.", toEmail);
            return;
        }

        using var message = new MailMessage
        {
            From = new MailAddress(_settings.FromEmail, _settings.FromName),
            Subject = subject,
            Body = body,
            IsBodyHtml = isHtml,
            BodyEncoding = Encoding.UTF8,
            SubjectEncoding = Encoding.UTF8
        };
        message.To.Add(toEmail.Trim());

        using var stream = new MemoryStream(attachmentBytes);
        using var attachment = new Attachment(stream, attachmentFilename);
        message.Attachments.Add(attachment);

        using var client = CreateClient();
        await client.SendMailAsync(message, cancellationToken);
    }

    public async Task<bool> SendTestEmailAsync(string toEmail, CancellationToken cancellationToken = default)
    {
        var target = string.IsNullOrWhiteSpace(toEmail) ? _settings.FromEmail : toEmail.Trim();
        var subject = "BillEase Pro - SMTP Verification Test";
        var sslStatus = _settings.EnableSsl ? "Yes" : "No";
        var timeUtc = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss");
        var year = DateTime.UtcNow.Year.ToString();

        var body = $$"""
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
                .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.04); }
                .header { background: #0f766e; padding: 28px 24px; text-align: center; color: #ffffff; }
                .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
                .header p { margin: 6px 0 0; font-size: 14px; opacity: 0.9; }
                .content { padding: 28px 24px; }
                .badge { display: inline-block; background: #e6fffa; color: #0d9488; font-weight: 600; font-size: 12px; padding: 4px 10px; border-radius: 999px; margin-bottom: 16px; border: 1px solid #b2f5ea; }
                .info-table { width: 100%; border-collapse: collapse; margin: 18px 0; font-size: 14px; }
                .info-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; }
                .info-table td:first-child { font-weight: 600; color: #64748b; width: 140px; }
                .footer { background: #f8fafc; padding: 18px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
              </style>
            </head>
            <body>
              <div class="card">
                <div class="header">
                  <h1>BillEase Pro</h1>
                  <p>Intelligent POS & Retail Billing System</p>
                </div>
                <div class="content">
                  <span class="badge">SMTP Connection Verified</span>
                  <p style="font-size: 16px; font-weight: 600; margin-top: 0;">Hello,</p>
                  <p>Your SMTP mail configuration has been successfully tested and is working properly with Google Gmail SMTP.</p>
                  <table class="info-table">
                    <tr><td>Host</td><td><strong>{{_settings.Host}}</strong></td></tr>
                    <tr><td>Port</td><td><strong>{{_settings.Port}}</strong></td></tr>
                    <tr><td>SSL Enabled</td><td><strong>{{sslStatus}}</strong></td></tr>
                    <tr><td>From Email</td><td><strong>{{_settings.FromEmail}}</strong></td></tr>
                    <tr><td>From Name</td><td><strong>{{_settings.FromName}}</strong></td></tr>
                    <tr><td>Test Timestamp</td><td><strong>{{timeUtc}} UTC</strong></td></tr>
                  </table>
                  <p style="font-size: 13px; color: #64748b; margin-bottom: 0;">All automated emails (OTP verifications, password resets, and digital customer receipts) will be delivered using this account.</p>
                </div>
                <div class="footer">
                  &copy; {{year}} BillEase Pro. Automated Notification System.
                </div>
              </div>
            </body>
            </html>
            """;

        try
        {
            await SendEmailAsync(target, subject, body, isHtml: true, cancellationToken);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SMTP test email verification failed");
            return false;
        }
    }

    public async Task SendOtpEmailAsync(string toEmail, string otpCode, string purpose, CancellationToken cancellationToken = default)
    {
        var purposeFriendly = purpose switch
        {
            "PasswordReset" => "Password Reset Code",
            "EmailVerification" => "Email Verification Code",
            _ => "Authentication Code"
        };

        var subject = $"BillEase Pro: {purposeFriendly} - {otpCode}";
        var year = DateTime.UtcNow.Year.ToString();

        var body = $$"""
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
                .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.04); }
                .header { background: #0f766e; padding: 26px 20px; text-align: center; color: #ffffff; }
                .header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
                .header p { margin: 4px 0 0; font-size: 13px; opacity: 0.9; }
                .content { padding: 32px 24px; text-align: center; }
                .title { font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 10px; }
                .subtitle { font-size: 14px; color: #64748b; margin: 0 0 24px; line-height: 1.5; }
                .otp-box { display: inline-block; background: #f0fdfa; border: 2px dashed #0f766e; border-radius: 10px; padding: 14px 28px; margin: 12px 0 24px; letter-spacing: 8px; font-size: 32px; font-weight: 800; font-family: 'Consolas', 'Courier New', monospace; color: #0f766e; }
                .expiry { font-size: 13px; color: #dc2626; font-weight: 600; margin-bottom: 20px; }
                .security-note { font-size: 12px; color: #94a3b8; line-height: 1.5; text-align: left; background: #f8fafc; border-radius: 8px; padding: 12px 16px; border: 1px solid #f1f5f9; }
                .footer { background: #f8fafc; padding: 16px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
              </style>
            </head>
            <body>
              <div class="card">
                <div class="header">
                  <h1>BillEase Pro</h1>
                  <p>Security & Authentication Services</p>
                </div>
                <div class="content">
                  <div class="title">{{purposeFriendly}}</div>
                  <div class="subtitle">Use the verification code below to complete your request for <strong>{{toEmail}}</strong>.</div>
                  <div class="otp-box">{{otpCode}}</div>
                  <div class="expiry">Expires in 10 minutes</div>
                  <div class="security-note">
                    <strong>Security Notice:</strong> If you did not initiate this request, please ignore this email or update your password immediately. Never disclose this one-time code to anyone.
                  </div>
                </div>
                <div class="footer">
                  &copy; {{year}} BillEase Pro. Automated security notification.
                </div>
              </div>
            </body>
            </html>
            """;

        await SendEmailAsync(toEmail, subject, body, isHtml: true, cancellationToken);
    }

    public async Task SendInvoiceEmailAsync(string toEmail, string customerName, string invoiceNumber, decimal grandTotal, string currencyCode, string htmlContent, CancellationToken cancellationToken = default)
    {
        var subject = $"Tax Invoice #{invoiceNumber} - BillEase Pro Receipt";
        var year = DateTime.UtcNow.Year.ToString();
        var formattedTotal = grandTotal.ToString("N2");

        var body = $$"""
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
                .card { max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.04); }
                .header { background: #0f766e; padding: 24px; text-align: center; color: #ffffff; }
                .header h1 { margin: 0; font-size: 22px; font-weight: 700; }
                .header p { margin: 4px 0 0; font-size: 13px; opacity: 0.9; }
                .summary { padding: 20px 24px; background: #f0fdfa; border-bottom: 1px solid #ccfbf1; display: flex; justify-content: space-between; align-items: center; }
                .summary div strong { font-size: 16px; color: #0f766e; }
                .receipt-container { padding: 24px; }
                .footer { background: #f8fafc; padding: 16px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
              </style>
            </head>
            <body>
              <div class="card">
                <div class="header">
                  <h1>BillEase Pro Receipt</h1>
                  <p>Thank you for shopping with us!</p>
                </div>
                <div class="summary">
                  <div>
                    <span style="font-size: 12px; color: #64748b; display: block;">Customer</span>
                    <strong>{{customerName}}</strong>
                  </div>
                  <div>
                    <span style="font-size: 12px; color: #64748b; display: block;">Invoice Number</span>
                    <strong>{{invoiceNumber}}</strong>
                  </div>
                  <div>
                    <span style="font-size: 12px; color: #64748b; display: block;">Total Paid</span>
                    <strong>{{currencyCode}} {{formattedTotal}}</strong>
                  </div>
                </div>
                <div class="receipt-container">
                  {{htmlContent}}
                </div>
                <div class="footer">
                  &copy; {{year}} BillEase Pro. Digital invoice generated automatically.
                </div>
              </div>
            </body>
            </html>
            """;

        await SendEmailAsync(toEmail, subject, body, isHtml: true, cancellationToken);
    }

    public async Task SendWelcomeEmailAsync(string toEmail, string userName, string shopName, CancellationToken cancellationToken = default)
    {
        var subject = $"Welcome to BillEase Pro - {shopName}";
        var year = DateTime.UtcNow.Year.ToString();

        var body = $$"""
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
                .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
                .header { background: #0f766e; padding: 28px 24px; text-align: center; color: #ffffff; }
                .content { padding: 28px 24px; }
                .footer { background: #f8fafc; padding: 18px 24px; text-align: center; font-size: 12px; color: #94a3b8; }
              </style>
            </head>
            <body>
              <div class="card">
                <div class="header">
                  <h1 style="margin: 0; font-size: 24px;">Welcome to BillEase Pro!</h1>
                </div>
                <div class="content">
                  <p>Hello <strong>{{userName}}</strong>,</p>
                  <p>Your account has been registered for store <strong>{{shopName}}</strong>. You now have access to high-speed POS billing, real-time inventory management, barcode scanning, and multi-format receipt printing.</p>
                  <p>If you have any questions, feel free to reach out to support.</p>
                </div>
                <div class="footer">
                  &copy; {{year}} BillEase Pro
                </div>
              </div>
            </body>
            </html>
            """;

        await SendEmailAsync(toEmail, subject, body, isHtml: true, cancellationToken);
    }

    private SmtpClient CreateClient()
    {
        var client = new SmtpClient(_settings.Host, _settings.Port)
        {
            EnableSsl = _settings.EnableSsl,
            UseDefaultCredentials = false,
            Credentials = new NetworkCredential(_settings.UserName, _settings.Password),
            DeliveryMethod = SmtpDeliveryMethod.Network,
            Timeout = 20000
        };

        return client;
    }
}
