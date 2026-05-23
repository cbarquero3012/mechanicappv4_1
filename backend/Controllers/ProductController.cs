using MechanicApp.Server.Models;
using MechanicApp.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace MechanicApp.Server.Controllers
{
    /// <summary>
    /// CRUD operations for product inventory records.
    /// </summary>
    [Authorize]
    [EnableRateLimiting("authenticated")]
    /// <summary>
    /// CRUD operations for product inventory records.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class ProductController(IDbService db) : ControllerBase
    {


        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var result = await db.GetAll<Product>(
                @"SELECT p.*, c.""Symbol"" AS ""CurrencySymbol""
                  FROM mechanic_db.""Products"" p
                  LEFT JOIN mechanic_db.""Currencies"" c ON p.""CurrencyId"" = c.""Id""
                  ORDER BY p.""Name""", new { });
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var result = await db.GetAsync<Product>(
                @"SELECT p.*, c.""Symbol"" AS ""CurrencySymbol""
                  FROM mechanic_db.""Products"" p
                  LEFT JOIN mechanic_db.""Currencies"" c ON p.""CurrencyId"" = c.""Id""
                  WHERE p.""Id"" = @Id", new { Id = id });
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] Product product)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { message = "Some required fields are not filled. Please check them." });
            var result = await db.EditData(
                @"INSERT INTO mechanic_db.""Products"" (""Name"", ""SKU"", ""Category"", ""Description"", ""Quantity"", ""MinStock"", ""UnitCost"", ""SellPrice"", ""Brand"", ""CurrencyId"")
                  VALUES (@Name, @SKU, @Category, @Description, @Quantity, @MinStock, @UnitCost, @SellPrice, @Brand, @CurrencyId)", product);
            return Ok(result);
        }

        [HttpPut]
        public async Task<IActionResult> Put([FromBody] Product product)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { message = "Some required fields are not filled. Please check them." });
            var result = await db.EditData(
                @"UPDATE mechanic_db.""Products"" SET ""Name""=@Name, ""SKU""=@SKU, ""Category""=@Category, ""Description""=@Description,
                  ""Quantity""=@Quantity, ""MinStock""=@MinStock, ""UnitCost""=@UnitCost, ""SellPrice""=@SellPrice, ""Brand""=@Brand,
                  ""CurrencyId""=@CurrencyId, ""UpdatedAt""=CURRENT_TIMESTAMP WHERE ""Id""=@Id", product);
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await db.EditData(
                @"DELETE FROM mechanic_db.""Products"" WHERE ""Id""=@Id", new { Id = id });
            return Ok(result);
        }
    }
}
