namespace MechanicApp.Server.Models
{
    public class CurrencyInfo
    {
        public int Id { get; set; }
        public decimal ExchangeRate { get; set; }
        public bool IsDefault { get; set; }
    }

    public class DefaultCurrencyInfo
    {
        public int Id { get; set; }
    }
}
