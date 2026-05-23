using MechanicApp.Server.Constants;
using MechanicApp.Server.Models;
using MechanicApp.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace MechanicApp.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AppSettingsController(IDbService db, IFileStorageService fileStorage) : ControllerBase
    {


        /// <summary>Get branding settings (public – no auth required for login page).</summary>
        [AllowAnonymous]
        [EnableRateLimiting("public")]
        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var result = await db.GetAsync<AppSettings>(
                @"SELECT * FROM mechanic_db.""AppSettings"" ORDER BY ""Id"" LIMIT 1", new { });
            return Ok(result ?? new AppSettings());
        }

        /// <summary>Update branding settings (super-admin or admin).</summary>
        [Authorize(Roles = "super-admin,admin")]
        [EnableRateLimiting("authenticated")]
        [HttpPut]
        public async Task<IActionResult> Put([FromBody] AppSettings settings)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { message = "Some required fields are not filled. Please check them." });
            // Ensure at least one row exists
            var existing = await db.GetAsync<AppSettings>(
                @"SELECT ""Id"" FROM mechanic_db.""AppSettings"" ORDER BY ""Id"" LIMIT 1", new { });

            if (existing != null)
            {
                settings.Id = existing.Id;
                await db.EditData(
                    @"UPDATE mechanic_db.""AppSettings"" SET
                      ""AppName""=@AppName, ""LogoUrl""=@LogoUrl, ""FaviconUrl""=@FaviconUrl,
                      ""Address""=@Address, ""Phone""=@Phone, ""WhatsAppPhone""=@WhatsAppPhone,
                      ""Email""=@Email, ""Timezone""=@Timezone, ""UpdatedAt""=CURRENT_TIMESTAMP
                      WHERE ""Id""=@Id", settings);
            }
            else
            {
                await db.EditData(
                    @"INSERT INTO mechanic_db.""AppSettings"" (""AppName"", ""LogoUrl"", ""FaviconUrl"", ""Address"", ""Phone"", ""WhatsAppPhone"", ""Email"")
                      VALUES (@AppName, @LogoUrl, @FaviconUrl, @Address, @Phone, @WhatsAppPhone, @Email)", settings);
            }

            return Ok(new { message = "Settings updated" });
        }

        /// <summary>Upload a logo or favicon image.</summary>
        [Authorize(Roles = "super-admin,admin")]
        [EnableRateLimiting("upload")]
        [HttpPost("upload")]
        public async Task<IActionResult> Upload(IFormFile file, [FromQuery] string type = "logo")
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file provided");

            var url = await fileStorage.SaveFileAsync(
                file, "branding",
                AllowedFileExtensions.Branding,
                2 * 1024 * 1024);

            var fileName = Path.GetFileName(url);
            return Ok(new { url, fileName });
        }
    }
}
