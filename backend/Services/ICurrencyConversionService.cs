using MechanicApp.Server.Models;

namespace MechanicApp.Server.Services
{
    /// <summary>
    /// Converts payment amounts from a source currency to the system's default currency.
    /// </summary>
    public interface ICurrencyConversionService
    {
        /// <summary>
        /// Converts the payment amount to the default currency using the configured exchange rate.
        /// Stores the original amount and currency before conversion.
        /// </summary>
        /// <param name="payment">The payment whose amount will be converted in-place.</param>
        Task ConvertToDefaultCurrency(Payment payment);
    }
}
