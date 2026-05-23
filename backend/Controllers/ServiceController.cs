using MechanicApp.Server.Models;
using MechanicApp.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace MechanicApp.Server.Controllers
{
    /// <summary>
    /// CRUD operations for service catalog records.
    /// </summary>
    [Authorize]
    [EnableRateLimiting("authenticated")]
    /// <summary>
    /// CRUD operations for service catalog records.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class ServiceController(IDbService db) : ControllerBase
    {


        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var result = await db.GetAll<Service>(
                @"SELECT s.*, c.""Symbol"" AS ""CurrencySymbol""
                  FROM mechanic_db.""Services"" s
                  LEFT JOIN mechanic_db.""Currencies"" c ON s.""CurrencyId"" = c.""Id""
                  ORDER BY s.""Name""", new { });
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var result = await db.GetAsync<Service>(
                @"SELECT s.*, c.""Symbol"" AS ""CurrencySymbol""
                  FROM mechanic_db.""Services"" s
                  LEFT JOIN mechanic_db.""Currencies"" c ON s.""CurrencyId"" = c.""Id""
                  WHERE s.""Id"" = @Id", new { Id = id });
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] Service service)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { message = "Some required fields are not filled. Please check them." });
            var result = await db.EditData(
                @"INSERT INTO mechanic_db.""Services"" (""Name"", ""Category"", ""Description"", ""BasePrice"", ""EstimatedHours"", ""IsActive"", ""CurrencyId"")
                  VALUES (@Name, @Category, @Description, @BasePrice, @EstimatedHours, @IsActive, @CurrencyId)", service);
            return Ok(result);
        }

        [HttpPut]
        public async Task<IActionResult> Put([FromBody] Service service)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { message = "Some required fields are not filled. Please check them." });
            var result = await db.EditData(
                @"UPDATE mechanic_db.""Services"" SET ""Name""=@Name, ""Category""=@Category, ""Description""=@Description,
                  ""BasePrice""=@BasePrice, ""EstimatedHours""=@EstimatedHours, ""IsActive""=@IsActive,
                  ""CurrencyId""=@CurrencyId, ""UpdatedAt""=CURRENT_TIMESTAMP WHERE ""Id""=@Id", service);
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await db.EditData(
                @"DELETE FROM mechanic_db.""Services"" WHERE ""Id""=@Id", new { Id = id });
            return Ok(result);
        }
    }
}
