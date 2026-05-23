namespace MechanicApp.Server.Services
{
    /// <summary>
    /// Distributes payment amounts across multiple repair orders.
    /// </summary>
    public interface IPaymentDistributionService
    {
        /// <summary>
        /// Distributes a payment proportionally across orders based on each order's remaining balance.
        /// </summary>
        /// <param name="paymentId">The ID of the payment to distribute.</param>
        /// <param name="amount">The total payment amount to distribute.</param>
        /// <param name="repairOrderIds">The IDs of the repair orders to distribute across.</param>
        Task DistributePaymentToOrders(int paymentId, decimal amount, int[] repairOrderIds);

        /// <summary>
        /// Deletes existing distribution and re-distributes the payment evenly across the specified orders.
        /// </summary>
        /// <param name="paymentId">The ID of the payment to redistribute.</param>
        /// <param name="amount">The total payment amount.</param>
        /// <param name="repairOrderIds">The IDs of the repair orders.</param>
        Task RedistributePaymentEvenly(int paymentId, decimal amount, int[] repairOrderIds);
    }
}
