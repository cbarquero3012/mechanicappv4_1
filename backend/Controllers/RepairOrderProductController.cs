using Dapper;
using MechanicApp.Server.Models;
using MechanicApp.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace MechanicApp.Server.Controllers
{
    /// <summary>
    /// Manages products linked to repair orders with inventory tracking.
    /// </summary>
    [Authorize]
    [EnableRateLimiting("authenticated")]
    [ApiController]
    [Route("api/[controller]")]
    public class RepairOrderProductController(IDbService db, IOrderCalculationService orderCalc) : ControllerBase
    {
        [HttpGet("{repairOrderId}")]
        public async Task<IActionResult> GetByOrder(int repairOrderId)
        {
            var result = await db.GetAll<RepairOrderProduct>(
                @"SELECT rop.*, p.""Name"" AS ""ProductName"", p.""SKU"" AS ""ProductSKU"", p.""Category"" AS ""ProductCategory"",
                    cur.""Symbol"" AS ""CurrencySymbol""
                  FROM mechanic_db.""RepairOrderProducts"" rop
                  LEFT JOIN mechanic_db.""Products"" p ON rop.""ProductId"" = p.""Id""
                  LEFT JOIN mechanic_db.""Currencies"" cur ON rop.""CurrencyId"" = cur.""Id""
                  WHERE rop.""RepairOrderId"" = @RepairOrderId
                  ORDER BY rop.""CreatedAt"" DESC", new { RepairOrderId = repairOrderId });
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] RepairOrderProduct item)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { message = "Some required fields are not filled. Please check them." });

            await db.ExecuteInTransactionAsync(async (conn, tx) =>
            {
                await conn.ExecuteAsync(
                    @"UPDATE mechanic_db.""Products""
                      SET ""Quantity"" = ""Quantity"" - @Qty, ""UpdatedAt"" = CURRENT_TIMESTAMP
                      WHERE ""Id"" = @ProductId AND ""Quantity"" >= @Qty",
                    new { ProductId = item.ProductId, Qty = item.Quantity }, transaction: tx);

                await conn.ExecuteAsync(
                    @"INSERT INTO mechanic_db.""RepairOrderProducts"" (""RepairOrderId"", ""ProductId"", ""Quantity"", ""UnitPrice"", ""Notes"")
                      VALUES (@RepairOrderId, @ProductId, @Quantity, @UnitPrice, @Notes)", item, transaction: tx);
            });

            await orderCalc.RecalculateOrderTotal(item.RepairOrderId);
            return Ok(new { message = "Product added to order" });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var item = await db.GetAsync<RepairOrderProduct>(
                @"SELECT * FROM mechanic_db.""RepairOrderProducts"" WHERE ""Id"" = @Id", new { Id = id });
            if (item == null) return NotFound();

            await db.ExecuteInTransactionAsync(async (conn, tx) =>
            {
                await conn.ExecuteAsync(
                    @"UPDATE mechanic_db.""Products""
                      SET ""Quantity"" = ""Quantity"" + @Qty, ""UpdatedAt"" = CURRENT_TIMESTAMP
                      WHERE ""Id"" = @ProductId",
                    new { ProductId = item.ProductId, Qty = item.Quantity }, transaction: tx);

                await conn.ExecuteAsync(
                    @"DELETE FROM mechanic_db.""RepairOrderProducts"" WHERE ""Id"" = @Id", new { Id = id }, transaction: tx);
            });

            await orderCalc.RecalculateOrderTotal(item.RepairOrderId);
            return Ok(new { message = "Product removed from order" });
        }
    }
}
