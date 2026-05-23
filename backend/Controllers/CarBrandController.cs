using MechanicApp.Server.Models;
using MechanicApp.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace MechanicApp.Server.Controllers
{
    /// <summary>
    /// CRUD operations for car brand records.
    /// </summary>
    [Authorize]
    [EnableRateLimiting("authenticated")]
    /// <summary>
    /// CRUD operations for car brand records.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class CarBrandController(IDbService db) : ControllerBase
    {


        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var result = await db.GetAll<CarBrand>(
                @"SELECT * FROM mechanic_db.""CarBrands"" ORDER BY ""BrandName""", new { });
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var result = await db.GetAsync<CarBrand>(
                @"SELECT * FROM mechanic_db.""CarBrands"" WHERE ""Id"" = @Id", new { Id = id });
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] CarBrand brand)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { message = "Some required fields are not filled. Please check them." });
            var result = await db.EditData(
                @"INSERT INTO mechanic_db.""CarBrands"" (""BrandName"", ""Country"")
                  VALUES (@BrandName, @Country)", brand);
            return Ok(result);
        }

        [HttpPut]
        public async Task<IActionResult> Put([FromBody] CarBrand brand)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { message = "Some required fields are not filled. Please check them." });
            var result = await db.EditData(
                @"UPDATE mechanic_db.""CarBrands"" SET ""BrandName""=@BrandName, ""Country""=@Country
                  WHERE ""Id""=@Id", brand);
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await db.EditData(
                @"DELETE FROM mechanic_db.""CarBrands"" WHERE ""Id""=@Id", new { Id = id });
            return Ok(result);
        }
    }
}
