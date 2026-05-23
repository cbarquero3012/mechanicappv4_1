using System.Text.Json;
using MechanicApp.Server.Constants;
using MechanicApp.Server.Models;
using MechanicApp.Server.Options;
using MechanicApp.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;

namespace MechanicApp.Server.Controllers
{
    /// <summary>
    /// Manages subscription status, Stripe webhook processing, and admin overrides.
    /// Now integrates with tenant provisioning for SaaS multi-tenancy.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class SubscriptionController(IDbService db, IOptions<StripeSettings> stripe, IOptions<SmtpSettings> smtpSettings, ITenantProvisioningService tenantProvisioning, ITenantContext tenantContext, IEmailService emailService) : ControllerBase
    {
        private readonly StripeSettings _stripe = stripe.Value;
        private readonly SmtpSettings _smtp = smtpSettings.Value;

        // ────────────────────────────────────────────────────────
        // Public: Check current subscription status (used by frontend guard)
        // ────────────────────────────────────────────────────────
        [AllowAnonymous]
        [EnableRateLimiting("public")]
        [HttpGet("status")]
        public async Task<IActionResult> GetStatus()
        {
            var tenant = tenantContext.CurrentTenant;

            // 1. Demo tenants — always active until expired
            if (tenant is { IsDemo: true })
            {
                var isExpired = tenant.DemoExpiresAt.HasValue && tenant.DemoExpiresAt < DateTime.UtcNow;
                if (!isExpired)
                {
                    return Ok(new
                    {
                        active = true,
                        status = "demo",
                        planName = "free-trial",
                        expiresAt = tenant.DemoExpiresAt,
                        email = tenant.Email,
                        isDemo = true,
                        daysRemaining = tenant.DemoExpiresAt.HasValue
                            ? (int)Math.Ceiling((tenant.DemoExpiresAt.Value - DateTime.UtcNow).TotalDays)
                            : 7
                    });
                }
            }

            // 2. Non-demo tenant with SubscriptionExpiresAt in control plane — source of truth
            if (tenant != null && !tenant.IsDemo && tenant.SubscriptionExpiresAt.HasValue)
            {
                var isActive = tenant.SubscriptionExpiresAt > DateTime.UtcNow;
                var daysRemaining = (int)Math.Ceiling((tenant.SubscriptionExpiresAt.Value - DateTime.UtcNow).TotalDays);

                return Ok(new
                {
                    active = isActive,
                    status = isActive ? SubscriptionStatus.Active : SubscriptionStatus.Expired,
                    planName = tenant.PlanName,
                    expiresAt = tenant.SubscriptionExpiresAt,
                    email = tenant.Email,
                    isDemo = false,
                    daysRemaining
                });
            }

            // 3. Fallback: check Subscriptions table in tenant DB (legacy single-tenant)
            var sub = await db.GetAsync<Subscription>(
                @"SELECT * FROM mechanic_db.""Subscriptions""
                  ORDER BY ""Id"" DESC LIMIT 1", new { });

            if (sub == null)
                return Ok(new { active = false, status = "none", message = "No subscription found" });

            var subIsActive = sub.Status == SubscriptionStatus.Active &&
                           (sub.ExpiresAt == null || sub.ExpiresAt > DateTime.UtcNow);

            int? subDaysRemaining = sub.ExpiresAt.HasValue
                ? (int)Math.Ceiling((sub.ExpiresAt.Value - DateTime.UtcNow).TotalDays)
                : null;

            // Always synthesise a user-facing status: never expose raw DB values like "inactive"
            // which can confuse the UI into showing a false "Inactive" badge.
            var displayStatus = subIsActive ? SubscriptionStatus.Active : SubscriptionStatus.Expired;

            return Ok(new
            {
                active = subIsActive,
                status = displayStatus,
                planName = sub.PlanName,
                expiresAt = sub.ExpiresAt,
                email = sub.Email,
                isDemo = false,
                daysRemaining = subDaysRemaining
            });
        }

        // ────────────────────────────────────────────────────────
        // Public: Return Stripe checkout/config info for the frontend
        // ────────────────────────────────────────────────────────
        [AllowAnonymous]
        [EnableRateLimiting("public")]
        [HttpGet("config")]
        public IActionResult GetConfig()
        {
            return Ok(new
            {
                checkoutUrl = _stripe.PaymentLinkUrl
            });
        }

        // ────────────────────────────────────────────────────────
        // Public: Get available plans and pricing
        // ────────────────────────────────────────────────────────
        [AllowAnonymous]
        [EnableRateLimiting("public")]
        [HttpGet("plans")]
        public IActionResult GetPlans()
        {
            return Ok(SubscriptionPlans.GetAllPlans());
        }

        // ────────────────────────────────────────────────────────
        // Admin: Get full subscription details
        // ────────────────────────────────────────────────────────
        [Authorize(Roles = "super-admin,admin")]
        [EnableRateLimiting("authenticated")]
        [HttpGet("details")]
        public async Task<IActionResult> GetDetails()
        {
            var subs = await db.GetAll<Subscription>(
                @"SELECT * FROM mechanic_db.""Subscriptions""
                  ORDER BY ""UpdatedAt"" DESC", new { });
            return Ok(subs);
        }

        // ────────────────────────────────────────────────────────
        // Admin: Manually activate subscription (for testing / override)
        // ────────────────────────────────────────────────────────
        [Authorize(Roles = "super-admin")]
        [EnableRateLimiting("authenticated")]
        [HttpPost("activate")]
        public async Task<IActionResult> ManualActivate([FromBody] ManualActivateRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.PlanName) || req.ExpiresAt == null)
                return BadRequest(new { message = "Some required fields are not filled. Please check them." });
            var existing = await db.GetAsync<Subscription>(
                @"SELECT * FROM mechanic_db.""Subscriptions""
                  ORDER BY ""Id"" DESC LIMIT 1", new { });

            if (existing != null)
            {
                await db.EditData(
                    @"UPDATE mechanic_db.""Subscriptions"" SET
                      ""Status""='active',
                      ""PlanName""=@PlanName,
                      ""ExpiresAt""=@ExpiresAt,
                      ""UpdatedAt""=CURRENT_TIMESTAMP
                      WHERE ""Id""=@Id",
                    new { PlanName = req.PlanName ?? "Manual", ExpiresAt = req.ExpiresAt, Id = existing.Id });
            }
            else
            {
                await db.EditData(
                    @"INSERT INTO mechanic_db.""Subscriptions""
                      (""Email"", ""Status"", ""PlanName"", ""ExpiresAt"", ""StartDate"")
                      VALUES (@Email, 'active', @PlanName, @ExpiresAt, CURRENT_TIMESTAMP)",
                    new { Email = req.Email ?? "admin@mechanicapp.local", PlanName = req.PlanName ?? "Manual", ExpiresAt = req.ExpiresAt });
            }

            // Sync the control plane tenant record
            var tenant = tenantContext.CurrentTenant;
            if (tenant != null && tenant.Id > 0)
            {
                if (tenant.IsDemo && req.PlanName != "free-trial")
                {
                    // Demo → paid: convert fully (clears IsDemo, DemoExpiresAt)
                    await tenantProvisioning.ConvertDemoToPaidAsync(tenant.Id, req.PlanName!, null);
                }
                else if (!tenant.IsDemo)
                {
                    // Non-demo: update plan and expiry in control plane
                    await tenantProvisioning.UpdateTenantSubscriptionAsync(
                        tenant.Id, req.PlanName!, req.ExpiresAt!.Value);
                }
                else
                {
                    // Demo with free-trial plan: at minimum sync SubscriptionExpiresAt so
                    // GetStatus() uses path 2 (control-plane) instead of the legacy fallback.
                    await tenantProvisioning.UpdateTenantSubscriptionAsync(
                        tenant.Id, req.PlanName!, req.ExpiresAt!.Value);
                }
            }

            return Ok(new { message = "Subscription activated" });
        }

        // ────────────────────────────────────────────────────────
        // Stripe Webhook — receives payment notifications
        // Docs: https://docs.stripe.com/webhooks
        // ────────────────────────────────────────────────────────
        [AllowAnonymous]
        [EnableRateLimiting("webhook")]
        [HttpPost("webhook/stripe")]
        public async Task<IActionResult> StripeWebhook()
        {
            // Read raw body
            using var reader = new StreamReader(Request.Body);
            var body = await reader.ReadToEndAsync();

            // Verify Stripe signature header (if webhook secret is configured)
            var signature = Request.Headers["Stripe-Signature"].FirstOrDefault();
            if (!string.IsNullOrEmpty(_stripe.WebhookSecret) && string.IsNullOrEmpty(signature))
                return Unauthorized(new { message = "Missing Stripe-Signature header" });

            // Parse the webhook payload
            JsonDocument? doc;
            try
            {
                doc = JsonDocument.Parse(body);
            }
            catch
            {
                return BadRequest(new { message = "Invalid JSON body" });
            }

            var root = doc.RootElement;

            // Extract Stripe event type and data
            var eventType = root.TryGetProperty("type", out var t) ? t.GetString() : null;
            var customerEmail = "";
            var sessionId = "";
            var subscriptionId = "";

            if (root.TryGetProperty("data", out var data) &&
                data.TryGetProperty("object", out var obj))
            {
                if (obj.TryGetProperty("customer_email", out var email))
                    customerEmail = email.GetString() ?? "";
                else if (obj.TryGetProperty("customer_details", out var details) &&
                         details.TryGetProperty("email", out var detailEmail))
                    customerEmail = detailEmail.GetString() ?? "";

                if (obj.TryGetProperty("id", out var id))
                    sessionId = id.GetString() ?? "";

                if (obj.TryGetProperty("subscription", out var sub))
                    subscriptionId = sub.GetString() ?? "";
            }

            // Map Stripe event types to subscription statuses
            var status = eventType switch
            {
                "checkout.session.completed" => SubscriptionStatus.Active,
                "invoice.paid" => SubscriptionStatus.Active,
                "customer.subscription.created" => SubscriptionStatus.Active,
                "customer.subscription.updated" => SubscriptionStatus.Active,
                "customer.subscription.deleted" => SubscriptionStatus.Cancelled,
                "invoice.payment_failed" => SubscriptionStatus.Inactive,
                "charge.refunded" => SubscriptionStatus.Refunded,
                "charge.dispute.created" => SubscriptionStatus.Refunded,
                _ => (string?)null
            };

            if (status == null)
                return Ok(new { message = $"Event '{eventType}' acknowledged but no action taken" });

            // ── Resolve tenant by email from the control plane ──
            // The webhook is called by Stripe (no tenant context), so we look up by email.
            var tenant = !string.IsNullOrEmpty(customerEmail)
                ? await tenantProvisioning.GetTenantByEmailAsync(customerEmail)
                : null;

            if (tenant != null)
            {
                // 1. Update subscription in the TENANT's database (not default mechanic_db)
                await tenantProvisioning.UpsertSubscriptionFromWebhookAsync(
                    tenant.DatabaseName, customerEmail, status,
                    sessionId, subscriptionId, body);

                // 2. Update the control plane tenant record
                if (status == SubscriptionStatus.Active)
                {
                    var newExpiry = DateTime.UtcNow.AddDays(30);
                    await tenantProvisioning.UpdateTenantSubscriptionAsync(
                        tenant.Id, tenant.PlanName, newExpiry);

                    // If this was a demo being upgraded, also store the Stripe subscription ID
                    if (!string.IsNullOrEmpty(subscriptionId) && tenant.StripeSubscriptionId != subscriptionId)
                    {
                        await tenantProvisioning.ConvertDemoToPaidAsync(
                            tenant.Id, tenant.PlanName, subscriptionId);
                    }
                }

                // 3. Send welcome email on first successful payment (checkout.session.completed)
                if (eventType == "checkout.session.completed" && !string.IsNullOrEmpty(customerEmail))
                {
                    // Idempotency: only send if this is the first time we process this session
                    var alreadyProcessed = !string.IsNullOrEmpty(sessionId) &&
                        await tenantProvisioning.HasWelcomeEmailBeenSentAsync(tenant.DatabaseName, sessionId);

                    if (!alreadyProcessed)
                    {
                        var adminUsername = await tenantProvisioning.GetAdminUsernameAsync(tenant.DatabaseName);

                        // Use configured FrontendBaseUrl for production-correct login links
                        var baseUrl = !string.IsNullOrEmpty(_smtp.FrontendBaseUrl)
                            ? _smtp.FrontendBaseUrl.TrimEnd('/')
                            : $"{Request.Scheme}://{Request.Host}";
                        var loginUrl = $"{baseUrl}/{tenant.Slug}/login";

                        var emailSent = await emailService.SendWelcomeEmailAsync(
                            customerEmail, adminUsername, loginUrl, tenant.PlanName);

                        if (emailSent && !string.IsNullOrEmpty(sessionId))
                        {
                            await tenantProvisioning.MarkWelcomeEmailSentAsync(tenant.DatabaseName, sessionId);
                        }
                    }
                }
            }
            else
            {
                // Fallback: no tenant found — update default mechanic_db (legacy single-tenant)
                var existing = await db.GetAsync<Subscription>(
                    @"SELECT * FROM mechanic_db.""Subscriptions""
                      WHERE ""StripeSessionId"" = @SessionId
                         OR ""StripeSubscriptionId"" = @SubscriptionId
                         OR ""Email"" = @Email
                      ORDER BY ""Id"" DESC LIMIT 1",
                    new { SessionId = sessionId, SubscriptionId = subscriptionId, Email = customerEmail });

                if (existing != null)
                {
                    await db.EditData(
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
                            Payload = body,
                            Id = existing.Id
                        });
                }
                else
                {
                    await db.EditData(
                        @"INSERT INTO mechanic_db.""Subscriptions""
                          (""Email"", ""StripeSessionId"", ""StripeSubscriptionId"", ""Status"",
                           ""PlanName"", ""StartDate"", ""ExpiresAt"", ""StripePayload"")
                          VALUES (@Email, @SessionId, @SubscriptionId, @Status,
                                  'Stripe', CURRENT_TIMESTAMP,
                                  CASE WHEN @Status='active' THEN CURRENT_TIMESTAMP + INTERVAL '30 days' ELSE NULL END,
                                  @Payload::JSONB)",
                        new
                        {
                            Email = customerEmail,
                            SessionId = string.IsNullOrEmpty(sessionId) ? null : sessionId,
                            SubscriptionId = string.IsNullOrEmpty(subscriptionId) ? null : subscriptionId,
                            Status = status,
                            Payload = body
                        });
                }
            }

            return Ok(new { message = $"Webhook processed: {eventType} -> {status}" });
        }

        // ────────────────────────────────────────────────────────
        // POST: Self-service onboarding — new client pays → provision tenant
        // ────────────────────────────────────────────────────────
        [AllowAnonymous]
        [EnableRateLimiting("public")]
        [HttpPost("onboard")]
        public async Task<IActionResult> Onboard([FromBody] TenantOnboardRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.CompanyName))
                return BadRequest(new { message = "Email and CompanyName are required." });

