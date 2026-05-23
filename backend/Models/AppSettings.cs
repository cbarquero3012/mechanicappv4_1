using System.ComponentModel.DataAnnotations;

namespace MechanicApp.Server.Models
{
    public class AppSettings
    {
        public int Id { get; set; }

        [Required, StringLength(100)]
        public string AppName { get; set; } = "Mechanic App";

        [StringLength(500)]
        public string? LogoUrl { get; set; } = "/assets/logo.svg";

        [StringLength(500)]
        public string? FaviconUrl { get; set; } = "/assets/favicon.svg";

        [StringLength(300)]
        public string? Address { get; set; }

        [StringLength(30)]
        public string? Phone { get; set; }

        [StringLength(30)]
        public string? WhatsAppPhone { get; set; }

        [StringLength(100)]
        public string? Email { get; set; }

        // Photo cleanup configuration
        public int PhotoCleanupDays { get; set; } = 0;
        public DateTime? PhotoCleanupLastRun { get; set; }

        [StringLength(100)]
        public string? PhotoCleanupLastUser { get; set; }

        /// <summary>IANA timezone identifier for the shop, e.g. "America/Costa_Rica".</summary>
        [StringLength(100)]
        public string? Timezone { get; set; } = "UTC";

        public DateTime? UpdatedAt { get; set; }
    }
}
