using System.ComponentModel.DataAnnotations;

namespace MechanicApp.Server.Models
{
    public class Payment
    {
        public int Id { get; set; }

        public int? CustomerId { get; set; }

        [Range(0.01, 9999999.99, ErrorMessage = "Amount must be greater than zero.")]
        public decimal Amount { get; set; }

        [Required, StringLength(30)]
        public string PaymentMethod { get; set; } = "Cash";

        [StringLength(100)]
        public string? ReferenceNumber { get; set; }

        public DateTime? PaymentDate { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }

        public int? CurrencyId { get; set; }

        public decimal? OriginalAmount { get; set; }

        public int? OriginalCurrencyId { get; set; }

        public DateTime? CreatedAt { get; set; }

        // Input-only: list of repair order IDs for multi-order payment
        public int[]? RepairOrderIds { get; set; }

        // Populated from JOINs (read-only display fields)
        public string? OrderInfo { get; set; }
        public string? CarInfo { get; set; }
        public string? CustomerName { get; set; }
        public decimal? OrderTotal { get; set; }
        public string? CurrencySymbol { get; set; }
        public string? OriginalCurrencySymbol { get; set; }
    }
}
