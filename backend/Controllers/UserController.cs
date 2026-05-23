using MechanicApp.Server.Constants;
using MechanicApp.Server.Models;
using MechanicApp.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Claims;

namespace MechanicApp.Server.Controllers
{
    /// <summary>
    /// Admin-only CRUD operations for user account management.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    /// <summary>
    /// Admin-only CRUD operations for user account management.
    /// </summary>
    [Authorize]
    [EnableRateLimiting("authenticated")]
    public class UserController(IDbService db) : ControllerBase
    {


        private string CurrentRole =>
            User.FindFirst(ClaimTypes.Role)?.Value ?? "";

        private bool IsSuperAdmin => CurrentRole == AppRoles.SuperAdmin;

        private bool IsAdmin => CurrentRole == AppRoles.Admin || IsSuperAdmin;

        private bool IsSupervisor => CurrentRole == AppRoles.Supervisor;

        private IActionResult Forbidden() =>
            StatusCode(403, new { message = "Admin access required." });

        // ── GET all users (admin only) ──────────────────────
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            if (!IsAdmin) return Forbidden();

            // Non-super-admin users cannot see super-admin accounts
            var sql = IsSuperAdmin
                ? @"SELECT ""Id"", ""Username"", ""FullName"", ""Email"", ""Role"", ""Active"", ""MechanicId"", ""Country"", ""CreatedAt""
                    FROM mechanic_db.""Users""
                    ORDER BY ""Id"""
                : @"SELECT ""Id"", ""Username"", ""FullName"", ""Email"", ""Role"", ""Active"", ""MechanicId"", ""Country"", ""CreatedAt""
                    FROM mechanic_db.""Users""
                    WHERE ""Role"" != @ExcludedRole
                    ORDER BY ""Id""";

            var users = await db.GetAll<UserDto>(sql, new { ExcludedRole = AppRoles.SuperAdmin });
            return Ok(users);
        }

        // ── GET single user (admin only) ────────────────────
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            if (!IsAdmin) return Forbidden();

            var user = await db.GetAsync<UserDto>(
                @"SELECT ""Id"", ""Username"", ""FullName"", ""Email"", ""Role"", ""Active"", ""MechanicId"", ""Country"", ""CreatedAt""
                  FROM mechanic_db.""Users""
                  WHERE ""Id"" = @Id", new { Id = id });

            if (user == null) return NotFound();
            return Ok(user);
        }

        // ── POST create user (admin or supervisor) ─────────
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateUserRequest req)
        {
            if (!IsAdmin && !IsSupervisor) return Forbidden();

            if (string.IsNullOrWhiteSpace(req.Username) || string.IsNullOrWhiteSpace(req.Password))
                return BadRequest(new { message = "Username and password are required." });

            if (!AppRoles.IsValid(req.Role))
                return BadRequest(new { message = "Role must be super-admin, admin, supervisor or mechanic." });

            // Check unique username
            var existing = await db.GetAsync<UserDto>(
                @"SELECT ""Id"" FROM mechanic_db.""Users"" WHERE ""Username"" = @Username",
                new { req.Username });
            if (existing != null)
                return Conflict(new { message = $"Username '{req.Username}' already exists." });

            var passwordHash = BCrypt.Net.BCrypt.HashPassword(req.Password);

            await db.EditData(
                @"INSERT INTO mechanic_db.""Users""
                  (""Username"", ""PasswordHash"", ""FullName"", ""Email"", ""Role"", ""Active"", ""MechanicId"", ""Country"")
                  VALUES (@Username, @PasswordHash, @FullName, @Email, @Role, @Active, @MechanicId, @Country)",
                new
                {
                    req.Username,
                    PasswordHash = passwordHash,
                    FullName = req.FullName ?? "",
                    Email = req.Email ?? "",
                    Role = req.Role!.ToLower(),
                    Active = req.Active ?? true,
                    MechanicId = (req.MechanicId == null || req.MechanicId == 0) ? null : (int?)req.MechanicId,
                    Country = string.IsNullOrWhiteSpace(req.Country) ? null : req.Country,
                });

            return Ok(new { message = "User created successfully." });
        }

        // ── PUT update user (admin only) ────────────────────
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateUserRequest req)
        {
            if (!IsAdmin) return Forbidden();

            if (!string.IsNullOrEmpty(req.Role) && !AppRoles.IsValid(req.Role))
                return BadRequest(new { message = "Role must be super-admin, admin, supervisor or mechanic." });

            // Check username uniqueness if changed
            if (!string.IsNullOrEmpty(req.Username))
            {
                var dup = await db.GetAsync<UserDto>(
                    @"SELECT ""Id"" FROM mechanic_db.""Users""
                      WHERE ""Username"" = @Username AND ""Id"" != @Id",
                    new { req.Username, Id = id });
                if (dup != null)
                    return Conflict(new { message = $"Username '{req.Username}' already exists." });
            }

            // Build dynamic update
            var sets = new List<string>();
            var param = new Dictionary<string, object?> { ["Id"] = id };

            if (!string.IsNullOrEmpty(req.Username)) { sets.Add(@"""Username""=@Username"); param["Username"] = req.Username; }
            if (req.FullName != null) { sets.Add(@"""FullName""=@FullName"); param["FullName"] = req.FullName; }
            if (req.Email != null) { sets.Add(@"""Email""=@Email"); param["Email"] = req.Email; }
            if (!string.IsNullOrEmpty(req.Role)) { sets.Add(@"""Role""=@Role"); param["Role"] = req.Role.ToLower(); }
            if (req.Active != null) { sets.Add(@"""Active""=@Active"); param["Active"] = req.Active; }
            if (req.MechanicId != null) { sets.Add(@"""MechanicId""=@MechanicId"); param["MechanicId"] = req.MechanicId == 0 ? null : (object?)req.MechanicId; }
            if (req.Country != null) { sets.Add(@"""Country""=@Country"); param["Country"] = string.IsNullOrWhiteSpace(req.Country) ? null : (object?)req.Country; }

            if (!string.IsNullOrEmpty(req.Password))
            {
                sets.Add(@"""PasswordHash""=@PasswordHash");
                param["PasswordHash"] = BCrypt.Net.BCrypt.HashPassword(req.Password);
            }

            if (sets.Count == 0)
                return BadRequest(new { message = "No fields to update." });

            var sql = $@"UPDATE mechanic_db.""Users"" SET {string.Join(", ", sets)} WHERE ""Id""=@Id";

            // Dapper needs an object — use DynamicParameters
            var dp = new Dapper.DynamicParameters(param);
            await db.EditData(sql, dp);

            return Ok(new { message = "User updated successfully." });
        }

        // ── DELETE user (admin only) ────────────────────────
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            if (!IsAdmin) return Forbidden();

            // Prevent deleting yourself
            var currentId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (currentId == id.ToString())
                return BadRequest(new { message = "You cannot delete your own account." });

            await db.EditData(
                @"DELETE FROM mechanic_db.""Users"" WHERE ""Id"" = @Id",
                new { Id = id });

            return Ok(new { message = "User deleted." });
        }
    }
}
