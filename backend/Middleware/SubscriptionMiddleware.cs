using MechanicApp.Server.Constants;
using MechanicApp.Server.Models;
using MechanicApp.Server.Services;

namespace MechanicApp.Server.Middleware
{
    /// <summary>
    /// Middleware that checks if the app has an active subscription.
    /// If the subscription is expired/inactive, all authenticated API calls
    /// return 403 except for: login, subscription endpoints, and app settings.
    /// </summary>
    public class SubscriptionMiddleware(RequestDelegate next)
    {
        /// <summary>Paths that bypass subscription checking.</summary>
        private static readonly string[] AllowedPaths =
        {
            "/api/auth",
            "/api/subscription",
            "/api/appsettings",
            "/api/tenant",
            "/api/demo",
            "/openapi",
            "/scalar"
        };

        /// <summary>
        /// Checks subscription status and blocks API access if expired.
        /// Supports both legacy single-tenant mode and new multi-tenant mode.
        /// </summary>
        public async Task InvokeAsync(HttpContext context, IDbService db, ITenantContext tenantContext)
        {
            var path = context.Request.Path.Value?.ToLowerInvariant() ?? "";

            // Skip middleware for non-API paths, allowed paths, and static files
            if (!path.StartsWith("/api/") ||
                AllowedPaths.Any(p => path.StartsWith(p, StringComparison.OrdinalIgnoreCase)))
            {
                await next(context);
                return;
            }

            // If tenant is resolved and is a demo, allow access (demo expiration checked in TenantResolutionMiddleware)
            if (tenantContext.IsResolved && tenantContext.CurrentTenant!.IsDemo)
            {
                await next(context);
                return;
            }

            // If tenant is resolved and has a valid subscription expiry, use that
            if (tenantContext.IsResolved && tenantContext.CurrentTenant!.SubscriptionExpiresAt.HasValue)
            {
                if (tenantContext.CurrentTenant.SubscriptionExpiresAt > DateTime.UtcNow)
                {
                    await next(context);
                    return;
                }

                context.Response.StatusCode = 403;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync(
                    System.Text.Json.JsonSerializer.Serialize(new
                    {
                        message = "Subscription expired. Please renew your subscription.",
                        code = "SUBSCRIPTION_REQUIRED",
                        expiresAt = tenantContext.CurrentTenant.SubscriptionExpiresAt
                    }));
                return;
            }

            // Legacy mode: check the Subscriptions table in the tenant DB
            var sub = await db.GetAsync<Subscription>(
                @"SELECT ""Id"", ""Status"", ""ExpiresAt""
                  FROM mechanic_db.""Subscriptions""
                  ORDER BY ""Id"" DESC LIMIT 1", new { });

            var isActive = sub != null &&
                           sub.Status == SubscriptionStatus.Active &&
                           (sub.ExpiresAt == null || sub.ExpiresAt > DateTime.UtcNow);

            if (!isActive)
            {
                context.Response.StatusCode = 403;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync(
                    System.Text.Json.JsonSerializer.Serialize(new
                    {
                        message = "Subscription expired or inactive. Please renew your subscription.",
                        code = "SUBSCRIPTION_REQUIRED",
                        expiresAt = sub?.ExpiresAt
                    }));
                return;
            }

            await next(context);
        }
    }
}
