using Dapper;
using MechanicApp.Server.Constants;
using MechanicApp.Server.Models;
using MechanicApp.Server.Services;
using Npgsql;

namespace MechanicApp.Server.Middleware
{
    /// <summary>
    /// Resolves the current tenant from the request (subdomain, header, or JWT claim)
    /// and populates the ITenantContext for downstream services.
    /// </summary>
    public class TenantResolutionMiddleware(RequestDelegate next, IConfiguration configuration)
    {
        private readonly string _controlConnString = configuration.GetConnectionString("ControlPlane")!;

        /// <summary>Paths that bypass tenant resolution (control-plane endpoints).</summary>
        private static readonly string[] BypassPaths =
        {
            "/api/tenant",
            "/api/demo",
            "/api/subscription/webhook",
            "/api/subscription/onboard",
            "/api/subscription/plans",
            "/openapi",
            "/scalar"
        };

        public async Task InvokeAsync(HttpContext context, ITenantContext tenantContext)
        {
            var path = context.Request.Path.Value?.ToLowerInvariant() ?? "";

            // Skip for non-API, control-plane, and infrastructure paths
            if (!path.StartsWith("/api/") ||
                BypassPaths.Any(p => path.StartsWith(p, StringComparison.OrdinalIgnoreCase)))
            {
                await next(context);
                return;
            }

            // Resolve tenant from multiple sources (priority order)
            var tenant = await ResolveTenantAsync(context);

            if (tenant == null)
            {
                // No tenant resolved — return 401 so the client knows it needs to supply a tenant slug.
                // The main database no longer contains the mechanic_db schema, so a fallback connection
                // would only produce errors.
                context.Response.StatusCode = 401;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync(
                    System.Text.Json.JsonSerializer.Serialize(new
                    {
                        message = "Tenant not identified. Please supply the X-Tenant-Slug header.",
                        code = "TENANT_REQUIRED"
                    }));
                return;
            }

            // Check tenant status
            if (tenant.Status == TenantStatus.Suspended || tenant.Status == TenantStatus.Cancelled)
            {
                context.Response.StatusCode = 403;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync(
                    System.Text.Json.JsonSerializer.Serialize(new
                    {
                        message = "Tenant account is suspended or cancelled.",
                        code = "TENANT_SUSPENDED"
                    }));
                return;
            }

            // Check demo expiration
            if (tenant.IsDemo && tenant.DemoExpiresAt.HasValue && tenant.DemoExpiresAt < DateTime.UtcNow)
            {
                context.Response.StatusCode = 403;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync(
                    System.Text.Json.JsonSerializer.Serialize(new
                    {
                        message = "Demo period has expired. Please subscribe to continue.",
                        code = "DEMO_EXPIRED",
                        expiredAt = tenant.DemoExpiresAt
                    }));
                return;
            }

            // Build tenant-specific connection string
            var connString = BuildTenantConnectionString(tenant.DatabaseName);
            ((TenantContext)tenantContext).SetTenant(tenant, connString);

            await next(context);
        }

        private async Task<Tenant?> ResolveTenantAsync(HttpContext context)
        {
            // 1. Try X-Tenant-Slug header (API clients, development)
            if (context.Request.Headers.TryGetValue("X-Tenant-Slug", out var slugHeader) &&
                !string.IsNullOrWhiteSpace(slugHeader))
            {
                return await GetTenantBySlugAsync(slugHeader!);
            }

            // 2. Try subdomain (production: client1.mechanicapp.com)
            var host = context.Request.Host.Host;
            var parts = host.Split('.');
            if (parts.Length >= 3 && parts[0] != "www" && parts[0] != "api")
            {
                return await GetTenantBySlugAsync(parts[0]);
            }

            // 3. Try JWT claim (authenticated requests with tenant_slug claim)
            var tenantClaim = context.User?.FindFirst("tenant_slug")?.Value;
            if (!string.IsNullOrWhiteSpace(tenantClaim))
            {
                return await GetTenantBySlugAsync(tenantClaim);
            }

            // No tenant resolved
            return null;
        }

        private async Task<Tenant?> GetTenantBySlugAsync(string slug)
        {
            await using var conn = new NpgsqlConnection(_controlConnString);
            return await conn.QueryFirstOrDefaultAsync<Tenant>(
                @"SELECT * FROM control_plane.""Tenants"" WHERE ""Slug"" = @Slug AND ""Status"" != 'cancelled'",
                new { Slug = slug });
        }

        private string BuildTenantConnectionString(string databaseName)
        {
            var builder = new NpgsqlConnectionStringBuilder(_controlConnString)
            {
                Database = databaseName
            };
            return builder.ConnectionString;
        }
    }
}
