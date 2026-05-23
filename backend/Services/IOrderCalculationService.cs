namespace MechanicApp.Server.Services
{
    /// <summary>
    /// Recalculates repair order totals based on linked parts and services.
    /// </summary>
    public interface IOrderCalculationService
    {
        /// <summary>
        /// Recalculates the total cost of a repair order by summing its parts and services.
        /// </summary>
        /// <param name="repairOrderId">The ID of the repair order to recalculate.</param>
        Task RecalculateOrderTotal(int repairOrderId);
    }
}
