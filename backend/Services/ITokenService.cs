using MechanicApp.Server.Models;

namespace MechanicApp.Server.Services
{
    /// <summary>
    /// Generates and manages JWT authentication tokens.
    /// </summary>
    public interface ITokenService
    {
        /// <summary>
        /// Generates a signed JWT for the specified user.
        /// </summary>
        /// <param name="user">The authenticated user to generate a token for.</param>
        /// <returns>A signed JWT string.</returns>
        string GenerateToken(AppUser user);

        /// <summary>
        /// Gets the configured token expiration time in minutes.
        /// </summary>
        double ExpiresInMinutes { get; }
    }
}
