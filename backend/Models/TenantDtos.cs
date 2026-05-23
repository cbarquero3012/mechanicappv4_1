namespace MechanicApp.Server.Models
{
    public class CreateTenantRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? PlanName { get; set; }
        public string? Country { get; set; }
    }

    public class CreateDemoRequest
    {
        public string? Name { get; set; }
        public string? Email { get; set; }
        public string? Username { get; set; }
        public string? Country { get; set; }
    }

    public class TenantOnboardRequest
    {
        public string Email { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public string AdminPassword { get; set; } = string.Empty;
        public string? Username { get; set; }
        public string? PlanName { get; set; }
        public string? Country { get; set; }
    }
}
