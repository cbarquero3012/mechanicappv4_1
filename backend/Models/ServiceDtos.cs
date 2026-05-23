namespace MechanicApp.Server.Models
{
    /// <summary>
    /// Represents the balance information for a repair order used during payment distribution.
    /// </summary>
    public class OrderBalanceInfo
    {
        /// <summary>Total cost of the repair order.</summary>
        public decimal TotalCost { get; set; }

        /// <summary>Total amount already paid toward the repair order.</summary>
        public decimal TotalPaid { get; set; }
    }

    /// <summary>
    /// Represents an available mechanic-role user that can be linked to a mechanic record.
    /// </summary>
    public class MechanicUserOption
    {
        /// <summary>The user's ID.</summary>
        public int Id { get; set; }

        /// <summary>The user's login username.</summary>
        public string Username { get; set; } = "";

        /// <summary>The user's display name.</summary>
        public string FullName { get; set; } = "";

        /// <summary>The mechanic record currently linked to this user, if any.</summary>
        public int? MechanicId { get; set; }
    }

    /// <summary>
    /// Count of photos for cleanup status reporting.
    /// </summary>
    public class CleanupPhotoCount
    {
        /// <summary>Total number of photos.</summary>
        public int Count { get; set; }
    }
}
