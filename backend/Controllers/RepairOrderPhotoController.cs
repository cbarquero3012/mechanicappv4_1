using MechanicApp.Server.Constants;
using MechanicApp.Server.Models;
using MechanicApp.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace MechanicApp.Server.Controllers
{
    [Authorize]
    [EnableRateLimiting("authenticated")]
    [ApiController]
    [Route("api/[controller]")]
    public class RepairOrderPhotoController(IDbService db, IFileStorageService fileStorage) : ControllerBase
    {
        

        /// <summary>Get all photos for a repair order.</summary>
        [HttpGet("{repairOrderId}")]
        public async Task<IActionResult> Get(int repairOrderId)
        {
            var result = await db.GetAll<RepairOrderPhoto>(
                @"SELECT * FROM mechanic_db.""RepairOrderPhotos""
                  WHERE ""RepairOrderId"" = @RepairOrderId
                  ORDER BY ""CreatedAt"" DESC",
                new { RepairOrderId = repairOrderId });
            return Ok(result);
        }

        /// <summary>Upload one or more photos for a repair order.</summary>
        [EnableRateLimiting("upload")]
        [HttpPost("{repairOrderId}")]
        public async Task<IActionResult> Upload(int repairOrderId, [FromForm] List<IFormFile> files, [FromForm] string? description)
        {
            if (files == null || files.Count == 0)
                return BadRequest("No files provided");

            var uploaded = new List<RepairOrderPhoto>();

            foreach (var file in files)
            {
                var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (!AllowedFileExtensions.Photos.Contains(ext))
                    continue;

                if (file.Length > 5 * 1024 * 1024)
                    continue;

                var relativeUrl = await fileStorage.SaveFileAsync(
                    file, $"orders/{repairOrderId}",
                    AllowedFileExtensions.Photos, 5 * 1024 * 1024);

                var fileName = Path.GetFileName(relativeUrl);

                var photo = await db.GetAsync<RepairOrderPhoto>(
                    @"INSERT INTO mechanic_db.""RepairOrderPhotos"" (""RepairOrderId"", ""FileName"", ""FilePath"", ""Description"")
                      VALUES (@RepairOrderId, @FileName, @FilePath, @Description)
                      RETURNING *",
                    new { RepairOrderId = repairOrderId, FileName = fileName, FilePath = relativeUrl, Description = description });

                if (photo != null)
                    uploaded.Add(photo);
            }

            return Ok(new { message = $"{uploaded.Count} photo(s) uploaded", photos = uploaded });
        }

        /// <summary>Delete a photo.</summary>
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var photo = await db.GetAsync<RepairOrderPhoto>(
                @"SELECT * FROM mechanic_db.""RepairOrderPhotos"" WHERE ""Id"" = @Id",
                new { Id = id });

            if (photo != null)
            {
                fileStorage.DeleteFile(photo.FilePath);
            }

            await db.EditData(
                @"DELETE FROM mechanic_db.""RepairOrderPhotos"" WHERE ""Id"" = @Id",
                new { Id = id });

            return Ok(new { message = "Photo deleted" });
        }
    }
}
