namespace MechanicApp.Server.Models
{
    public class DashboardStatsResult
    {
        public int CustomerCount { get; set; }
        public int VehicleCount { get; set; }
        public int MechanicCount { get; set; }
        public int TotalOrders { get; set; }
        public int PendingOrders { get; set; }
        public int InProgressOrders { get; set; }
        public int CompletedOrders { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal PaidRevenue { get; set; }
        public List<RecentOrderDto> RecentOrders { get; set; } = new();
        public string CurrencySymbol { get; set; } = "₡";
    }

    public class CountResult
    {
        public int Value { get; set; }
    }

    public class DecimalResult
    {
        public decimal Value { get; set; }
    }

    public class CurrencySymbolResult
    {
        public string Symbol { get; set; } = "₡";
    }

    public class RecentOrderDto
    {
        public int Id { get; set; }
        public string Status { get; set; } = "";
        public decimal TotalCost { get; set; }
        public DateTime? OrderDate { get; set; }
        public string? CarInfo { get; set; }
        public string? MechanicName { get; set; }
    }
}
