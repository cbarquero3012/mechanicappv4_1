using MechanicApp.Server.Models;

namespace MechanicApp.Server.Services
{
    public interface ITenantProvisioningService
    {
        /// <summary>
        /// Creates a new tenant database by cloning the template and registers it in the control plane.
        /// </summary>
        Task<Tenant> ProvisionTenantAsync(string name, string email, string planName, bool isDemo = false, string? country = null);

        /// <summary>
        /// Converts a demo tenant to a paid tenant (preserves data).
        /// </summary>
        Task<Tenant> ConvertDemoToPaidAsync(int tenantId, string planName, string? stripeSubscriptionId, string? country = null);

        /// <summary>
        /// Drops expired demo databases and removes their tenant records.
        /// </summary>
        Task<int> CleanupExpiredDemosAsync();

        /// <summary>
        /// Gets a tenant by its slug (subdomain identifier).
        /// </summary>
        Task<Tenant?> GetTenantBySlugAsync(string slug);

        /// <summary>
        /// Gets a tenant by email address.
        /// </summary>
        Task<Tenant?> GetTenantByEmailAsync(string email);

        /// <summary>
        /// Gets all tenants.
        /// </summary>
        Task<List<Tenant>> GetAllTenantsAsync();

        /// <summary>
        /// Seeds a newly provisioned tenant database with demo data.
        /// </summary>
        Task SeedDemoDataAsync(string databaseName);

        /// <summary>
        /// Ensures the AppSettings row in a tenant database has the correct default values
        /// (AppName = "Mechanic App", LogoUrl = "/assets/logo.svg", FaviconUrl = "/assets/favicon.svg").
        /// Safe to call on any provisioned tenant — will not overwrite tenant-customised values.
        /// Optionally sets the Timezone based on the country provided.
        /// </summary>
        Task SeedDefaultAppSettingsAsync(string databaseName, string? country = null);

        /// <summary>
        /// Sets the admin user's password and email in a tenant database.
        /// Optionally sets the country too.
        /// </summary>
        Task SetAdminCredentialsAsync(string databaseName, string email, string password, string? country = null);

        /// <summary>
        /// Creates a pending subscription record in a tenant database so the subscription guard
        /// recognizes a valid (pending payment) state.
        /// </summary>
        Task CreatePendingSubscriptionAsync(string databaseName, string email, string planName);

        /// <summary>
        /// Creates an active subscription with 30-day grace period in a tenant database.
        /// Stripe webhook will extend or cancel when payment is confirmed.
        /// </summary>
        Task CreateActiveSubscriptionAsync(string databaseName, string email, string planName);

        /// <summary>
        /// Updates the admin user's username in a tenant database.
        /// </summary>
        Task SetAdminUsernameAsync(string databaseName, string username);

        /// <summary>
        /// Updates the subscription plan and expiry in the control plane for an existing tenant.
        /// </summary>
        Task UpdateTenantSubscriptionAsync(int tenantId, string planName, DateTime expiresAt);

        /// <summary>
        /// Gets the admin username from a tenant database.
        /// </summary>
        Task<string> GetAdminUsernameAsync(string databaseName);

        /// <summary>
        /// Updates the subscription record in a tenant database after Stripe webhook confirmation.
        /// </summary>
        Task UpsertSubscriptionFromWebhookAsync(string databaseName, string email, string status,
            string? sessionId, string? subscriptionId, string? payload);

        /// <summary>
        /// Checks if a welcome email has already been sent for a given Stripe session (idempotency).
        /// </summary>
        Task<bool> HasWelcomeEmailBeenSentAsync(string databaseName, string sessionId);

        /// <summary>
        /// Records that a welcome email was sent for a given Stripe session (idempotency).
        /// </summary>
        Task MarkWelcomeEmailSentAsync(string databaseName, string sessionId);
    }
}
