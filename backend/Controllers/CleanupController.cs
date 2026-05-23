using System.Security.Claims;
using MechanicApp.Server.Models;
using MechanicApp.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace MechanicApp.Server.Controllers
{
    [Authorize(Roles = "super-admin,admin")]
    [EnableRateLimiting("authenticated")]
    [ApiController]
    [Route("api/[controller]")]
    public class CleanupController(IDbService db, IFileStorageService fileStorage) : ControllerBase
    {


        /// <summary>
        /// Manually trigger photo cleanup. Deletes photos older than the configured number of days.
        /// </summary>
        [HttpPost("photos")]
        public async Task<IActionResult> CleanupPhotos([FromBody] CleanupRequest? request)
        {
            var settings = await db.GetAsync<AppSettings>(
                @"SELECT * FROM mechanic_db.""AppSettings"" ORDER BY ""Id"" LIMIT 1", new { });

            int days = request?.Days ?? settings?.PhotoCleanupDays ?? 30;
            if (days <= 0)
                return BadRequest(new { message = "Cleanup days must be greater than 0" });

            var cutoffDate = DateTime.UtcNow.AddDays(-days);

            var photos = await db.GetAll<RepairOrderPhoto>(
                @"SELECT * FROM mechanic_db.""RepairOrderPhotos""
                  WHERE ""CreatedAt"" < @CutoffDate",
                new { CutoffDate = cutoffDate });

            int deletedFiles = 0;
            int deletedRows = 0;

            foreach (var photo in photos)
            {
                fileStorage.DeleteFile(photo.FilePath);
                deletedFiles++;
            }

            if (photos.Count > 0)
            {
                deletedRows = await db.EditData(
                    @"DELETE FROM mechanic_db.""RepairOrderPhotos""
                      WHERE ""CreatedAt"" < @CutoffDate",
                    new { CutoffDate = cutoffDate });
            }

            fileStorage.CleanEmptyDirectories("orders");

            var username = User.FindFirst(ClaimTypes.Name)?.Value ?? "system";
            if (settings != null)
            {
                await db.EditData(
                    @"UPDATE mechanic_db.""AppSettings"" SET
                      ""PhotoCleanupDays""=@Days,
                      ""PhotoCleanupLastRun""=CURRENT_TIMESTAMP,
                      ""PhotoCleanupLastUser""=@Username
                      WHERE ""Id""=@Id",
                    new { Days = days, Username = username, Id = settings.Id });
            }

            return Ok(new
            {
                message = $"Cleanup completed: {deletedRows} photos removed ({deletedFiles} files deleted)",
                deletedRows,
                deletedFiles,
                cutoffDate,
                daysUsed = days,
                runBy = username
            });
        }

        /// <summary>Get cleanup configuration and last run info.</summary>
        [HttpGet("status")]
        public async Task<IActionResult> GetStatus()
        {
            var settings = await db.GetAsync<AppSettings>(
                @"SELECT ""PhotoCleanupDays"", ""PhotoCleanupLastRun"", ""PhotoCleanupLastUser""
                  FROM mechanic_db.""AppSettings"" ORDER BY ""Id"" LIMIT 1", new { });

            var photoCount = await db.GetAsync<CleanupPhotoCount>(
                @"SELECT COUNT(*)::INTEGER AS ""Count"" FROM mechanic_db.""RepairOrderPhotos""", new { });

            return Ok(new
            {
                cleanupDays = settings?.PhotoCleanupDays ?? 0,
                lastRun = settings?.PhotoCleanupLastRun,
                lastUser = settings?.PhotoCleanupLastUser,
                totalPhotos = photoCount?.Count ?? 0
            });
        }
    }
}