            var username = string.IsNullOrWhiteSpace(req.Username)
                ? "administrador"
                : req.Username.Trim().ToLowerInvariant();

            // Check if already has a tenant
            var existing = await tenantProvisioning.GetTenantByEmailAsync(req.Email);
            if (existing != null && !existing.IsDemo)
                return Conflict(new { message = "An account already exists for this email." });

            // If has a demo, convert it
            if (existing != null && existing.IsDemo)
            {
                var upgradePlan = req.PlanName ?? "standard";
                var converted = await tenantProvisioning.ConvertDemoToPaidAsync(existing.Id, upgradePlan, null, req.Country);

                // Create active subscription with 30-day grace period
                await tenantProvisioning.CreateActiveSubscriptionAsync(
                    converted.DatabaseName, req.Email, upgradePlan);

                // Set admin credentials if provided
                if (!string.IsNullOrWhiteSpace(req.AdminPassword))
                {
                    await tenantProvisioning.SetAdminCredentialsAsync(
                        converted.DatabaseName, req.Email, req.AdminPassword, req.Country);
                }

                // Update username if custom
                if (username != "administrador")
                {
                    await tenantProvisioning.SetAdminUsernameAsync(converted.DatabaseName, username);
                }

                var upgradePaymentUrl = BuildPaymentUrl(req.Email, upgradePlan);
                return Ok(new
                {
                    message = "Your demo has been upgraded to a paid plan. All data preserved!",
                    tenant = new
                    {
                        converted.Slug,
                        converted.PlanName,
                        converted.SubscriptionExpiresAt,
                        loginUrl = $"/{converted.Slug}/login"
                    },
                    credentials = new { username, password = "(the password you entered)" },
                    paymentUrl = upgradePaymentUrl
                });
            }

