using Dapper;
using Npgsql;
using System.Data;

namespace MechanicApp.Server.Services
{
    /// <summary>
    /// Tenant-aware Dapper data access service.
    /// Uses ITenantContext to route queries to the correct tenant database.
    /// Falls back to the default NpgsqlDataSource when no tenant is resolved.
    /// </summary>
    public class DbService(NpgsqlDataSource dataSource, ITenantContext tenantContext) : IDbService
    {
        private NpgsqlConnection CreateTenantConnection()
        {
            if (tenantContext.IsResolved && tenantContext.ConnectionString != null)
            {
                return new NpgsqlConnection(tenantContext.ConnectionString);
            }
            return dataSource.CreateConnection();
        }

        /// <inheritdoc />
        public async Task<T?> GetAsync<T>(string command, object parms)
        {
            using var connection = CreateTenantConnection();
            return await connection.QueryFirstOrDefaultAsync<T>(command, parms).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<List<T>> GetAll<T>(string command, object parms)
        {
            using var connection = CreateTenantConnection();
            var result = await connection.QueryAsync<T>(command, parms).ConfigureAwait(false);
            return result.ToList();
        }

        /// <inheritdoc />
        public async Task<int> EditData(string command, object parms)
        {
            using var connection = CreateTenantConnection();
            return await connection.ExecuteAsync(command, parms).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task ExecuteInTransactionAsync(Func<IDbConnection, IDbTransaction, Task> action)
        {
            using var connection = CreateTenantConnection();
            await connection.OpenAsync().ConfigureAwait(false);
            using var transaction = await connection.BeginTransactionAsync().ConfigureAwait(false);
            try
            {
                await action(connection, transaction).ConfigureAwait(false);
                await transaction.CommitAsync().ConfigureAwait(false);
            }
            catch
            {
                await transaction.RollbackAsync().ConfigureAwait(false);
                throw;
            }
        }
    }
}
