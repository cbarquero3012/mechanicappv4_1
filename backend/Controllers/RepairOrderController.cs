using System.Security.Claims;
using MechanicApp.Server.Constants;
using MechanicApp.Server.Models;
using MechanicApp.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace MechanicApp.Server.Controllers
{
    /// <summary>
    /// CRUD operations for repair orders with mechanic-scoped access.
    /// </summary>
    [Authorize]
    [EnableRateLimiting("authenticated")]
    /// <summary>
    /// CRUD operations for repair orders with mechanic-scoped access.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class RepairOrderController(IDbService db) : ControllerBase
    {


        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            var mechanicIdClaim = User.FindFirst("mechanicId")?.Value;
            int? mechanicId = int.TryParse(mechanicIdClaim, out var mid) ? mid : null;

            var sql = @"SELECT r.*,
                    b.""BrandName"" || ' ' || cm.""ModelName"" || ' (' || d.""Year"" || ')' AS ""CarInfo"",
                    mech.""FirstName"" || ' ' || mech.""LastName"" AS ""MechanicName"",
                    cur.""Symbol"" AS ""CurrencySymbol"",
                    COALESCE(c.""FirstName"" || ' ' || c.""LastName"", '') AS ""CustomerName"",
                    COALESCE(d.""LicensePlate"", '') AS ""LicensePlate"",
                    COALESCE((SELECT SUM(pro.""Amount"") FROM mechanic_db.""PaymentRepairOrders"" pro WHERE pro.""RepairOrderId"" = r.""Id""), 0) AS ""TotalPaid""
                  FROM mechanic_db.""RepairOrders"" r
                  LEFT JOIN mechanic_db.""DetailsCars"" d ON r.""DetailCarId"" = d.""Id""
                  LEFT JOIN mechanic_db.""CarModels"" cm ON d.""CarModelId"" = cm.""Id""
                  LEFT JOIN mechanic_db.""CarBrands"" b ON cm.""BrandId"" = b.""Id""
                  LEFT JOIN mechanic_db.""Mechanics"" mech ON r.""MechanicId"" = mech.""Id""
                  LEFT JOIN mechanic_db.""Currencies"" cur ON r.""CurrencyId"" = cur.""Id""
                  LEFT JOIN mechanic_db.""Customers"" c ON d.""CustomerId"" = c.""Id""";

            if (role == AppRoles.Mechanic && mechanicId.HasValue)
                sql += @" WHERE r.""MechanicId"" = @MechanicId";

            sql += @" ORDER BY r.""OrderDate"" DESC";

            var result = await db.GetAll<RepairOrder>(sql, new { MechanicId = mechanicId ?? 0 });
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            var mechanicIdClaim = User.FindFirst("mechanicId")?.Value;
            int? mechanicId = int.TryParse(mechanicIdClaim, out var mid0) ? mid0 : null;

            var sql = @"SELECT r.*,
                    b.""BrandName"" || ' ' || cm.""ModelName"" || ' (' || d.""Year"" || ')' AS ""CarInfo"",
                    mech.""FirstName"" || ' ' || mech.""LastName"" AS ""MechanicName"",
                    cur.""Symbol"" AS ""CurrencySymbol"",
                    COALESCE(c.""FirstName"" || ' ' || c.""LastName"", '') AS ""CustomerName"",
                    COALESCE(d.""LicensePlate"", '') AS ""LicensePlate""
                  FROM mechanic_db.""RepairOrders"" r
                  LEFT JOIN mechanic_db.""DetailsCars"" d ON r.""DetailCarId"" = d.""Id""
                  LEFT JOIN mechanic_db.""CarModels"" cm ON d.""CarModelId"" = cm.""Id""
                  LEFT JOIN mechanic_db.""CarBrands"" b ON cm.""BrandId"" = b.""Id""
                  LEFT JOIN mechanic_db.""Mechanics"" mech ON r.""MechanicId"" = mech.""Id""
                  LEFT JOIN mechanic_db.""Currencies"" cur ON r.""CurrencyId"" = cur.""Id""
                  LEFT JOIN mechanic_db.""Customers"" c ON d.""CustomerId"" = c.""Id""
                  WHERE r.""Id"" = @Id";

            if (role == AppRoles.Mechanic && mechanicId.HasValue)
                sql += @" AND r.""MechanicId"" = @MechanicId";

            var result = await db.GetAsync<RepairOrder>(sql, new { Id = id, MechanicId = mechanicId ?? 0 });
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] RepairOrder order)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { message = "Some required fields are not filled. Please check them." });
            // Mechanic-role users can only assign orders to themselves
            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            var mechanicIdClaim = User.FindFirst("mechanicId")?.Value;
            if (role == AppRoles.Mechanic && int.TryParse(mechanicIdClaim, out var mid))
                order.MechanicId = mid;

            var newOrder = await db.GetAsync<RepairOrder>(
                @"INSERT INTO mechanic_db.""RepairOrders"" (""DetailCarId"", ""MechanicId"", ""Status"", ""TotalCost"", ""Notes"", ""CurrencyId"")
                  VALUES (@DetailCarId, @MechanicId, @Status, @TotalCost, @Notes, @CurrencyId)
                  RETURNING ""Id""", order);
            return Ok(new { message = "Order created", id = newOrder?.Id ?? 0 });
        }

        [HttpPut]
        public async Task<IActionResult> Put([FromBody] RepairOrder order)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { message = "Some required fields are not filled. Please check them." });

            // Mechanic-role users can only update their own orders
            var role2 = User.FindFirst(ClaimTypes.Role)?.Value;
            var mechanicIdClaim2 = User.FindFirst("mechanicId")?.Value;
            if (role2 == AppRoles.Mechanic && int.TryParse(mechanicIdClaim2, out var mid2))
            {
                order.MechanicId = mid2;
                var existing = await db.GetAsync<RepairOrder>(
                    @"SELECT ""Id"" FROM mechanic_db.""RepairOrders"" WHERE ""Id"" = @Id AND ""MechanicId"" = @MechanicId",
                    new { order.Id, MechanicId = mid2 });
                if (existing == null) return NotFound();
            }

            var result = await db.EditData(
                @"UPDATE mechanic_db.""RepairOrders"" SET ""DetailCarId""=@DetailCarId, ""MechanicId""=@MechanicId,
                  ""Status""=@Status, ""TotalCost""=@TotalCost, ""Notes""=@Notes, ""CurrencyId""=@CurrencyId
                  WHERE ""Id""=@Id", order);
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            // Mechanic-role users can only delete their own orders
            var role3 = User.FindFirst(ClaimTypes.Role)?.Value;
            var mechanicIdClaim3 = User.FindFirst("mechanicId")?.Value;
            if (role3 == AppRoles.Mechanic && int.TryParse(mechanicIdClaim3, out var mid3))
            {
                var existing = await db.GetAsync<RepairOrder>(
                    @"SELECT ""Id"" FROM mechanic_db.""RepairOrders"" WHERE ""Id"" = @Id AND ""MechanicId"" = @MechanicId",
                    new { Id = id, MechanicId = mid3 });
                if (existing == null) return NotFound();
            }

            var result = await db.EditData(
                @"DELETE FROM mechanic_db.""RepairOrders"" WHERE ""Id""=@Id", new { Id = id });
            return Ok(result);
        }
    }
}
