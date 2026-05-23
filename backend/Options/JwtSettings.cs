namespace MechanicApp.Server.Options
{
    /// <summary>
    /// Strongly-typed configuration for JWT authentication settings.
    /// Bound from the "Jwt" section in appsettings.json.
    /// </summary>
    public class JwtSettings
    {
        /// <summary>Configuration section name.</summary>
        public const string SectionName = "Jwt";

        /// <summary>The symmetric key used to sign tokens.</summary>
        public string Key { get; set; } = string.Empty;

        /// <summary>The token issuer claim.</summary>
        public string Issuer { get; set; } = string.Empty;

        /// <summary>The token audience claim.</summary>
        public string Audience { get; set; } = string.Empty;

        /// <summary>Token lifetime in minutes.</summary>
        public double ExpiresInMinutes { get; set; } = 60;
    }
}
