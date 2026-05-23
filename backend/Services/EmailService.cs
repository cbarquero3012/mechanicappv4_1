using MailKit.Net.Smtp;
using MechanicApp.Server.Options;
using Microsoft.Extensions.Options;
using MimeKit;

namespace MechanicApp.Server.Services
{
  public class EmailService : IEmailService
  {
    private readonly SmtpSettings _smtp;
    private readonly ILogger<EmailService> _logger;
    private const int MaxRetries = 3;

    public EmailService(IOptions<SmtpSettings> smtp, ILogger<EmailService> logger)
    {
      _smtp = smtp.Value;
      _logger = logger;
    }

    public async Task<bool> SendWelcomeEmailAsync(string toEmail, string username, string loginUrl, string planName,
        string? password = null, DateTime? expiresAt = null, bool isDemo = false)
    {
      if (string.IsNullOrWhiteSpace(toEmail) || !IsValidEmail(toEmail))
      {
        _logger.LogWarning("Invalid or empty email address: {Email}. Skipping welcome email.", toEmail);
        return false;
      }

      var subject = isDemo
          ? "Welcome to MechanicApp – Your Free Trial is Ready!"
          : "Welcome to MechanicApp – Your Account is Ready!";

      var credentialsSection = !string.IsNullOrEmpty(password)
          ? $@"<p style=""margin: 4px 0; color: #1e293b;"">🔑 Password: <strong>{password}</strong></p>"
          : @"<p style=""margin: 8px 0 0; color: #64748b; font-size: 13px;"">Use the password you set during registration.</p>";

      var expirySection = expiresAt.HasValue
          ? $@"<p style=""margin: 4px 0; color: #dc2626;"">⏰ Expires: <strong>{expiresAt.Value:MMMM dd, yyyy}</strong></p>"
          : "";

      var headerText = isDemo
          ? "Your free trial is ready!"
          : "Your payment was successful!";

      var introText = isDemo
          ? "Welcome to MechanicApp! Your demo account is active and ready to explore."
          : "Thank you for subscribing to MechanicApp. Your account is now active and ready to use.";

      var htmlBody = $@"
<!DOCTYPE html>
<html>
<head><meta charset=""utf-8""></head>
<body style=""font-family: Arial, sans-serif; background: #f4f4f7; padding: 20px;"">
  <div style=""max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden;"">
    <div style=""background: #2563eb; padding: 24px; text-align: center;"">
      <h1 style=""color: #ffffff; margin: 0; font-size: 24px;"">MechanicApp</h1>
    </div>
    <div style=""padding: 32px;"">
      <h2 style=""color: #1e293b; margin-top: 0;"">{headerText}</h2>
      <p style=""color: #475569;"">{introText}</p>

      <div style=""background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 24px 0;"">
        <p style=""margin: 0 0 8px; color: #1e293b;""><strong>Your Account Details:</strong></p>
        <p style=""margin: 4px 0; color: #1e293b;"">👤 Username: <strong>{username}</strong></p>
        <p style=""margin: 4px 0; color: #1e293b;"">📋 Plan: <strong>{planName}</strong></p>
        {credentialsSection}
        {expirySection}
      </div>

      <div style=""text-align: center; margin: 32px 0;"">
        <a href=""{loginUrl}"" style=""background: #2563eb; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 600;"">
          Go to Login
        </a>
      </div>

      <p style=""color: #475569; font-size: 14px;"">
        Login URL: <a href=""{loginUrl}"" style=""color: #2563eb;"">{loginUrl}</a>
      </p>

      <hr style=""border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;"">
      <p style=""color: #94a3b8; font-size: 12px; text-align: center;"">
        If you did not create this account, please ignore this email.<br>
        &copy; MechanicApp - Auto Repair Shop Management
      </p>
    </div>
  </div>
</body>
</html>";

      return await SendEmailWithRetryAsync(toEmail, subject, htmlBody);
    }

    private async Task<bool> SendEmailWithRetryAsync(string toEmail, string subject, string htmlBody)
    {
      if (string.IsNullOrWhiteSpace(_smtp.Host) || string.IsNullOrWhiteSpace(_smtp.Username))
      {
        _logger.LogWarning("SMTP not configured. Skipping email to {Email}. Subject: {Subject}", toEmail, subject);
        return false;
      }

      for (int attempt = 1; attempt <= MaxRetries; attempt++)
      {
        try
        {
          var message = new MimeMessage();
          message.From.Add(new MailboxAddress(_smtp.FromName, _smtp.FromEmail));
          message.To.Add(MailboxAddress.Parse(toEmail));
          message.Subject = subject;
          message.Body = new TextPart("html") { Text = htmlBody };

          using var client = new SmtpClient();
          await client.ConnectAsync(_smtp.Host, _smtp.Port, _smtp.EnableSsl
              ? MailKit.Security.SecureSocketOptions.StartTls
              : MailKit.Security.SecureSocketOptions.Auto);

          if (!string.IsNullOrEmpty(_smtp.Username))
            await client.AuthenticateAsync(_smtp.Username, _smtp.Password);

          await client.SendAsync(message);
          await client.DisconnectAsync(true);

          _logger.LogInformation("Welcome email sent to {Email} (attempt {Attempt})", toEmail, attempt);
          return true;
        }
        catch (Exception ex) when (attempt < MaxRetries)
        {
          _logger.LogWarning(ex, "Email send attempt {Attempt}/{MaxRetries} failed for {Email}. Retrying...",
              attempt, MaxRetries, toEmail);
          await Task.Delay(attempt * 1000); // exponential backoff: 1s, 2s
        }
        catch (Exception ex)
        {
          _logger.LogError(ex, "Failed to send email to {Email} after {MaxRetries} attempts", toEmail, MaxRetries);
          return false;
        }
      }

      return false;
    }

    private static bool IsValidEmail(string email)
    {
      try
      {
        var addr = new System.Net.Mail.MailAddress(email);
        return addr.Address == email;
      }
      catch
      {
        return false;
      }
    }
  }
}
