namespace MechanicApp.Server.Models
{
    public class Tenant
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Status { get; set; } = "active";
        public string DatabaseName { get; set; } = string.Empty;
        public string? StripeCustomerId { get; set; }
        public string? StripeSubscriptionId { get; set; }
        public string PlanName { get; set; } = "trial";
        public int MaxUsers { get; set; } = 5;
        public bool IsDemo { get; set; }
        public DateTime? DemoExpiresAt { get; set; }
        public DateTime? SubscriptionExpiresAt { get; set; }
        public string? Country { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
