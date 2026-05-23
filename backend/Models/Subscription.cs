namespace MechanicApp.Server.Models
{
    public class Subscription
    {
        public int Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string? StripeSessionId { get; set; }
        public string? StripeSubscriptionId { get; set; }

        /// <summary>active, inactive, cancelled, refunded, expired</summary>
        public string Status { get; set; } = "inactive";

        public string? PlanName { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? ExpiresAt { get; set; }
        public string? StripePayload { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
