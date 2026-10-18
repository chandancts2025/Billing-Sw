namespace BillEasePro.Application.Abstractions;

public interface IEmailService
{
    /// <summary>
    /// Sends a general email with subject and body.
    /// </summary>
    Task SendEmailAsync(string toEmail, string subject, string body, bool isHtml = true, CancellationToken cancellationToken = default);

    /// <summary>
    /// Sends an email with an optional attachment.
    /// </summary>
    Task SendEmailWithAttachmentAsync(string toEmail, string subject, string body, byte[] attachmentBytes, string attachmentFilename, bool isHtml = true, CancellationToken cancellationToken = default);

    /// <summary>
    /// Sends a diagnostic test email to verify SMTP connectivity and credentials.
    /// </summary>
    Task<bool> SendTestEmailAsync(string toEmail, CancellationToken cancellationToken = default);

    /// <summary>
    /// Sends an OTP verification/reset code in a formatted email.
    /// </summary>
    Task SendOtpEmailAsync(string toEmail, string otpCode, string purpose, CancellationToken cancellationToken = default);

    /// <summary>
    /// Sends a sales invoice/receipt email to a customer.
    /// </summary>
    Task SendInvoiceEmailAsync(string toEmail, string customerName, string invoiceNumber, decimal grandTotal, string currencyCode, string htmlContent, CancellationToken cancellationToken = default);

    /// <summary>
    /// Sends a welcome email upon registration.
    /// </summary>
    Task SendWelcomeEmailAsync(string toEmail, string userName, string shopName, CancellationToken cancellationToken = default);
}
