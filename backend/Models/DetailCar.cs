using System.ComponentModel.DataAnnotations;

namespace MechanicApp.Server.Models
{
    public class DetailCar
    {
        public int Id { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "A valid Car Model must be selected.")]
        public int CarModelId { get; set; }

        public int? CustomerId { get; set; }

        [Required, StringLength(17)]
        public string VIN { get; set; } = string.Empty;

        [Required, StringLength(30)]
        public string Fuel { get; set; } = string.Empty;

        [Range(1900, 2100)]
        public int Year { get; set; }

        [Required, StringLength(30)]
        public string TypeCar { get; set; } = string.Empty;

        [Required, StringLength(30)]
        public string TransmissionType { get; set; } = string.Empty;

        [StringLength(20)]
        public string LicensePlate { get; set; } = string.Empty;

        [Range(0, int.MaxValue)]
        public int Mileage { get; set; }

        public DateTime? CreatedAt { get; set; }

        // Populated from JOINs (read-only display fields)
        public string? Brand { get; set; }
        public string? Model { get; set; }
        public string? CustomerName { get; set; }
    }
}
