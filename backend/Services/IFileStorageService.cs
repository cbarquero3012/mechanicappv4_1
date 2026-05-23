namespace MechanicApp.Server.Services
{
    /// <summary>
    /// Manages file uploads, deletion, and storage under wwwroot/uploads.
    /// </summary>
    public interface IFileStorageService
    {
        /// <summary>
        /// Saves an uploaded file to the specified sub-folder.
        /// </summary>
        /// <param name="file">The uploaded file.</param>
        /// <param name="subFolder">The sub-folder within uploads (e.g. "branding", "orders/123").</param>
        /// <param name="allowedExtensions">Permitted file extensions (e.g. ".png", ".jpg").</param>
        /// <param name="maxSizeBytes">Maximum allowed file size in bytes.</param>
        /// <returns>The relative URL of the saved file.</returns>
        Task<string> SaveFileAsync(IFormFile file, string subFolder, string[] allowedExtensions, long maxSizeBytes);

        /// <summary>
        /// Deletes a file at the specified relative path.
        /// </summary>
        /// <param name="relativePath">The relative URL path of the file (e.g. "/uploads/branding/logo.png").</param>
        void DeleteFile(string relativePath);

        /// <summary>
        /// Removes empty directories under the specified sub-folder.
        /// </summary>
        /// <param name="subFolder">The sub-folder to clean.</param>
        void CleanEmptyDirectories(string subFolder);

        /// <summary>
        /// Resolves a relative URL path to a full filesystem path.
        /// </summary>
        /// <param name="relativePath">The relative URL path.</param>
        /// <returns>The absolute filesystem path.</returns>
        string GetFullPath(string relativePath);
    }
}
