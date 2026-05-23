namespace MechanicApp.Server.Services
{
    /// <summary>
    /// Recalculates repair order totals from linked parts and services.
    /// </summary>
    public class OrderCalculationService(IDbService db) : IOrderCalculationService
    {
        /// <inheritdoc />
        public async Task RecalculateOrderTotal(int repairOrderId)
        {
            await db.EditData(
                @"UPDATE mechanic_db.""RepairOrders""
                  SET ""TotalCost"" = (
                      SELECT COALESCE(SUM(""Quantity"" * ""UnitPrice""), 0)
                      FROM mechanic_db.""RepairOrderServices""
                      WHERE ""RepairOrderId"" = @Id
                  ) + (
                      SELECT COALESCE(SUM(""Quantity"" * ""UnitPrice""), 0)
                      FROM mechanic_db.""RepairOrderParts""
                      WHERE ""RepairOrderId"" = @Id
                  ) + (
                      SELECT COALESCE(SUM(""Quantity"" * ""UnitPrice""), 0)
                      FROM mechanic_db.""RepairOrderProducts""
                      WHERE ""RepairOrderId"" = @Id
                  )
                  WHERE ""Id"" = @Id", new { Id = repairOrderId });
        }
    }
}
