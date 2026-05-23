namespace MechanicApp.Server.Services
{
    /// <summary>
    /// Maps country names to IANA timezone identifiers.
    /// The timezone is stored in AppSettings and used by the frontend to display
    /// all dates/times in the shop's local time.
    /// </summary>
    public static class CountryTimezoneService
    {
        // Common IANA timezone IDs per country (primary/most-used timezone)
        private static readonly Dictionary<string, string> _map = new(StringComparer.OrdinalIgnoreCase)
        {
            // Central America
            { "Costa Rica",       "America/Costa_Rica" },
            { "Guatemala",        "America/Guatemala" },
            { "El Salvador",      "America/El_Salvador" },
            { "Honduras",         "America/Tegucigalpa" },
            { "Nicaragua",        "America/Managua" },
            { "Panamá",           "America/Panama" },
            { "Panama",           "America/Panama" },
            { "Belize",           "America/Belize" },

            // North America
            { "México",           "America/Mexico_City" },
            { "Mexico",           "America/Mexico_City" },
            { "United States",    "America/New_York" },
            { "USA",              "America/New_York" },
            { "Canada",           "America/Toronto" },

            // Caribbean
            { "Cuba",             "America/Havana" },
            { "Dominican Republic", "America/Santo_Domingo" },
            { "Puerto Rico",      "America/Puerto_Rico" },
            { "Jamaica",          "America/Jamaica" },
            { "Haiti",            "America/Port-au-Prince" },
            { "Trinidad and Tobago", "America/Port_of_Spain" },

            // South America
            { "Colombia",         "America/Bogota" },
            { "Venezuela",        "America/Caracas" },
            { "Ecuador",          "America/Guayaquil" },
            { "Perú",             "America/Lima" },
            { "Peru",             "America/Lima" },
            { "Bolivia",          "America/La_Paz" },
            { "Chile",            "America/Santiago" },
            { "Brasil",           "America/Sao_Paulo" },
            { "Brazil",           "America/Sao_Paulo" },
            { "Argentina",        "America/Argentina/Buenos_Aires" },
            { "Uruguay",          "America/Montevideo" },
            { "Paraguay",         "America/Asuncion" },
            { "Guyana",           "America/Guyana" },
            { "Suriname",         "America/Paramaribo" },

            // Europe
            { "Spain",            "Europe/Madrid" },
            { "España",           "Europe/Madrid" },
            { "Portugal",         "Europe/Lisbon" },
            { "France",           "Europe/Paris" },
            { "Germany",          "Europe/Berlin" },
            { "Italy",            "Europe/Rome" },
            { "United Kingdom",   "Europe/London" },
            { "UK",               "Europe/London" },

            // Default fallback
            { "Other",            "UTC" },
        };

        /// <summary>
        /// Returns the IANA timezone ID for the given country.
        /// Falls back to "UTC" if the country is not in the mapping.
        /// </summary>
        public static string GetTimezone(string? country)
        {
            if (string.IsNullOrWhiteSpace(country))
                return "UTC";

            return _map.TryGetValue(country.Trim(), out var tz) ? tz : "UTC";
        }
    }
}
