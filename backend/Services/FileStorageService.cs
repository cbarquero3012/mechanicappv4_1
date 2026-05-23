namespace MechanicApp.Server.Services
{
    /// <summary>
    /// Manages file uploads, deletion, and directory cleanup under wwwroot/uploads.
    /// </summary>
    public class FileStorageService(IWebHostEnvironment env) : IFileStorageService
    {
        private readonly string _webRootPath = Path.Combine(env.ContentRootPath, "wwwroot");

        /// <inheritdoc />
        public async Task<string> SaveFileAsync(IFormFile file, string subFolder, string[] allowedExtensions, long maxSizeBytes)
        {
            ArgumentNullException.ThrowIfNull(file);

            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(ext))
                throw new ArgumentException($"Invalid file type. Allowed: {string.Join(", ", allowedExtensions)}");

            if (file.Length > maxSizeBytes)
                throw new ArgumentException($"File too large. Max {maxSizeBytes / (1024 * 1024)}MB.");

            var uploadsDir = Path.Combine(_webRootPath, "uploads", subFolder);
            Directory.CreateDirectory(uploadsDir);

            var fileName = $"{DateTime.UtcNow:yyyyMMddHHmmss}_{Guid.NewGuid().ToString()[..8]}{ext}";
            var filePath = Path.Combine(uploadsDir, fileName);

            // Prevent path traversal: ensure resolved path stays within the uploads directory
            var resolvedPath = Path.GetFullPath(filePath);
            if (!resolvedPath.StartsWith(Path.GetFullPath(_webRootPath), StringComparison.OrdinalIgnoreCase))
                throw new ArgumentException("Invalid file path.");

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream).ConfigureAwait(false);
            }

            return $"/uploads/{subFolder}/{fileName}";
        }

        /// <inheritdoc />
        public void DeleteFile(string relativePath)
        {
            var fullPath = GetFullPath(relativePath);
            if (File.Exists(fullPath))
                File.Delete(fullPath);
        }

        /// <inheritdoc />
        public void CleanEmptyDirectories(string subFolder)
        {
            var dir = Path.Combine(_webRootPath, "uploads", subFolder);
            if (!Directory.Exists(dir)) return;

            foreach (var sub in Directory.GetDirectories(dir))
            {
                if (Directory.GetFiles(sub).Length == 0 && Directory.GetDirectories(sub).Length == 0)
                    Directory.Delete(sub);
            }
        }

        /// <inheritdoc />
        public string GetFullPath(string relativePath)
        {
            var fullPath = Path.GetFullPath(Path.Combine(_webRootPath, relativePath.TrimStart('/')));

            // Prevent path traversal: ensure the resolved path stays within wwwroot
            if (!fullPath.StartsWith(Path.GetFullPath(_webRootPath), StringComparison.OrdinalIgnoreCase))
                throw new ArgumentException("Invalid file path.");

            return fullPath;
        }
    }
}
