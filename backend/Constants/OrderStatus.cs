namespace MechanicApp.Server.Constants
{
    /// <summary>
    /// Defines the possible status values for a repair order.
    /// </summary>
    public static class OrderStatus
    {
        /// <summary>Order created but not yet started.</summary>
        public const string Pending = "Pending";

        /// <summary>Order is currently being worked on.</summary>
        public const string InProgress = "InProgress";

        /// <summary>Order work has been finished.</summary>
        public const string Completed = "Completed";
    }
}
