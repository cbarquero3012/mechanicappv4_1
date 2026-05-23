using System.ComponentModel.DataAnnotations;

namespace MechanicApp.Server.Models
{
    public class Currency
    {
        public int Id { get; set; }

        [Required, StringLength(3)]
        public string Code { get; set; } = string.Empty;

        [Required, StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required, StringLength(5)]
        public string Symbol { get; set; } = string.Empty;

        public decimal ExchangeRate { get; set; } = 1.000000m;

        public bool IsDefault { get; set; } = false;

        public bool IsActive { get; set; } = true;

        public DateTime? CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }
    }
}
