using MechanicApp.Server.Models;
using MechanicApp.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace MechanicApp.Server.Controllers
{
    /// <summary>
    /// CRUD operations for payment records with multi-order distribution and currency conversion.
    /// </summary>
    [Authorize]
    [EnableRateLimiting("authenticated")]
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentController(
        IDbService db,
        ICurrencyConversionService currencyService,
        IPaymentDistributionService distributionService) : ControllerBase
    {

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var result = await db.GetAll<Payment>(
                @"SELECT p.*,
                    (SELECT STRING_AGG(CAST(pro.""RepairOrderId"" AS TEXT), ',' ORDER BY pro.""RepairOrderId"")
                     FROM mechanic_db.""PaymentRepairOrders"" pro WHERE pro.""PaymentId"" = p.""Id"") AS ""OrderInfo"",
                    (SELECT STRING_AGG(DISTINCT b2.""BrandName"" || ' ' || cm2.""ModelName"" || ' (' || dc2.""Year"" || ')', ', ')
                     FROM mechanic_db.""PaymentRepairOrders"" pro2
                     JOIN mechanic_db.""RepairOrders"" r2 ON pro2.""RepairOrderId"" = r2.""Id""
                     JOIN mechanic_db.""DetailsCars"" dc2 ON r2.""DetailCarId"" = dc2.""Id""
                     JOIN mechanic_db.""CarModels"" cm2 ON dc2.""CarModelId"" = cm2.""Id""
                     JOIN mechanic_db.""CarBrands"" b2 ON cm2.""BrandId"" = b2.""Id""
                     WHERE pro2.""PaymentId"" = p.""Id"") AS ""CarInfo"",
                    (SELECT COALESCE(SUM(r3.""TotalCost""), 0)
                     FROM mechanic_db.""PaymentRepairOrders"" pro3
                     JOIN mechanic_db.""RepairOrders"" r3 ON pro3.""RepairOrderId"" = r3.""Id""
                     WHERE pro3.""PaymentId"" = p.""Id"") AS ""OrderTotal"",
                    cu.""FirstName"" || ' ' || cu.""LastName"" AS ""CustomerName"",
                    cur.""Symbol"" AS ""CurrencySymbol"",
                    ocur.""Symbol"" AS ""OriginalCurrencySymbol""
                  FROM mechanic_db.""Payments"" p
                  LEFT JOIN mechanic_db.""Customers"" cu ON p.""CustomerId"" = cu.""Id""
                  LEFT JOIN mechanic_db.""Currencies"" cur ON p.""CurrencyId"" = cur.""Id""
                  LEFT JOIN mechanic_db.""Currencies"" ocur ON p.""OriginalCurrencyId"" = ocur.""Id""
                  ORDER BY p.""PaymentDate"" DESC", new { });
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var result = await db.GetAsync<Payment>(
                @"SELECT p.*,
                    (SELECT STRING_AGG(CAST(pro.""RepairOrderId"" AS TEXT), ',' ORDER BY pro.""RepairOrderId"")
                     FROM mechanic_db.""PaymentRepairOrders"" pro WHERE pro.""PaymentId"" = p.""Id"") AS ""OrderInfo"",
                    (SELECT STRING_AGG(DISTINCT b2.""BrandName"" || ' ' || cm2.""ModelName"" || ' (' || dc2.""Year"" || ')', ', ')
                     FROM mechanic_db.""PaymentRepairOrders"" pro2
                     JOIN mechanic_db.""RepairOrders"" r2 ON pro2.""RepairOrderId"" = r2.""Id""
                     JOIN mechanic_db.""DetailsCars"" dc2 ON r2.""DetailCarId"" = dc2.""Id""
                     JOIN mechanic_db.""CarModels"" cm2 ON dc2.""CarModelId"" = cm2.""Id""
                     JOIN mechanic_db.""CarBrands"" b2 ON cm2.""BrandId"" = b2.""Id""
                     WHERE pro2.""PaymentId"" = p.""Id"") AS ""CarInfo"",
                    (SELECT COALESCE(SUM(r3.""TotalCost""), 0)
                     FROM mechanic_db.""PaymentRepairOrders"" pro3
                     JOIN mechanic_db.""RepairOrders"" r3 ON pro3.""RepairOrderId"" = r3.""Id""
                     WHERE pro3.""PaymentId"" = p.""Id"") AS ""OrderTotal"",
                    cu.""FirstName"" || ' ' || cu.""LastName"" AS ""CustomerName"",
                    cur.""Symbol"" AS ""CurrencySymbol"",
                    ocur.""Symbol"" AS ""OriginalCurrencySymbol""
                  FROM mechanic_db.""Payments"" p
                  LEFT JOIN mechanic_db.""Customers"" cu ON p.""CustomerId"" = cu.""Id""
                  LEFT JOIN mechanic_db.""Currencies"" cur ON p.""CurrencyId"" = cur.""Id""
                  LEFT JOIN mechanic_db.""Currencies"" ocur ON p.""OriginalCurrencyId"" = ocur.""Id""
                  WHERE p.""Id"" = @Id", new { Id = id });
            if (result == null) return NotFound();
            return Ok(result);
        }

        /// <summary>Get payments linked to a specific repair order via junction table.</summary>
        [HttpGet("order/{repairOrderId}")]
        public async Task<IActionResult> GetByOrder(int repairOrderId)
        {
            var result = await db.GetAll<Payment>(
                @"SELECT p.*, pro.""Amount"" AS ""OrderTotal"",
                    cu.""FirstName"" || ' ' || cu.""LastName"" AS ""CustomerName""
                  FROM mechanic_db.""PaymentRepairOrders"" pro
                  JOIN mechanic_db.""Payments"" p ON pro.""PaymentId"" = p.""Id""
                  LEFT JOIN mechanic_db.""Customers"" cu ON p.""CustomerId"" = cu.""Id""
                  WHERE pro.""RepairOrderId"" = @RepairOrderId
                  ORDER BY p.""PaymentDate"" DESC", new { RepairOrderId = repairOrderId });
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] Payment payment)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { message = "Some required fields are not filled. Please check them." });
            await currencyService.ConvertToDefaultCurrency(payment);

            var newPayment = await db.GetAsync<Payment>(
                @"INSERT INTO mechanic_db.""Payments"" (""CustomerId"", ""Amount"", ""PaymentMethod"", ""ReferenceNumber"", ""Notes"", ""CurrencyId"", ""OriginalAmount"", ""OriginalCurrencyId"")
                  VALUES (@CustomerId, @Amount, @PaymentMethod, @ReferenceNumber, @Notes, @CurrencyId, @OriginalAmount, @OriginalCurrencyId)
                  RETURNING ""Id""", payment);

            if (newPayment == null) return StatusCode(500, "Failed to create payment");
            int paymentId = newPayment.Id;

            if (payment.RepairOrderIds != null && payment.RepairOrderIds.Length > 0)
            {
                await distributionService.DistributePaymentToOrders(paymentId, payment.Amount, payment.RepairOrderIds);
            }

            return Ok(new { message = "Payment registered", id = paymentId });
        }

        [HttpPut]
        public async Task<IActionResult> Put([FromBody] Payment payment)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { message = "Some required fields are not filled. Please check them." });
            await currencyService.ConvertToDefaultCurrency(payment);

            await db.EditData(
                @"UPDATE mechanic_db.""Payments"" SET ""CustomerId""=@CustomerId,
                  ""Amount""=@Amount, ""PaymentMethod""=@PaymentMethod, ""ReferenceNumber""=@ReferenceNumber, ""Notes""=@Notes,
                  ""CurrencyId""=@CurrencyId, ""OriginalAmount""=@OriginalAmount, ""OriginalCurrencyId""=@OriginalCurrencyId
                  WHERE ""Id""=@Id", payment);

            if (payment.RepairOrderIds != null && payment.RepairOrderIds.Length > 0)
            {
                await distributionService.RedistributePaymentEvenly(payment.Id, payment.Amount, payment.RepairOrderIds);
            }

            return Ok(new { message = "Payment updated" });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            // Junction rows cascade-delete automatically
            var result = await db.EditData(
                @"DELETE FROM mechanic_db.""Payments"" WHERE ""Id""=@Id", new { Id = id });
            return Ok(result);
        }
    }
}
