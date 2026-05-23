using System.ComponentModel.DataAnnotations;

namespace MechanicApp.Server.Models
{
    public class Product
    {
        public int Id { get; set; }

        [Required, StringLength(150)]
        public string Name { get; set; } = string.Empty;

        [StringLength(50)]
        public string? SKU { get; set; }

        [Required, StringLength(50)]
        public string Category { get; set; } = "General";

        [StringLength(500)]
        public string? Description { get; set; }

        [Range(0, int.MaxValue)]
        public int Quantity { get; set; }

        [Range(0, int.MaxValue)]
        public int MinStock { get; set; } = 5;

        [Range(0.0, 9999999.99)]
        public decimal UnitCost { get; set; }

        [Range(0.0, 9999999.99)]
        public decimal SellPrice { get; set; }

        [StringLength(100)]
        public string? Brand { get; set; }

        public int? CurrencyId { get; set; }
        public string? CurrencySymbol { get; set; }

        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
