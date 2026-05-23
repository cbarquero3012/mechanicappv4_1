using MechanicApp.Server.Models;
using MechanicApp.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace MechanicApp.Server.Controllers
{
    /// <summary>
    /// Legacy /api/car endpoint – returns CarModel data with BrandName
    /// so the existing frontend (add-car dropdown) keeps working.
    /// </summary>
    [Authorize]
    [EnableRateLimiting("authenticated")]
    [ApiController]
    [Route("api/[controller]")]
    public class CarController(IDbService db) : ControllerBase
    {
        /// <summary>Returns all car models with their brand names.</summary>
        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var result = await db.GetAll<Car>(
                @"SELECT m.""Id"", b.""BrandName"" AS ""Brand"", m.""ModelName"" AS ""Model""
                  FROM mechanic_db.""CarModels"" m
                  JOIN mechanic_db.""CarBrands"" b ON m.""BrandId"" = b.""Id""
                  ORDER BY b.""BrandName"", m.""ModelName""", new { });
            return Ok(result);
        }

        /// <summary>Returns a single car model by ID.</summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var result = await db.GetAsync<Car>(
                @"SELECT m.""Id"", b.""BrandName"" AS ""Brand"", m.""ModelName"" AS ""Model""
                  FROM mechanic_db.""CarModels"" m
                  JOIN mechanic_db.""CarBrands"" b ON m.""BrandId"" = b.""Id""
                  WHERE m.""Id"" = @Id", new { Id = id });
            if (result == null) return NotFound();
            return Ok(result);
        }
    }
}