            // Provision new tenant
            var planName = req.PlanName ?? "standard";
            var tenant = await tenantProvisioning.ProvisionTenantAsync(
                req.CompanyName, req.Email, planName, country: req.Country);

            // Set the admin credentials with the user-provided password
            if (!string.IsNullOrWhiteSpace(req.AdminPassword))
            {
                await tenantProvisioning.SetAdminCredentialsAsync(
                    tenant.DatabaseName, req.Email, req.AdminPassword, req.Country);
            }

            // Update username if custom
            if (username != "administrador")
            {
                await tenantProvisioning.SetAdminUsernameAsync(tenant.DatabaseName, username);
            }

            // Create active subscription with 30-day grace period
            await tenantProvisioning.CreateActiveSubscriptionAsync(
                tenant.DatabaseName, req.Email, planName);

            // Build Stripe payment URL with email prefilled
            var paymentUrl = BuildPaymentUrl(req.Email, planName);

            return Ok(new
            {
                message = "Account created successfully!",
                tenant = new
                {
                    tenant.Slug,
                    tenant.PlanName,
                    tenant.SubscriptionExpiresAt,
                    loginUrl = $"/{tenant.Slug}/login"
                },
                credentials = new { username, password = "(the password you entered)" },
                paymentUrl
            });
        }

        // ────────────────────────────────────────────────────────
        // Helper: Build Stripe payment link URL with prefilled data
        // ────────────────────────────────────────────────────────
        private string BuildPaymentUrl(string email, string planName)
        {
            if (string.IsNullOrEmpty(_stripe.PaymentLinkUrl))
                return string.Empty;

            var separator = _stripe.PaymentLinkUrl.Contains('?') ? "&" : "?";
            return $"{_stripe.PaymentLinkUrl}{separator}prefilled_email={Uri.EscapeDataString(email)}";
        }
    }
}
