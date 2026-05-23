using MechanicApp.Server.Models;

namespace MechanicApp.Server.Services
{
    /// <summary>
    /// Converts payment amounts to the system's default currency using stored exchange rates.
    /// </summary>
    public class CurrencyConversionService(IDbService db) : ICurrencyConversionService
    {
        /// <inheritdoc />
        public async Task ConvertToDefaultCurrency(Payment payment)
        {
            ArgumentNullException.ThrowIfNull(payment);

            if (!payment.CurrencyId.HasValue) return;

            var currency = await db.GetAsync<CurrencyInfo>(
                @"SELECT ""Id"", ""ExchangeRate"", ""IsDefault"" FROM mechanic_db.""Currencies"" WHERE ""Id"" = @Id",
                new { Id = payment.CurrencyId.Value });

            if (currency == null || currency.IsDefault)
            {
                payment.OriginalAmount = null;
                payment.OriginalCurrencyId = null;
                return;
            }

            payment.OriginalAmount = payment.Amount;
            payment.OriginalCurrencyId = payment.CurrencyId;
            payment.Amount = Math.Round(payment.Amount * currency.ExchangeRate, 2);

            var defaultCurrency = await db.GetAsync<DefaultCurrencyInfo>(
                @"SELECT ""Id"" FROM mechanic_db.""Currencies"" WHERE ""IsDefault"" = TRUE LIMIT 1",
                new { });
            if (defaultCurrency != null)
                payment.CurrencyId = defaultCurrency.Id;
        }
    }
}
