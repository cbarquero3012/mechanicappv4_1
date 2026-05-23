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
    /// Provides aggregated dashboard statistics and KPIs.
    /// </summary>
    [Authorize]
    [EnableRateLimiting("authenticated")]
    /// <summary>
    /// Provides aggregated dashboard statistics and KPIs.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController(IDbService db) : ControllerBase
    {
        

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            var mechanicIdClaim = User.FindFirst("mechanicId")?.Value;
            int? mechanicId = int.TryParse(mechanicIdClaim, out var mid) ? mid : null;
            var isMechanic = role == AppRoles.Mechanic && mechanicId.HasValue;
            var filterParam = new { MechanicId = mechanicId ?? 0 };

            var defaultCurrency = await db.GetAsync<CurrencySymbolResult>(
                @"SELECT ""Symbol"" FROM mechanic_db.""Currencies"" WHERE ""IsDefault"" = TRUE LIMIT 1", new { });
            var currencySymbol = defaultCurrency?.Symbol ?? "₡";

            var customerCount = await db.GetAsync<CountResult>(
                @"SELECT COUNT(*) AS ""Value"" FROM mechanic_db.""Customers""", new { });
            var vehicleCount = await db.GetAsync<CountResult>(
                @"SELECT COUNT(*) AS ""Value"" FROM mechanic_db.""DetailsCars""", new { });
            var mechanicCount = await db.GetAsync<CountResult>(
                @"SELECT COUNT(*) AS ""Value"" FROM mechanic_db.""Mechanics""", new { });

            var totalOrders = await db.GetAsync<CountResult>(
                @"SELECT COUNT(*) AS ""Value"" FROM mechanic_db.""RepairOrders"" r" + (isMechanic ? @" WHERE r.""MechanicId"" = @MechanicId" : ""), filterParam);
            var pendingOrders = await db.GetAsync<CountResult>(
                @"SELECT COUNT(*) AS ""Value"" FROM mechanic_db.""RepairOrders"" r WHERE r.""Status"" = @Status" + (isMechanic ? @" AND r.""MechanicId"" = @MechanicId" : ""),
                new { MechanicId = mechanicId ?? 0, Status = OrderStatus.Pending });
            var inProgressOrders = await db.GetAsync<CountResult>(
                @"SELECT COUNT(*) AS ""Value"" FROM mechanic_db.""RepairOrders"" r WHERE r.""Status"" = @Status" + (isMechanic ? @" AND r.""MechanicId"" = @MechanicId" : ""),
                new { MechanicId = mechanicId ?? 0, Status = OrderStatus.InProgress });
            var completedOrders = await db.GetAsync<CountResult>(
                @"SELECT COUNT(*) AS ""Value"" FROM mechanic_db.""RepairOrders"" r WHERE r.""Status"" = @Status" + (isMechanic ? @" AND r.""MechanicId"" = @MechanicId" : ""),
                new { MechanicId = mechanicId ?? 0, Status = OrderStatus.Completed });

            var totalRevenue = await db.GetAsync<DecimalResult>(
                @"SELECT COALESCE(SUM(r.""TotalCost""), 0) AS ""Value"" FROM mechanic_db.""RepairOrders"" r" + (isMechanic ? @" WHERE r.""MechanicId"" = @MechanicId" : ""), filterParam);
            var paidRevenue = await db.GetAsync<DecimalResult>(
                @"SELECT COALESCE(SUM(p.""Amount""), 0) AS ""Value"" FROM mechanic_db.""Payments"" p" +
                (isMechanic ? @" WHERE p.""Id"" IN (SELECT pro.""PaymentId"" FROM mechanic_db.""PaymentRepairOrders"" pro JOIN mechanic_db.""RepairOrders"" r ON pro.""RepairOrderId"" = r.""Id"" WHERE r.""MechanicId"" = @MechanicId)" : ""), filterParam);

            var recentOrders = await db.GetAll<RecentOrderDto>(
                @"SELECT r.""Id"", r.""Status"", r.""TotalCost"", r.""OrderDate"",
                    b.""BrandName"" || ' ' || m.""ModelName"" || ' (' || d.""Year"" || ')' AS ""CarInfo"",
                    me.""FirstName"" || ' ' || me.""LastName"" AS ""MechanicName""
                  FROM mechanic_db.""RepairOrders"" r
                  LEFT JOIN mechanic_db.""DetailsCars"" d ON r.""DetailCarId"" = d.""Id""
                  LEFT JOIN mechanic_db.""CarModels"" m ON d.""CarModelId"" = m.""Id""
                  LEFT JOIN mechanic_db.""CarBrands"" b ON m.""BrandId"" = b.""Id""
                  LEFT JOIN mechanic_db.""Mechanics"" me ON r.""MechanicId"" = me.""Id""" +
                  (isMechanic ? @" WHERE r.""MechanicId"" = @MechanicId" : "") +
                  @" ORDER BY r.""CreatedAt"" DESC LIMIT 5", filterParam);

            return Ok(new
            {
                customerCount = customerCount?.Value ?? 0,
                vehicleCount = vehicleCount?.Value ?? 0,
                mechanicCount = mechanicCount?.Value ?? 0,
                totalOrders = totalOrders?.Value ?? 0,
                pendingOrders = pendingOrders?.Value ?? 0,
                inProgressOrders = inProgressOrders?.Value ?? 0,
                completedOrders = completedOrders?.Value ?? 0,
                totalRevenue = totalRevenue?.Value ?? 0m,
                paidRevenue = paidRevenue?.Value ?? 0m,
                recentOrders = recentOrders,
                currencySymbol = currencySymbol
            });
        }
    }
}
