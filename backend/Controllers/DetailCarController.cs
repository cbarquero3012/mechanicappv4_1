using MechanicApp.Server.Models;
using MechanicApp.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace MechanicApp.Server.Controllers
{
    /// <summary>
    /// CRUD operations for detailed vehicle records (VIN, year, fuel, transmission).
    /// </summary>
    [Authorize]
    [EnableRateLimiting("authenticated")]
    /// <summary>
    /// CRUD operations for detailed vehicle records (VIN, year, fuel, transmission).
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class DetailCarController(IDbService db) : ControllerBase
    {


        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var result = await db.GetAll<DetailCar>(
                @"SELECT d.*, b.""BrandName"" AS ""Brand"", m.""ModelName"" AS ""Model"",
                    cu.""FirstName"" || ' ' || cu.""LastName"" AS ""CustomerName""
                  FROM mechanic_db.""DetailsCars"" d
                  LEFT JOIN mechanic_db.""CarModels"" m ON d.""CarModelId"" = m.""Id""
                  LEFT JOIN mechanic_db.""CarBrands"" b ON m.""BrandId"" = b.""Id""
                  LEFT JOIN mechanic_db.""Customers"" cu ON d.""CustomerId"" = cu.""Id""
                  ORDER BY d.""CreatedAt"" DESC", new { });
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var result = await db.GetAsync<DetailCar>(
                @"SELECT d.*, b.""BrandName"" AS ""Brand"", m.""ModelName"" AS ""Model"",
                    cu.""FirstName"" || ' ' || cu.""LastName"" AS ""CustomerName""
                  FROM mechanic_db.""DetailsCars"" d
                  LEFT JOIN mechanic_db.""CarModels"" m ON d.""CarModelId"" = m.""Id""
                  LEFT JOIN mechanic_db.""CarBrands"" b ON m.""BrandId"" = b.""Id""
                  LEFT JOIN mechanic_db.""Customers"" cu ON d.""CustomerId"" = cu.""Id""
                  WHERE d.""Id"" = @Id", new { Id = id });
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpGet("customer/{customerId}")]
        public async Task<IActionResult> GetByCustomer(int customerId)
        {
            var result = await db.GetAll<DetailCar>(
                @"SELECT d.*, b.""BrandName"" AS ""Brand"", m.""ModelName"" AS ""Model"",
                    cu.""FirstName"" || ' ' || cu.""LastName"" AS ""CustomerName""
                  FROM mechanic_db.""DetailsCars"" d
                  LEFT JOIN mechanic_db.""CarModels"" m ON d.""CarModelId"" = m.""Id""
                  LEFT JOIN mechanic_db.""CarBrands"" b ON m.""BrandId"" = b.""Id""
                  LEFT JOIN mechanic_db.""Customers"" cu ON d.""CustomerId"" = cu.""Id""
                  WHERE d.""CustomerId"" = @CustomerId
                  ORDER BY d.""CreatedAt"" DESC", new { CustomerId = customerId });
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] DetailCar detail)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { message = "Some required fields are not filled. Please check them." });
            var result = await db.EditData(
                @"INSERT INTO mechanic_db.""DetailsCars"" (""CarModelId"", ""CustomerId"", ""VIN"", ""Fuel"", ""Year"", ""TypeCar"", ""TransmissionType"", ""LicensePlate"", ""Mileage"")
                  VALUES (@CarModelId, @CustomerId, @VIN, @Fuel, @Year, @TypeCar, @TransmissionType, @LicensePlate, @Mileage)", detail);
            return Ok(result);
        }

        [HttpPut]
        public async Task<IActionResult> Put([FromBody] DetailCar detail)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { message = "Some required fields are not filled. Please check them." });
            var result = await db.EditData(
                @"UPDATE mechanic_db.""DetailsCars"" SET ""CarModelId""=@CarModelId, ""CustomerId""=@CustomerId,
                  ""VIN""=@VIN, ""Fuel""=@Fuel, ""Year""=@Year, ""TypeCar""=@TypeCar,
                  ""TransmissionType""=@TransmissionType, ""LicensePlate""=@LicensePlate, ""Mileage""=@Mileage
                  WHERE ""Id""=@Id", detail);
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await db.EditData(
                @"DELETE FROM mechanic_db.""DetailsCars"" WHERE ""Id""=@Id", new { Id = id });
            return Ok(result);
        }
    }
}
