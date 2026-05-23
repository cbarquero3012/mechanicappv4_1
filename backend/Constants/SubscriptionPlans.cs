namespace MechanicApp.Server.Constants
{
    /// <summary>
    /// Defines the available subscription plans and their limits.
    /// </summary>
    public static class SubscriptionPlans
    {
        public const string FreeTrial = "free-trial";
        public const string Standard = "standard";
        public const string Premium = "premium";
        public const string Platinum = "platinum";
        public const string Golden = "golden";

        /// <summary>
        /// Returns the maximum number of users allowed for the given plan.
        /// </summary>
        public static int GetMaxUsers(string planName) => planName switch
        {
            FreeTrial => 3,
            Standard => 5,
            Premium => 15,
            Platinum => 25,
            Golden => 100,
            _ => 5
        };

        /// <summary>
        /// Returns the monthly price in USD for the given plan.
        /// </summary>
        public static decimal GetPrice(string planName) => planName switch
        {
            FreeTrial => 0m,
            Standard => 49m,
            Premium => 79m,
            Platinum => 99m,
            Golden => 0m, // Custom pricing
            _ => 49m
        };

        /// <summary>
        /// Returns the trial duration in days for the given plan.
        /// </summary>
        public static int GetTrialDays(string planName) => planName switch
        {
            FreeTrial => 7,
            _ => 0
        };

        /// <summary>
        /// Validates if a plan name is a known plan.
        /// </summary>
        public static bool IsValid(string planName) => planName is
            FreeTrial or Standard or Premium or Platinum or Golden;

        /// <summary>
        /// Returns all available plans as a list of plan info objects.
        /// </summary>
        public static object[] GetAllPlans() =>
        [
            new { name = FreeTrial, price = 0, maxUsers = 3, trialDays = 7, label = "Free Trial" },
            new { name = Standard, price = 49, maxUsers = 5, trialDays = 0, label = "Standard" },
            new { name = Premium, price = 79, maxUsers = 15, trialDays = 0, label = "Premium" },
            new { name = Platinum, price = 99, maxUsers = 25, trialDays = 0, label = "Platinum" },
            new { name = Golden, price = -1, maxUsers = 100, trialDays = 0, label = "Golden (Enterprise)" },
        ];
    }
}
