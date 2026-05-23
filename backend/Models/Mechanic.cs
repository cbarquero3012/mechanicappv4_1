using System.ComponentModel.DataAnnotations;

namespace MechanicApp.Server.Models
{
    public class Mechanic
    {
        public int Id { get; set; }

        [Required, StringLength(100)]
        public string FirstName { get; set; } = string.Empty;

        [Required, StringLength(100)]
        public string LastName { get; set; } = string.Empty;

        [StringLength(100)]
        public string? Specialty { get; set; }

        public DateOnly? HireDate { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime? CreatedAt { get; set; }

        // Populated from JOIN with Users table (read-only)
        public int? LinkedUserId { get; set; }
        public string? LinkedUsername { get; set; }
    }
}
