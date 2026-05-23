using Dapper;
using MechanicApp.Server.Models;
using MechanicApp.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace MechanicApp.Server.Controllers
{
    /// <summary>
    /// CRUD operations for currency configuration and exchange rates.
    /// </summary>
    [Authorize]
    [EnableRateLimiting("authenticated")]
    /// <summary>
    /// CRUD operations for currency configuration and exchange rates.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class CurrencyController(IDbService db) : ControllerBase
    {


        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var result = await db.GetAll<Currency>(
                @"SELECT * FROM mechanic_db.""Currencies"" ORDER BY ""IsDefault"" DESC, ""Code""", new { });
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var result = await db.GetAsync<Currency>(
                @"SELECT * FROM mechanic_db.""Currencies"" WHERE ""Id"" = @Id", new { Id = id });
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] Currency currency)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { message = "Some required fields are not filled. Please check them." });

            await db.ExecuteInTransactionAsync(async (conn, tx) =>
            {
                if (currency.IsDefault)
                {
                    await conn.ExecuteAsync(
                        @"UPDATE mechanic_db.""Currencies"" SET ""IsDefault"" = FALSE WHERE ""IsDefault"" = TRUE", transaction: tx);
                }

                await conn.ExecuteAsync(
                    @"INSERT INTO mechanic_db.""Currencies"" (""Code"", ""Name"", ""Symbol"", ""ExchangeRate"", ""IsDefault"", ""IsActive"")
                      VALUES (@Code, @Name, @Symbol, @ExchangeRate, @IsDefault, @IsActive)", currency, transaction: tx);
            });

            return Ok(new { message = "Currency created" });
        }

        [HttpPut]
        public async Task<IActionResult> Put([FromBody] Currency currency)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { message = "Some required fields are not filled. Please check them." });

            await db.ExecuteInTransactionAsync(async (conn, tx) =>
            {
                if (currency.IsDefault)
                {
                    await conn.ExecuteAsync(
                        @"UPDATE mechanic_db.""Currencies"" SET ""IsDefault"" = FALSE WHERE ""IsDefault"" = TRUE AND ""Id"" <> @Id",
                        new { currency.Id }, transaction: tx);
                }

                await conn.ExecuteAsync(
                    @"UPDATE mechanic_db.""Currencies""
                      SET ""Code""=@Code, ""Name""=@Name, ""Symbol""=@Symbol,
                          ""ExchangeRate""=@ExchangeRate, ""IsDefault""=@IsDefault, ""IsActive""=@IsActive,
                          ""UpdatedAt""=CURRENT_TIMESTAMP
                      WHERE ""Id""=@Id", currency, transaction: tx);
            });

            return Ok(new { message = "Currency updated" });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            // Prevent deleting the default currency
            var currency = await db.GetAsync<Currency>(
                @"SELECT * FROM mechanic_db.""Currencies"" WHERE ""Id"" = @Id", new { Id = id });

            if (currency is not null && currency.IsDefault)
            {
                return BadRequest("Cannot delete the default currency. Set another currency as default first.");
            }

            var result = await db.EditData(
                @"DELETE FROM mechanic_db.""Currencies"" WHERE ""Id""=@Id", new { Id = id });
            return Ok(result);
        }
    }
}
