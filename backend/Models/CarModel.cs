using System.ComponentModel.DataAnnotations;

namespace MechanicApp.Server.Models
{
    public class CarModel
    {
        public int Id { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "A valid Brand must be selected.")]
        public int BrandId { get; set; }

        [Required, StringLength(100)]
        public string ModelName { get; set; } = string.Empty;

        public DateTime? CreatedAt { get; set; }

        // Display field from JOIN
        public string? BrandName { get; set; }
    }
}
