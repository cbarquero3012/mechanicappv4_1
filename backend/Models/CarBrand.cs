using System.ComponentModel.DataAnnotations;

namespace MechanicApp.Server.Models
{
    public class CarBrand
    {
        public int Id { get; set; }

        [Required, StringLength(100)]
        public string BrandName { get; set; } = string.Empty;

        [StringLength(100)]
        public string? Country { get; set; }

        public DateTime? CreatedAt { get; set; }
    }
}
