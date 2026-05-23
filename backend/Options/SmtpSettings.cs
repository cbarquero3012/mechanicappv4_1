namespace MechanicApp.Server.Options
{
    public class SmtpSettings
    {
        public const string SectionName = "Smtp";

        public string Host { get; set; } = "smtp.gmail.com";
        public int Port { get; set; } = 587;
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string FromEmail { get; set; } = "noreply@mechanicapp.com";
        public string FromName { get; set; } = "MechanicApp";
        public bool EnableSsl { get; set; } = true;

        /// <summary>
        /// Public-facing base URL for login links in emails (e.g., "https://app.mechanicapp.com").
        /// Falls back to Request.Host if empty, but should be set in production.
        /// </summary>
        public string FrontendBaseUrl { get; set; } = string.Empty;
    }
}
