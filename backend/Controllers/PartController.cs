using MechanicApp.Server.Models;
using MechanicApp.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace MechanicApp.Server.Controllers
{
    /// <summary>
    /// CRUD operations for inventory part records.
    /// </summary>
    [Authorize]
    [EnableRateLimiting("authenticated")]
    /// <summary>
    /// CRUD operations for inventory part records.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class PartController(IDbService db) : ControllerBase
    {


        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var result = await db.GetAll<Part>(
                @"SELECT p.*, c.""Symbol"" AS ""CurrencySymbol""
                  FROM mechanic_db.""Parts"" p
                  LEFT JOIN mechanic_db.""Currencies"" c ON p.""CurrencyId"" = c.""Id""
                  ORDER BY p.""Name""", new { });
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var result = await db.GetAsync<Part>(
                @"SELECT p.*, c.""Symbol"" AS ""CurrencySymbol""
                  FROM mechanic_db.""Parts"" p
                  LEFT JOIN mechanic_db.""Currencies"" c ON p.""CurrencyId"" = c.""Id""
                  WHERE p.""Id"" = @Id", new { Id = id });
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] Part part)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { message = "Some required fields are not filled. Please check them." });
            var result = await db.EditData(
                @"INSERT INTO mechanic_db.""Parts"" (""Name"", ""PartNumber"", ""Category"", ""Quantity"", ""MinStock"", ""UnitCost"", ""SellPrice"", ""Supplier"", ""Location"", ""CurrencyId"")
                  VALUES (@Name, @PartNumber, @Category, @Quantity, @MinStock, @UnitCost, @SellPrice, @Supplier, @Location, @CurrencyId)", part);
            return Ok(result);
        }

        [HttpPut]
        public async Task<IActionResult> Put([FromBody] Part part)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { message = "Some required fields are not filled. Please check them." });
            var result = await db.EditData(
                @"UPDATE mechanic_db.""Parts"" SET ""Name""=@Name, ""PartNumber""=@PartNumber, ""Category""=@Category, ""Quantity""=@Quantity,
                  ""MinStock""=@MinStock, ""UnitCost""=@UnitCost, ""SellPrice""=@SellPrice, ""Supplier""=@Supplier, ""Location""=@Location,
                  ""CurrencyId""=@CurrencyId, ""UpdatedAt""=CURRENT_TIMESTAMP WHERE ""Id""=@Id", part);
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await db.EditData(
                @"DELETE FROM mechanic_db.""Parts"" WHERE ""Id""=@Id", new { Id = id });
            return Ok(result);
        }
    }
}
