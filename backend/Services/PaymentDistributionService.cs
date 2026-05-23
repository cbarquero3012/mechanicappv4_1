using Dapper;
using MechanicApp.Server.Models;

namespace MechanicApp.Server.Services
{
    /// <summary>
    /// Distributes payment amounts across multiple repair orders proportionally or evenly.
    /// </summary>
    public class PaymentDistributionService(IDbService db) : IPaymentDistributionService
    {
        /// <inheritdoc />
        public async Task DistributePaymentToOrders(int paymentId, decimal amount, int[] repairOrderIds)
        {
            var orderInfos = new List<(int OrderId, decimal Remaining)>();
            foreach (var orderId in repairOrderIds)
            {
                var order = await db.GetAsync<OrderBalanceInfo>(
                    @"SELECT ""TotalCost"",
                      COALESCE((SELECT SUM(pro.""Amount"") FROM mechanic_db.""PaymentRepairOrders"" pro
                                WHERE pro.""RepairOrderId"" = @Id), 0) AS ""TotalPaid""
                      FROM mechanic_db.""RepairOrders"" WHERE ""Id"" = @Id",
                    new { Id = orderId });
                if (order != null)
                {
                    decimal remaining = order.TotalCost - order.TotalPaid;
                    orderInfos.Add((orderId, Math.Max(0, remaining)));
                }
            }

            decimal totalRemaining = orderInfos.Sum(o => o.Remaining);
            decimal allocated = 0;

            await db.ExecuteInTransactionAsync(async (conn, tx) =>
            {
                for (int i = 0; i < orderInfos.Count; i++)
                {
                    decimal orderAmount;
                    if (i == orderInfos.Count - 1)
                    {
                        orderAmount = amount - allocated;
                    }
                    else
                    {
                        decimal proportion = totalRemaining > 0
                            ? orderInfos[i].Remaining / totalRemaining
                            : 1.0m / orderInfos.Count;
                        orderAmount = Math.Round(amount * proportion, 2);
                    }

                    allocated += orderAmount;

                    await conn.ExecuteAsync(
                        @"INSERT INTO mechanic_db.""PaymentRepairOrders"" (""PaymentId"", ""RepairOrderId"", ""Amount"")
                          VALUES (@PaymentId, @RepairOrderId, @Amount)",
                        new { PaymentId = paymentId, RepairOrderId = orderInfos[i].OrderId, Amount = orderAmount },
                        transaction: tx);
                }
            });
        }

        /// <inheritdoc />
        public async Task RedistributePaymentEvenly(int paymentId, decimal amount, int[] repairOrderIds)
        {
            await db.ExecuteInTransactionAsync(async (conn, tx) =>
            {
                await conn.ExecuteAsync(
                    @"DELETE FROM mechanic_db.""PaymentRepairOrders"" WHERE ""PaymentId"" = @Id",
                    new { Id = paymentId }, transaction: tx);

                decimal amountPerOrder = Math.Round(amount / repairOrderIds.Length, 2);
                decimal allocated = 0;
                for (int i = 0; i < repairOrderIds.Length; i++)
                {
                    decimal orderAmount = (i == repairOrderIds.Length - 1)
                        ? amount - allocated
                        : amountPerOrder;
                    allocated += orderAmount;

                    await conn.ExecuteAsync(
                        @"INSERT INTO mechanic_db.""PaymentRepairOrders"" (""PaymentId"", ""RepairOrderId"", ""Amount"")
                          VALUES (@PaymentId, @RepairOrderId, @Amount)",
                        new { PaymentId = paymentId, RepairOrderId = repairOrderIds[i], Amount = orderAmount },
                        transaction: tx);
                }
            });
        }
    }
}
