using MechanicApp.Server.Models;
using MechanicApp.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace MechanicApp.Server.Controllers
{
    /// <summary>
    /// Control-plane API for managing tenants (SaaS admin operations).
    /// Only accessible by super-admin role.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "super-admin")]
    [EnableRateLimiting("authenticated")]
    public class TenantController(ITenantProvisioningService provisioning) : ControllerBase
    {
        // ────────────────────────────────────────────────────────
        // GET: List all tenants
        // ────────────────────────────────────────────────────────
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var tenants = await provisioning.GetAllTenantsAsync();
            return Ok(tenants);
        }

        // ────────────────────────────────────────────────────────
        // GET: Get tenant by slug
        // ────────────────────────────────────────────────────────
        [HttpGet("{slug}")]
        public async Task<IActionResult> GetBySlug(string slug)
        {
            var tenant = await provisioning.GetTenantBySlugAsync(slug);
            if (tenant == null)
                return NotFound(new { message = "Tenant not found" });
            return Ok(tenant);
        }

        // ────────────────────────────────────────────────────────
        // POST: Provision a new tenant manually
        // ────────────────────────────────────────────────────────
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateTenantRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Name) || string.IsNullOrWhiteSpace(req.Email))
                return BadRequest(new { message = "Name and Email are required." });

            var existing = await provisioning.GetTenantByEmailAsync(req.Email);
            if (existing != null)
                return Conflict(new { message = "A tenant with this email already exists." });

            var tenant = await provisioning.ProvisionTenantAsync(
                req.Name, req.Email, req.PlanName ?? "standard", country: req.Country);

            return CreatedAtAction(nameof(GetBySlug), new { slug = tenant.Slug }, tenant);
        }

        // ────────────────────────────────────────────────────────
        // POST: Convert demo to paid
        // ────────────────────────────────────────────────────────
        [HttpPost("{id:int}/convert")]
        public async Task<IActionResult> ConvertToPaid(int id, [FromBody] ConvertTenantRequest req)
        {
            try
            {
                var tenant = await provisioning.ConvertDemoToPaidAsync(id, req.PlanName ?? "standard", req.StripeSubscriptionId);
                return Ok(tenant);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // ────────────────────────────────────────────────────────
        // POST: Cleanup expired demo tenants
        // ────────────────────────────────────────────────────────
        [HttpPost("cleanup-demos")]
        public async Task<IActionResult> CleanupDemos()
        {
            var count = await provisioning.CleanupExpiredDemosAsync();
            return Ok(new { message = $"Cleaned up {count} expired demo(s)" });
        }
    }

    public class ConvertTenantRequest
    {
        public string? PlanName { get; set; }
        public string? StripeSubscriptionId { get; set; }
    }
}
