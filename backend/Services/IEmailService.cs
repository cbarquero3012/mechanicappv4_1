namespace MechanicApp.Server.Services
{
    public interface IEmailService
    {
        Task<bool> SendWelcomeEmailAsync(string toEmail, string username, string loginUrl, string planName,
            string? password = null, DateTime? expiresAt = null, bool isDemo = false);
    }
}
