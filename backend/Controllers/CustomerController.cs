using MechanicApp.Server.Models;
using MechanicApp.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace MechanicApp.Server.Controllers
{
    /// <summary>
    /// CRUD operations for customer records.
    /// </summary>
    [Authorize]
    [EnableRateLimiting("authenticated")]
    [ApiController]
    [Route("api/[controller]")]
    public class CustomerController(IDbService db) : ControllerBase
    {
        /// <summary>Returns all customers ordered by last name.</summary>
        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var result = await db.GetAll<Customer>(
                @"SELECT * FROM mechanic_db.""Customers"" ORDER BY ""LastName"", ""FirstName""", new { });
            return Ok(result);
        }

        /// <summary>Returns a single customer by ID.</summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var result = await db.GetAsync<Customer>(
                @"SELECT * FROM mechanic_db.""Customers"" WHERE ""Id"" = @Id", new { Id = id });
            if (result == null) return NotFound();
            return Ok(result);
        }

        /// <summary>Creates a new customer.</summary>
        [HttpPost]
        public async Task<IActionResult> Post([FromBody] Customer customer)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { message = "Some required fields are not filled. Please check them." });
            var result = await db.EditData(
                @"INSERT INTO mechanic_db.""Customers"" (""FirstName"", ""LastName"", ""Email"", ""PhoneNumber"", ""Address"", ""IdClient"", ""EconomicActivityCode"")
                  VALUES (@FirstName, @LastName, @Email, @PhoneNumber, @Address, @IdClient, @EconomicActivityCode)", customer);
            return Ok(result);
        }

        /// <summary>Updates an existing customer.</summary>
        [HttpPut]
        public async Task<IActionResult> Put([FromBody] Customer customer)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { message = "Some required fields are not filled. Please check them." });
            var result = await db.EditData(
                @"UPDATE mechanic_db.""Customers"" SET ""FirstName""=@FirstName, ""LastName""=@LastName,
                  ""Email""=@Email, ""PhoneNumber""=@PhoneNumber, ""Address""=@Address,
                  ""IdClient""=@IdClient, ""EconomicActivityCode""=@EconomicActivityCode
                  WHERE ""Id""=@Id", customer);
            return Ok(result);
        }

        /// <summary>Deletes a customer by ID.</summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await db.EditData(
                @"DELETE FROM mechanic_db.""Customers"" WHERE ""Id""=@Id", new { Id = id });
            return Ok(result);
        }
    }
}
