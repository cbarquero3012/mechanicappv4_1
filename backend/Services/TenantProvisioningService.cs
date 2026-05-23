using System.Text.RegularExpressions;
using Dapper;
using MechanicApp.Server.Constants;
using MechanicApp.Server.Models;
using Npgsql;

namespace MechanicApp.Server.Services
{
    public class TenantProvisioningService : ITenantProvisioningService
    {
        private readonly string _controlConnString;
        private readonly string _adminConnString;
        private readonly ILogger<TenantProvisioningService> _logger;

        public TenantProvisioningService(
            IConfiguration configuration,
            ILogger<TenantProvisioningService> logger)
        {
            _controlConnString = configuration.GetConnectionString("ControlPlane")!;
            // Admin connection to postgres DB for CREATE DATABASE commands
            _adminConnString = configuration.GetConnectionString("AdminConnection")!;
            _logger = logger;
        }

        public async Task<Tenant> ProvisionTenantAsync(string name, string email, string planName, bool isDemo = false, string? country = null)
        {
            var baseSlug = GenerateSlug(name);
            var slug = await EnsureUniqueSlugAsync(baseSlug);
            var dbPrefix = isDemo ? "mechanic_app_demo_tenant" : "mechanic_app_tenant";
            var dbName = await EnsureUniqueDbNameAsync($"{dbPrefix}_{slug}_{DateTime.UtcNow:yyyyMMdd}");

            _logger.LogInformation("Provisioning tenant database: {DbName} for {Email}", dbName, email);

            // 1. Create the tenant database from template
            await CreateDatabaseFromTemplateAsync(dbName);

            // 2. Register in control plane
            var tenant = new Tenant
            {
                Name = name,
                Slug = slug,
                Email = email,
                Status = isDemo ? TenantStatus.Demo : TenantStatus.Active,
                DatabaseName = dbName,
                PlanName = isDemo ? SubscriptionPlans.FreeTrial : planName,
                IsDemo = isDemo,
                DemoExpiresAt = isDemo ? DateTime.UtcNow.AddDays(SubscriptionPlans.GetTrialDays(SubscriptionPlans.FreeTrial)) : null,
                SubscriptionExpiresAt = isDemo ? null : DateTime.UtcNow.AddDays(30),
                MaxUsers = SubscriptionPlans.GetMaxUsers(isDemo ? SubscriptionPlans.FreeTrial : planName),
                Country = country,
                CreatedAt = DateTime.UtcNow
            };

            await using var conn = new NpgsqlConnection(_controlConnString);
            var id = await conn.QuerySingleAsync<int>(
                @"INSERT INTO control_plane.""Tenants""
                  (""Name"", ""Slug"", ""Email"", ""Status"", ""DatabaseName"",
                   ""PlanName"", ""MaxUsers"", ""IsDemo"", ""DemoExpiresAt"",
                   ""SubscriptionExpiresAt"", ""Country"", ""CreatedAt"")
                  VALUES (@Name, @Slug, @Email, @Status, @DatabaseName,
                          @PlanName, @MaxUsers, @IsDemo, @DemoExpiresAt,
                          @SubscriptionExpiresAt, @Country, @CreatedAt)
                  RETURNING ""Id""",
                tenant);

            tenant.Id = id;

            // 3. Seed default AppSettings (app name, logo, favicon, timezone)
            await SeedDefaultAppSettingsAsync(dbName, country);

            // 4. Seed demo data if it's a demo tenant
            if (isDemo)
            {
                await SeedDemoDataAsync(dbName);
            }

            _logger.LogInformation("Tenant provisioned successfully: {TenantId} ({DbName})", id, dbName);
            return tenant;
        }

        public async Task<Tenant> ConvertDemoToPaidAsync(int tenantId, string planName, string? stripeSubscriptionId, string? country = null)
        {
            // Fetch current tenant to determine if DB rename is needed
            var currentTenant = await GetTenantByIdAsync(tenantId)
                ?? throw new InvalidOperationException($"Tenant {tenantId} not found");

            // Rename DB: mechanic_app_demo_tenant_* → mechanic_app_tenant_*
            const string demoPrefix = "mechanic_app_demo_tenant_";
            const string paidPrefix = "mechanic_app_tenant_";
            var newDbName = currentTenant.DatabaseName;
            if (currentTenant.DatabaseName.StartsWith(demoPrefix, StringComparison.OrdinalIgnoreCase))
            {
                newDbName = paidPrefix + currentTenant.DatabaseName[demoPrefix.Length..];
                await RenameDatabaseAsync(currentTenant.DatabaseName, newDbName);
                _logger.LogInformation("Renamed demo DB: {OldName} → {NewName}",
                    currentTenant.DatabaseName, newDbName);
            }

            await using var conn = new NpgsqlConnection(_controlConnString);

            // Mark the demo subscription in the tenant DB as inactive, recording the exact conversion date
            var conversionDate = DateTime.UtcNow;
            var tenantConnString = BuildTenantConnectionString(newDbName);
            await using (var tenantConn = new NpgsqlConnection(tenantConnString))
            {
                await tenantConn.ExecuteAsync(
                    @"UPDATE mechanic_db.""Subscriptions"" SET
                      ""Status"" = 'inactive',
                      ""ExpiresAt"" = @ConversionDate,
                      ""UpdatedAt"" = CURRENT_TIMESTAMP
                      WHERE ""Status"" IN ('active', 'demo')",
                    new { ConversionDate = conversionDate });
            }

            await conn.ExecuteAsync(
                @"UPDATE control_plane.""Tenants"" SET
                  ""Status"" = @Status,
                  ""IsDemo"" = FALSE,
                  ""PlanName"" = @PlanName,
                  ""StripeSubscriptionId"" = @StripeSubscriptionId,
                  ""SubscriptionExpiresAt"" = @ExpiresAt,
                  ""DemoExpiresAt"" = @DemoExpiresAt,
                  ""MaxUsers"" = @MaxUsers,
                  ""DatabaseName"" = @DatabaseName,
                  ""Country"" = COALESCE(@Country, ""Country""),
                  ""UpdatedAt"" = CURRENT_TIMESTAMP
                  WHERE ""Id"" = @Id",
                new
                {
                    Status = TenantStatus.Active,
                    PlanName = planName,
                    StripeSubscriptionId = stripeSubscriptionId,
                    ExpiresAt = DateTime.UtcNow.AddDays(30),
                    DemoExpiresAt = conversionDate,
                    MaxUsers = SubscriptionPlans.GetMaxUsers(planName),
                    DatabaseName = newDbName,
                    Country = country,
                    Id = tenantId
                });

            // If country provided, also update the admin user's Country in the tenant DB
            if (!string.IsNullOrWhiteSpace(country))
            {
                await using var updConn = new NpgsqlConnection(tenantConnString);
                await updConn.ExecuteAsync(
                    @"UPDATE mechanic_db.""Users"" SET ""Country"" = @Country WHERE ""Role"" = 'admin'",
                    new { Country = country });
            }

            return (await GetTenantByIdAsync(tenantId))!;
        }

        public async Task<int> CleanupExpiredDemosAsync()
        {
            await using var conn = new NpgsqlConnection(_controlConnString);

            var expired = await conn.QueryAsync<Tenant>(
                @"SELECT * FROM control_plane.""Tenants""
                  WHERE ""IsDemo"" = TRUE AND ""DemoExpiresAt"" < @Now",
                new { Now = DateTime.UtcNow });

            var count = 0;
            foreach (var tenant in expired)
            {
                try
                {
                    await DropDatabaseAsync(tenant.DatabaseName);
                    await conn.ExecuteAsync(
                        @"DELETE FROM control_plane.""Tenants"" WHERE ""Id"" = @Id",
                        new { tenant.Id });
                    count++;
                    _logger.LogInformation("Cleaned up expired demo: {DbName}", tenant.DatabaseName);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to cleanup demo tenant {Id}: {DbName}", tenant.Id, tenant.DatabaseName);
                }
            }

            return count;
        }

        public async Task<Tenant?> GetTenantBySlugAsync(string slug)
        {
            await using var conn = new NpgsqlConnection(_controlConnString);
            return await conn.QueryFirstOrDefaultAsync<Tenant>(
                @"SELECT * FROM control_plane.""Tenants"" WHERE ""Slug"" = @Slug",
                new { Slug = slug });
        }

        public async Task<Tenant?> GetTenantByEmailAsync(string email)
        {
            await using var conn = new NpgsqlConnection(_controlConnString);
            return await conn.QueryFirstOrDefaultAsync<Tenant>(
                @"SELECT * FROM control_plane.""Tenants"" WHERE ""Email"" = @Email ORDER BY ""Id"" DESC LIMIT 1",
                new { Email = email });
        }

        public async Task<List<Tenant>> GetAllTenantsAsync()
        {
            await using var conn = new NpgsqlConnection(_controlConnString);
            var result = await conn.QueryAsync<Tenant>(
                @"SELECT * FROM control_plane.""Tenants"" ORDER BY ""CreatedAt"" DESC");
            return result.ToList();
        }

        public async Task SeedDefaultAppSettingsAsync(string databaseName, string? country = null)
        {
            var timezone = CountryTimezoneService.GetTimezone(country);
            var connString = BuildTenantConnectionString(databaseName);
            await using var conn = new NpgsqlConnection(connString);
            await conn.OpenAsync();

            // Ensure the AppSettings row exists with the correct defaults.
            // Uses UPSERT so it won't overwrite tenant-customised values if called more than once.
            await conn.ExecuteAsync(
                @"INSERT INTO mechanic_db.""AppSettings"" (""AppName"", ""LogoUrl"", ""FaviconUrl"", ""Timezone"")
                  VALUES ('Mechanic App', '/assets/logo.svg', '/assets/favicon.svg', @Timezone)
                  ON CONFLICT DO NOTHING",
                new { Timezone = timezone });

            // If a row already exists but has no logo/favicon/timezone (e.g. cloned from older template), fill the gaps
            await conn.ExecuteAsync(
                @"UPDATE mechanic_db.""AppSettings""
                  SET ""AppName""    = CASE WHEN ""AppName"" = 'MechanicApp' OR ""AppName"" = '' THEN 'Mechanic App' ELSE ""AppName"" END,
                      ""LogoUrl""    = COALESCE(NULLIF(""LogoUrl"", ''), '/assets/logo.svg'),
                      ""FaviconUrl"" = COALESCE(NULLIF(""FaviconUrl"", ''), '/assets/favicon.svg'),
                      ""Timezone""   = COALESCE(NULLIF(""Timezone"", ''), @Timezone)",
                new { Timezone = timezone });

            // Ensure the global super-admin user exists in every tenant DB.
            // Uses ON CONFLICT so it is safe to call multiple times and will not
            // overwrite a row that was already customised after initial provisioning.
            await conn.ExecuteAsync(
                @"INSERT INTO mechanic_db.""Users""
                    (""Username"", ""PasswordHash"", ""FullName"", ""Email"", ""Role"")
                  VALUES (
                    'superuser',
                    '$2a$11$rmcbiOPTla/NpdeMTtDK1.Ia9AuYhDDKe1nnJUrWjEmWCZ3FbWWsi',
                    'Super Administrator',
                    'superuser@local.com',
                    'super-admin'
                  )
                  ON CONFLICT (""Username"") DO NOTHING");

            _logger.LogInformation("Default AppSettings and super-admin user seeded for database: {DbName}", databaseName);
        }

        public async Task SeedDemoDataAsync(string databaseName)
        {
            var connString = BuildTenantConnectionString(databaseName);
            await using var conn = new NpgsqlConnection(connString);
            await conn.OpenAsync();

            // Seed sample customers
            await conn.ExecuteAsync(
                @"INSERT INTO mechanic_db.""Customers"" (""FirstName"", ""LastName"", ""Email"", ""PhoneNumber"", ""Address"")
                  VALUES
                  ('Carlos', 'Demo', 'carlos@demo.com', '8888-1111', '123 Demo Street'),
                  ('María', 'Demo', 'maria@demo.com', '8888-2222', '456 Sample Ave'),
                  ('Luis', 'Demo', 'luis@demo.com', '8888-3333', '789 Test Blvd')
                  ON CONFLICT DO NOTHING");

            // Seed sample mechanic
            await conn.ExecuteAsync(
                @"INSERT INTO mechanic_db.""Mechanics"" (""FirstName"", ""LastName"", ""Specialty"", ""HireDate"", ""IsActive"")
                  VALUES ('Juan', 'Demo Mechanic', 'General', CURRENT_DATE, TRUE)
                  ON CONFLICT DO NOTHING");

            _logger.LogInformation("Demo data seeded for database: {DbName}", databaseName);
        }

        /// <summary>
        /// Sets (or resets) the admin user's password and email in a tenant database.
        /// Used after onboarding to personalize the template-cloned admin account.
        /// </summary>
        public async Task SetAdminCredentialsAsync(string databaseName, string email, string password, string? country = null)
        {
            var connString = BuildTenantConnectionString(databaseName);
            await using var conn = new NpgsqlConnection(connString);
            await conn.OpenAsync();

            var passwordHash = BCrypt.Net.BCrypt.HashPassword(password);

            await conn.ExecuteAsync(
                @"UPDATE mechanic_db.""Users""
                  SET ""PasswordHash"" = @PasswordHash, ""Email"" = @Email,
                      ""Country"" = COALESCE(@Country, ""Country"")
                  WHERE ""Role"" = 'admin' AND ""Username"" = 'administrador'",
                new { PasswordHash = passwordHash, Email = email, Country = country });

            _logger.LogInformation("Admin credentials set for database: {DbName}", databaseName);
        }

        public async Task SetAdminUsernameAsync(string databaseName, string username)
        {
            var connString = BuildTenantConnectionString(databaseName);
            await using var conn = new NpgsqlConnection(connString);
            await conn.OpenAsync();

            await conn.ExecuteAsync(
                @"UPDATE mechanic_db.""Users""
                  SET ""Username"" = @Username
                  WHERE ""Role"" = 'admin' AND ""Username"" = 'administrador'",
                new { Username = username });

            _logger.LogInformation("Admin username updated to '{Username}' for database: {DbName}", username, databaseName);
        }

        public async Task CreatePendingSubscriptionAsync(string databaseName, string email, string planName)
        {
            await CreateActiveSubscriptionAsync(databaseName, email, planName);
        }

        public async Task CreateActiveSubscriptionAsync(string databaseName, string email, string planName)
        {
            var connString = BuildTenantConnectionString(databaseName);
            await using var conn = new NpgsqlConnection(connString);
            await conn.OpenAsync();

            // Update any existing inactive/expired rows for this email so the legacy
            // fallback in GetStatus() never sees a stale "inactive" row after an upgrade.
            var updated = await conn.ExecuteAsync(
                @"UPDATE mechanic_db.""Subscriptions""
                  SET ""Status"" = 'active',
                      ""PlanName"" = @PlanName,
                      ""ExpiresAt"" = CURRENT_TIMESTAMP + INTERVAL '30 days',
                      ""UpdatedAt"" = CURRENT_TIMESTAMP
                  WHERE ""Email"" = @Email
                    AND (""Status"" != 'active' OR ""ExpiresAt"" < CURRENT_TIMESTAMP)",
                new { Email = email, PlanName = planName });

            // If no row was updated, insert a fresh active subscription record.
            if (updated == 0)
            {
                await conn.ExecuteAsync(
                    @"INSERT INTO mechanic_db.""Subscriptions""
                      (""Email"", ""Status"", ""PlanName"", ""StartDate"", ""ExpiresAt"")
                      VALUES (@Email, 'active', @PlanName, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days')",
                    new { Email = email, PlanName = planName });
            }

            _logger.LogInformation("Active subscription ensured for database: {DbName}, plan: {Plan}", databaseName, planName);
        }

        public async Task UpdateTenantSubscriptionAsync(int tenantId, string planName, DateTime expiresAt)
        {
            await using var conn = new NpgsqlConnection(_controlConnString);

            await conn.ExecuteAsync(
                @"UPDATE control_plane.""Tenants"" SET
                  ""PlanName"" = @PlanName,
                  ""MaxUsers"" = @MaxUsers,
                  ""SubscriptionExpiresAt"" = @ExpiresAt,
                  ""UpdatedAt"" = CURRENT_TIMESTAMP
                  WHERE ""Id"" = @Id",
                new
                {
                    PlanName = planName,
                    MaxUsers = SubscriptionPlans.GetMaxUsers(planName),
                    ExpiresAt = expiresAt,
                    Id = tenantId
                });

            _logger.LogInformation("Tenant {Id} subscription updated: plan={Plan}, expires={Expires}", tenantId, planName, expiresAt);
        }

        // ──────── Private Helpers ────────

        public async Task<string> GetAdminUsernameAsync(string databaseName)
        {
            var connString = BuildTenantConnectionString(databaseName);
            await using var conn = new NpgsqlConnection(connString);
            await conn.OpenAsync();

            var username = await conn.QueryFirstOrDefaultAsync<string>(
                @"SELECT ""Username"" FROM mechanic_db.""Users"" WHERE ""Role"" = 'admin' LIMIT 1");

            return username ?? "administrador";
        }

        public async Task UpsertSubscriptionFromWebhookAsync(string databaseName, string email, string status,
            string? sessionId, string? subscriptionId, string? payload)
        {
            var connString = BuildTenantConnectionString(databaseName);
            await using var conn = new NpgsqlConnection(connString);
            await conn.OpenAsync();

            var existing = await conn.QueryFirstOrDefaultAsync<Subscription>(
                @"SELECT * FROM mechanic_db.""Subscriptions""
                  WHERE ""StripeSessionId"" = @SessionId
                     OR ""StripeSubscriptionId"" = @SubscriptionId
                     OR ""Email"" = @Email
                  ORDER BY ""Id"" DESC LIMIT 1",
                new { SessionId = sessionId ?? "", SubscriptionId = subscriptionId ?? "", Email = email });

            if (existing != null)
            {
                await conn.ExecuteAsync(
                    @"UPDATE mechanic_db.""Subscriptions"" SET
                      ""Status""=@Status,
                      ""StripeSessionId""=COALESCE(@SessionId, ""StripeSessionId""),
                      ""StripeSubscriptionId""=COALESCE(@SubscriptionId, ""StripeSubscriptionId""),
                      ""StripePayload""=@Payload::JSONB,
                      ""ExpiresAt""= CASE WHEN @Status='active' THEN CURRENT_TIMESTAMP + INTERVAL '30 days' ELSE ""ExpiresAt"" END,
                      ""UpdatedAt""=CURRENT_TIMESTAMP
                      WHERE ""Id""=@Id",
                    new
                    {
                        Status = status,
                        SessionId = string.IsNullOrEmpty(sessionId) ? null : sessionId,
                        SubscriptionId = string.IsNullOrEmpty(subscriptionId) ? null : subscriptionId,
                        Payload = payload,
                        Id = existing.Id
                    });
            }
            else
            {
                await conn.ExecuteAsync(
                    @"INSERT INTO mechanic_db.""Subscriptions""
                      (""Email"", ""StripeSessionId"", ""StripeSubscriptionId"", ""Status"",
                       ""PlanName"", ""StartDate"", ""ExpiresAt"", ""StripePayload"")
                      VALUES (@Email, @SessionId, @SubscriptionId, @Status,
                              'Stripe', CURRENT_TIMESTAMP,
                              CASE WHEN @Status='active' THEN CURRENT_TIMESTAMP + INTERVAL '30 days' ELSE NULL END,
                              @Payload::JSONB)",
                    new
                    {
                        Email = email,
                        SessionId = string.IsNullOrEmpty(sessionId) ? null : sessionId,
                        SubscriptionId = string.IsNullOrEmpty(subscriptionId) ? null : subscriptionId,
                        Status = status,
                        Payload = payload
                    });
            }

            _logger.LogInformation("Subscription upserted in tenant DB {DbName}: status={Status}", databaseName, status);
        }

        private async Task CreateDatabaseFromTemplateAsync(string dbName)
        {
            // Connect to 'postgres' system DB to issue CREATE DATABASE
            await using var conn = new NpgsqlConnection(_adminConnString);
            await conn.OpenAsync();

            // Terminate existing connections to template (required for TEMPLATE cloning)
            await conn.ExecuteAsync(
                @"SELECT pg_terminate_backend(pid)
                  FROM pg_stat_activity
                  WHERE datname = 'mechanic_template' AND pid <> pg_backend_pid()");

            // CREATE DATABASE cannot be parameterized, but we sanitize the name
            var safeName = SanitizeDbName(dbName);
            await conn.ExecuteAsync($"CREATE DATABASE \"{safeName}\" TEMPLATE mechanic_template");
        }

        private async Task RenameDatabaseAsync(string oldName, string newName)
        {
            await using var conn = new NpgsqlConnection(_adminConnString);
            await conn.OpenAsync();

            var safeOldName = SanitizeDbName(oldName);
            var safeNewName = SanitizeDbName(newName);

            // Terminate all active connections before renaming
            await conn.ExecuteAsync(
                $"SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '{safeOldName}' AND pid <> pg_backend_pid()");

            await conn.ExecuteAsync($"ALTER DATABASE \"{safeOldName}\" RENAME TO \"{safeNewName}\"");
        }

        private async Task DropDatabaseAsync(string dbName)
        {
            await using var conn = new NpgsqlConnection(_adminConnString);
            await conn.OpenAsync();

            var safeName = SanitizeDbName(dbName);

            // Terminate all connections first
            await conn.ExecuteAsync(
                $"SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '{safeName}' AND pid <> pg_backend_pid()");

            await conn.ExecuteAsync($"DROP DATABASE IF EXISTS \"{safeName}\"");
        }

        private async Task<Tenant?> GetTenantByIdAsync(int id)
        {
            await using var conn = new NpgsqlConnection(_controlConnString);
            return await conn.QueryFirstOrDefaultAsync<Tenant>(
                @"SELECT * FROM control_plane.""Tenants"" WHERE ""Id"" = @Id",
                new { Id = id });
        }

        private string BuildTenantConnectionString(string databaseName)
        {
            var builder = new NpgsqlConnectionStringBuilder(_controlConnString)
            {
                Database = databaseName
            };
            return builder.ConnectionString;
        }

        private static string GenerateSlug(string name)
        {
            var slug = name.ToLowerInvariant().Trim();
            slug = Regex.Replace(slug, @"[^a-z0-9\s-]", "");
            slug = Regex.Replace(slug, @"[\s-]+", "_");
            slug = slug.Trim('_');
            return slug.Length > 30 ? slug[..30] : slug;
        }

        /// <summary>Appends _2, _3 … until we find a slug not yet in control_plane.</summary>
        private async Task<string> EnsureUniqueSlugAsync(string baseSlug)
        {
            await using var conn = new NpgsqlConnection(_controlConnString);
            var slug = baseSlug;
            var counter = 2;
            while (true)
            {
                var count = await conn.QuerySingleAsync<int>(
                    @"SELECT COUNT(1) FROM control_plane.""Tenants"" WHERE ""Slug"" = @Slug",
                    new { Slug = slug });
                if (count == 0) return slug;
                slug = $"{baseSlug}_{counter++}";
                if (slug.Length > 35) slug = $"{baseSlug[..25]}_{counter++}";
            }
        }

        /// <summary>Appends _2, _3 … to the DB name if it already exists as a PostgreSQL database.</summary>
        private async Task<string> EnsureUniqueDbNameAsync(string baseName)
        {
            await using var conn = new NpgsqlConnection(_adminConnString);
            await conn.OpenAsync();
            var name = SanitizeDbName(baseName);
            var counter = 2;
            while (true)
            {
                var count = await conn.QuerySingleAsync<int>(
                    "SELECT COUNT(1) FROM pg_database WHERE datname = @Name",
                    new { Name = name });
                if (count == 0) return name;
                name = SanitizeDbName($"{baseName}_{counter++}");
            }
        }

        private static string SanitizeDbName(string name)
        {
            // Only allow alphanumeric and underscores to prevent SQL injection
            return Regex.Replace(name, @"[^a-zA-Z0-9_]", "");
        }

        public async Task<bool> HasWelcomeEmailBeenSentAsync(string databaseName, string sessionId)
        {
            var connString = BuildTenantConnectionString(databaseName);
            await using var conn = new NpgsqlConnection(connString);
            await conn.OpenAsync();

            // Check if subscription already has WelcomeEmailSent flag via StripeSessionId
            var count = await conn.QuerySingleAsync<int>(
                @"SELECT COUNT(1) FROM mechanic_db.""Subscriptions""
                  WHERE ""StripeSessionId"" = @SessionId
                    AND ""Status"" = 'active'
                    AND ""UpdatedAt"" IS NOT NULL",
                new { SessionId = sessionId });

            // If subscription exists and is active, check a flag in the payload
            if (count > 0)
            {
                var payload = await conn.QueryFirstOrDefaultAsync<string>(
                    @"SELECT ""StripePayload""::TEXT FROM mechanic_db.""Subscriptions""
                      WHERE ""StripeSessionId"" = @SessionId
                      ORDER BY ""Id"" DESC LIMIT 1",
                    new { SessionId = sessionId });

                if (!string.IsNullOrEmpty(payload) && payload.Contains("\"welcome_email_sent\":true"))
                    return true;
            }

            return false;
        }

        public async Task MarkWelcomeEmailSentAsync(string databaseName, string sessionId)
        {
            var connString = BuildTenantConnectionString(databaseName);
            await using var conn = new NpgsqlConnection(connString);
            await conn.OpenAsync();

            // Store the email-sent flag by updating the subscription payload
            await conn.ExecuteAsync(
                @"UPDATE mechanic_db.""Subscriptions""
                  SET ""StripePayload"" = COALESCE(""StripePayload"", '{}'::JSONB) || '{""welcome_email_sent"":true}'::JSONB,
                      ""UpdatedAt"" = CURRENT_TIMESTAMP
                  WHERE ""StripeSessionId"" = @SessionId",
                new { SessionId = sessionId });

            _logger.LogInformation("Marked welcome email sent for session {SessionId} in {DbName}", sessionId, databaseName);
        }

    }
}
