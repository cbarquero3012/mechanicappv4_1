using System.ComponentModel.DataAnnotations;

namespace MechanicApp.Server.Models
{
    public class RepairOrder
    {
        public int Id { get; set; }
        public int? DetailCarId { get; set; }
        public int? MechanicId { get; set; }
        public DateTime OrderDate { get; set; } = DateTime.UtcNow;

        [Required, StringLength(30)]
        public string Status { get; set; } = "Pending";

        [Range(0.0, 9999999.99)]
        public decimal TotalCost { get; set; }

        [StringLength(1000)]
        public string? Notes { get; set; }

        public int? CurrencyId { get; set; }

        public DateTime? CreatedAt { get; set; }

        // Populated from JOINs (read-only display fields)
        public string? CarInfo { get; set; }
        public string? MechanicName { get; set; }
        public string? CurrencySymbol { get; set; }
        public decimal TotalPaid { get; set; }
        public string? CustomerName { get; set; }
        public string? LicensePlate { get; set; }
    }
}
