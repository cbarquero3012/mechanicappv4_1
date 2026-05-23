using MechanicApp.Server.Models;
using MechanicApp.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace MechanicApp.Server.Controllers
{
    /// <summary>
    /// Manages services linked to repair orders.
    /// </summary>
    [Authorize]
    [EnableRateLimiting("authenticated")]
    /// <summary>
    /// Manages services linked to repair orders.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class RepairOrderServiceController(IDbService db, IOrderCalculationService orderCalc) : ControllerBase
    {
        

        [HttpGet("{repairOrderId}")]
        public async Task<IActionResult> GetByOrder(int repairOrderId)
        {
            var result = await db.GetAll<RepairOrderService>(
                @"SELECT ros.*, s.""Name"" AS ""ServiceName"", s.""Category"" AS ""ServiceCategory"",
                    cur.""Symbol"" AS ""CurrencySymbol""
                  FROM mechanic_db.""RepairOrderServices"" ros
                  LEFT JOIN mechanic_db.""Services"" s ON ros.""ServiceId"" = s.""Id""
                  LEFT JOIN mechanic_db.""Currencies"" cur ON ros.""CurrencyId"" = cur.""Id""
                  WHERE ros.""RepairOrderId"" = @RepairOrderId
                  ORDER BY ros.""CreatedAt"" DESC", new { RepairOrderId = repairOrderId });
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] RepairOrderService item)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { message = "Some required fields are not filled. Please check them." });
            await db.EditData(
                @"INSERT INTO mechanic_db.""RepairOrderServices"" (""RepairOrderId"", ""ServiceId"", ""Quantity"", ""UnitPrice"", ""Notes"")
                  VALUES (@RepairOrderId, @ServiceId, @Quantity, @UnitPrice, @Notes)", item);
            await orderCalc.RecalculateOrderTotal(item.RepairOrderId);
            return Ok(new { message = "Service added to order" });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var item = await db.GetAsync<RepairOrderService>(
                @"SELECT * FROM mechanic_db.""RepairOrderServices"" WHERE ""Id"" = @Id", new { Id = id });
            if (item == null) return NotFound();

            await db.EditData(
                @"DELETE FROM mechanic_db.""RepairOrderServices"" WHERE ""Id"" = @Id", new { Id = id });
            await orderCalc.RecalculateOrderTotal(item.RepairOrderId);
            return Ok(new { message = "Service removed from order" });
        }
    }
}
