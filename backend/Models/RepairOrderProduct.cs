using System.ComponentModel.DataAnnotations;

namespace MechanicApp.Server.Models
{
    public class RepairOrderProduct
    {
        public int Id { get; set; }

        [Range(1, int.MaxValue)]
        public int RepairOrderId { get; set; }

        [Range(1, int.MaxValue)]
        public int ProductId { get; set; }

        [Range(1, int.MaxValue)]
        public int Quantity { get; set; } = 1;

        [Range(0.0, 9999999.99)]
        public decimal UnitPrice { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }

        public DateTime? CreatedAt { get; set; }

        // Display fields from JOINs
        public string? ProductName { get; set; }
        public string? ProductSKU { get; set; }
        public string? ProductCategory { get; set; }
        public string? CurrencySymbol { get; set; }
    }
}
