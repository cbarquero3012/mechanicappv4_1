namespace MechanicApp.Server.Models
{
    public class ManualActivateRequest
    {
        public string? Email { get; set; }
        public string? PlanName { get; set; }
        public DateTime? ExpiresAt { get; set; }
    }
}
