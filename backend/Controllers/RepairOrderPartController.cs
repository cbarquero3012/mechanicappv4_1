using Dapper;
using MechanicApp.Server.Models;
using MechanicApp.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace MechanicApp.Server.Controllers
{
    /// <summary>
    /// Manages parts linked to repair orders with inventory tracking.
    /// </summary>
    [Authorize]
    [EnableRateLimiting("authenticated")]
    /// <summary>
    /// Manages parts linked to repair orders with inventory tracking.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class RepairOrderPartController(IDbService db, IOrderCalculationService orderCalc) : ControllerBase
    {


        [HttpGet("{repairOrderId}")]
        public async Task<IActionResult> GetByOrder(int repairOrderId)
        {
            var result = await db.GetAll<RepairOrderPart>(
                @"SELECT rop.*, p.""Name"" AS ""PartName"", p.""PartNumber"", p.""Category"" AS ""PartCategory"",
                    cur.""Symbol"" AS ""CurrencySymbol""
                  FROM mechanic_db.""RepairOrderParts"" rop
                  LEFT JOIN mechanic_db.""Parts"" p ON rop.""PartId"" = p.""Id""
                  LEFT JOIN mechanic_db.""Currencies"" cur ON rop.""CurrencyId"" = cur.""Id""
                  WHERE rop.""RepairOrderId"" = @RepairOrderId
                  ORDER BY rop.""CreatedAt"" DESC", new { RepairOrderId = repairOrderId });
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] RepairOrderPart item)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { message = "Some required fields are not filled. Please check them." });

            await db.ExecuteInTransactionAsync(async (conn, tx) =>
            {
                await conn.ExecuteAsync(
                    @"UPDATE mechanic_db.""Parts""
                      SET ""Quantity"" = ""Quantity"" - @Qty, ""UpdatedAt"" = CURRENT_TIMESTAMP
                      WHERE ""Id"" = @PartId AND ""Quantity"" >= @Qty",
                    new { PartId = item.PartId, Qty = item.Quantity }, transaction: tx);

                await conn.ExecuteAsync(
                    @"INSERT INTO mechanic_db.""RepairOrderParts"" (""RepairOrderId"", ""PartId"", ""Quantity"", ""UnitPrice"", ""Notes"")
                      VALUES (@RepairOrderId, @PartId, @Quantity, @UnitPrice, @Notes)", item, transaction: tx);
            });

            await orderCalc.RecalculateOrderTotal(item.RepairOrderId);
            return Ok(new { message = "Part added to order" });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var item = await db.GetAsync<RepairOrderPart>(
                @"SELECT * FROM mechanic_db.""RepairOrderParts"" WHERE ""Id"" = @Id", new { Id = id });
            if (item == null) return NotFound();

            await db.ExecuteInTransactionAsync(async (conn, tx) =>
            {
                await conn.ExecuteAsync(
                    @"UPDATE mechanic_db.""Parts""
                      SET ""Quantity"" = ""Quantity"" + @Qty, ""UpdatedAt"" = CURRENT_TIMESTAMP
                      WHERE ""Id"" = @PartId",
                    new { PartId = item.PartId, Qty = item.Quantity }, transaction: tx);

                await conn.ExecuteAsync(
                    @"DELETE FROM mechanic_db.""RepairOrderParts"" WHERE ""Id"" = @Id", new { Id = id }, transaction: tx);
            });

            await orderCalc.RecalculateOrderTotal(item.RepairOrderId);
            return Ok(new { message = "Part removed from order" });
        }
    }
}
