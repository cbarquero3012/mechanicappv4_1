using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using MechanicApp.Server.Models;
using MechanicApp.Server.Options;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace MechanicApp.Server.Services
{
    /// <summary>
    /// Generates JWT authentication tokens using configured signing credentials.
    /// </summary>
    public class TokenService(IOptions<JwtSettings> jwt) : ITokenService
    {
        private readonly JwtSettings _jwt = jwt.Value;

        /// <inheritdoc />
        public double ExpiresInMinutes => _jwt.ExpiresInMinutes;

        /// <inheritdoc />
        public string GenerateToken(AppUser user)
        {
            ArgumentNullException.ThrowIfNull(user);

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwt.Key));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new(ClaimTypes.Name, user.Username),
                new(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new(ClaimTypes.Role, user.Role),
                new("fullName", user.FullName)
            };
            if (user.MechanicId.HasValue)
                claims.Add(new Claim("mechanicId", user.MechanicId.Value.ToString()));

            var token = new JwtSecurityToken(
                issuer: _jwt.Issuer,
                audience: _jwt.Audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(_jwt.ExpiresInMinutes),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
