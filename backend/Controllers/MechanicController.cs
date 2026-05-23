using Dapper;
using MechanicApp.Server.Models;
using MechanicApp.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace MechanicApp.Server.Controllers
{
    /// <summary>
    /// CRUD operations for mechanic records with user account linking.
    /// </summary>
    [Authorize]
    [EnableRateLimiting("authenticated")]
    /// <summary>
    /// CRUD operations for mechanic records with user account linking.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class MechanicController(IDbService db) : ControllerBase
    {


        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var result = await db.GetAll<Mechanic>(
                @"SELECT m.*,
                    u.""Id"" AS ""LinkedUserId"",
                    u.""Username"" AS ""LinkedUsername""
                  FROM mechanic_db.""Mechanics"" m
                  LEFT JOIN mechanic_db.""Users"" u ON u.""MechanicId"" = m.""Id"" AND u.""Role"" = 'mechanic'
                  ORDER BY m.""LastName"", m.""FirstName""", new { });
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var result = await db.GetAsync<Mechanic>(
                @"SELECT m.*,
                    u.""Id"" AS ""LinkedUserId"",
                    u.""Username"" AS ""LinkedUsername""
                  FROM mechanic_db.""Mechanics"" m
                  LEFT JOIN mechanic_db.""Users"" u ON u.""MechanicId"" = m.""Id"" AND u.""Role"" = 'mechanic'
                  WHERE m.""Id"" = @Id", new { Id = id });
            if (result == null) return NotFound();
            return Ok(result);
        }

        /// <summary>Returns mechanic-role users available for linking (not already linked to another mechanic).</summary>
        [HttpGet("available-users")]
        public async Task<IActionResult> GetAvailableUsers()
        {
            var users = await db.GetAll<MechanicUserOption>(
                @"SELECT ""Id"", ""Username"", ""FullName"", ""MechanicId""
                  FROM mechanic_db.""Users""
                  WHERE ""Role"" = 'mechanic' AND ""Active"" = TRUE
                  ORDER BY ""FullName"", ""Username""", new { });
            return Ok(users);
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] Mechanic? mechanic)
        {
            if (mechanic == null || !ModelState.IsValid)
                return BadRequest(new { message = "Some required fields are not filled. Please check them." });

            int newId = 0;
            await db.ExecuteInTransactionAsync(async (conn, tx) =>
            {
                newId = await conn.QueryFirstOrDefaultAsync<int>(
                    @"INSERT INTO mechanic_db.""Mechanics"" (""FirstName"", ""LastName"", ""Specialty"", ""HireDate"", ""IsActive"")
                      VALUES (@FirstName, @LastName, @Specialty, @HireDate, @IsActive)
                      RETURNING ""Id""", mechanic, tx);

                // Link user account if specified
                if (mechanic.LinkedUserId.HasValue && mechanic.LinkedUserId.Value > 0 && newId > 0)
                {
                    await conn.ExecuteAsync(
                        @"UPDATE mechanic_db.""Users"" SET ""MechanicId"" = NULL WHERE ""MechanicId"" = @MechanicId",
                        new { MechanicId = newId }, tx);
                    await conn.ExecuteAsync(
                        @"UPDATE mechanic_db.""Users"" SET ""MechanicId"" = @MechanicId WHERE ""Id"" = @UserId AND ""Role"" = 'mechanic'",
                        new { MechanicId = newId, UserId = mechanic.LinkedUserId.Value }, tx);
                }
            });

            return Ok(new { message = "Mechanic created", id = newId });
        }

        [HttpPut]
        public async Task<IActionResult> Put([FromBody] Mechanic mechanic)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { message = "Some required fields are not filled. Please check them." });

            await db.ExecuteInTransactionAsync(async (conn, tx) =>
            {
                await conn.ExecuteAsync(
                    @"UPDATE mechanic_db.""Mechanics"" SET ""FirstName""=@FirstName, ""LastName""=@LastName,
                      ""Specialty""=@Specialty, ""HireDate""=@HireDate, ""IsActive""=@IsActive
                      WHERE ""Id""=@Id", mechanic, tx);

                // Update user link: clear old link, set new one
                await conn.ExecuteAsync(
                    @"UPDATE mechanic_db.""Users"" SET ""MechanicId"" = NULL WHERE ""MechanicId"" = @Id",
                    new { mechanic.Id }, tx);

                if (mechanic.LinkedUserId.HasValue && mechanic.LinkedUserId.Value > 0)
                {
                    await conn.ExecuteAsync(
                        @"UPDATE mechanic_db.""Users"" SET ""MechanicId"" = @MechanicId WHERE ""Id"" = @UserId AND ""Role"" = 'mechanic'",
                        new { MechanicId = mechanic.Id, UserId = mechanic.LinkedUserId.Value }, tx);
                }
            });

            return Ok(new { message = "Mechanic updated" });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            await db.ExecuteInTransactionAsync(async (conn, tx) =>
            {
                // Clear user link before deleting
                await conn.ExecuteAsync(
                    @"UPDATE mechanic_db.""Users"" SET ""MechanicId"" = NULL WHERE ""MechanicId"" = @Id",
                    new { Id = id }, tx);
                await conn.ExecuteAsync(
                    @"DELETE FROM mechanic_db.""Mechanics"" WHERE ""Id""=@Id", new { Id = id }, tx);
            });

            return Ok(new { message = "Mechanic deleted" });
        }
    }
}
