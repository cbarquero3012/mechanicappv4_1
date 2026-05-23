namespace MechanicApp.Server.Constants
{
    /// <summary>
    /// Defines the possible subscription status values.
    /// </summary>
    public static class SubscriptionStatus
    {
        /// <summary>Subscription is active and valid.</summary>
        public const string Active = "active";

        /// <summary>Subscription has been deactivated.</summary>
        public const string Inactive = "inactive";

        /// <summary>Subscription was cancelled by the user.</summary>
        public const string Cancelled = "cancelled";

        /// <summary>Payment was refunded.</summary>
        public const string Refunded = "refunded";

        /// <summary>Subscription has passed its expiration date.</summary>
        public const string Expired = "expired";
    }
}
