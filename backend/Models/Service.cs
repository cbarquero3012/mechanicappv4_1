using System.ComponentModel.DataAnnotations;

namespace MechanicApp.Server.Models
{
    public class Service
    {
        public int Id { get; set; }

        [Required, StringLength(150)]
        public string Name { get; set; } = string.Empty;

        [Required, StringLength(50)]
        public string Category { get; set; } = "General";

        [StringLength(500)]
        public string? Description { get; set; }

        [Range(0.0, 9999999.99)]
        public decimal BasePrice { get; set; }

        [Range(0.0, 1000.0)]
        public decimal? EstimatedHours { get; set; }

        public bool IsActive { get; set; } = true;

        public int? CurrencyId { get; set; }
        public string? CurrencySymbol { get; set; }

        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
