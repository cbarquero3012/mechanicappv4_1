using MechanicApp.Server.Models;

namespace MechanicApp.Server.Services
{
    /// <summary>
    /// Holds the resolved tenant context for the current HTTP request (scoped lifetime).
    /// </summary>
    public interface ITenantContext
    {
        /// <summary>The resolved tenant for the current request, or null if not resolved.</summary>
        Tenant? CurrentTenant { get; }

        /// <summary>The connection string to the tenant's isolated database.</summary>
        string? ConnectionString { get; }

        /// <summary>Whether the current request has a valid resolved tenant.</summary>
        bool IsResolved { get; }

        /// <summary>Sets the tenant for this request scope.</summary>
        void SetTenant(Tenant tenant, string connectionString);
    }

    public class TenantContext : ITenantContext
    {
        public Tenant? CurrentTenant { get; private set; }
        public string? ConnectionString { get; private set; }
        public bool IsResolved => CurrentTenant != null && ConnectionString != null;

        public void SetTenant(Tenant tenant, string connectionString)
        {
            CurrentTenant = tenant;
            ConnectionString = connectionString;
        }
    }
}
