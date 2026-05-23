namespace MechanicApp.Server.Services
{
    /// <summary>
    /// Placeholder for any future runtime migrations.
    /// Schema is now fully managed by init.sql and init_template.sql.
    /// </summary>
    public static class StartupMigrations
    {
        public static Task EnsureSchemaAsync(IDbService db)
        {
            // No runtime migrations needed — schema is defined in SQL init files.
            return Task.CompletedTask;
        }
    }
}
