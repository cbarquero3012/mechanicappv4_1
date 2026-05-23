using MechanicApp.Server.Models;
using MechanicApp.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace MechanicApp.Server.Controllers
{
    /// <summary>
    /// CRUD operations for car model records associated with brands.
    /// </summary>
    [Authorize]
    [EnableRateLimiting("authenticated")]
    /// <summary>
    /// CRUD operations for car model records associated with brands.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class CarModelController(IDbService db) : ControllerBase
    {


        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var result = await db.GetAll<CarModel>(
                @"SELECT m.*, b.""BrandName""
                  FROM mechanic_db.""CarModels"" m
                  JOIN mechanic_db.""CarBrands"" b ON m.""BrandId"" = b.""Id""
                  ORDER BY b.""BrandName"", m.""ModelName""", new { });
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var result = await db.GetAsync<CarModel>(
                @"SELECT m.*, b.""BrandName""
                  FROM mechanic_db.""CarModels"" m
                  JOIN mechanic_db.""CarBrands"" b ON m.""BrandId"" = b.""Id""
                  WHERE m.""Id"" = @Id", new { Id = id });
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpGet("brand/{brandId}")]
        public async Task<IActionResult> GetByBrand(int brandId)
        {
            var result = await db.GetAll<CarModel>(
                @"SELECT m.*, b.""BrandName""
                  FROM mechanic_db.""CarModels"" m
                  JOIN mechanic_db.""CarBrands"" b ON m.""BrandId"" = b.""Id""
                  WHERE m.""BrandId"" = @BrandId
                  ORDER BY m.""ModelName""", new { BrandId = brandId });
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] CarModel model)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { message = "Some required fields are not filled. Please check them." });
            var result = await db.EditData(
                @"INSERT INTO mechanic_db.""CarModels"" (""BrandId"", ""ModelName"")
                  VALUES (@BrandId, @ModelName)", model);
            return Ok(result);
        }

        [HttpPut]
        public async Task<IActionResult> Put([FromBody] CarModel model)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { message = "Some required fields are not filled. Please check them." });
            var result = await db.EditData(
                @"UPDATE mechanic_db.""CarModels"" SET ""BrandId""=@BrandId, ""ModelName""=@ModelName
                  WHERE ""Id""=@Id", model);
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await db.EditData(
                @"DELETE FROM mechanic_db.""CarModels"" WHERE ""Id""=@Id", new { Id = id });
            return Ok(result);
        }
    }
}
