namespace MechanicApp.Server.Constants
{
    /// <summary>
    /// Defines the application role constants and validation logic.
    /// </summary>
    public static class AppRoles
    {
        /// <summary>Full system access including configuration and subscription management.</summary>
        public const string SuperAdmin = "super-admin";

        /// <summary>Full administrative access.</summary>
        public const string Admin = "admin";

        /// <summary>Supervisory access with limited admin capabilities.</summary>
        public const string Supervisor = "supervisor";

        /// <summary>Mechanic access scoped to assigned work.</summary>
        public const string Mechanic = "mechanic";

        /// <summary>All valid role values.</summary>
        public static readonly string[] All = { SuperAdmin, Admin, Supervisor, Mechanic };

        /// <summary>
        /// Validates whether the given role string is a recognized application role.
        /// </summary>
        /// <param name="role">The role string to validate.</param>
        /// <returns><c>true</c> if the role is valid; otherwise <c>false</c>.</returns>
        public static bool IsValid(string? role) =>
            !string.IsNullOrEmpty(role) && All.Contains(role.ToLower());
    }
}
