using System.Data;

namespace MechanicApp.Server.Services
{
    /// <summary>
    /// Provides data access operations against the PostgreSQL database using Dapper.
    /// </summary>
    public interface IDbService
    {
        /// <summary>
        /// Retrieves a single record mapped to <typeparamref name="T"/>.
        /// </summary>
        /// <typeparam name="T">The type to map the result to.</typeparam>
        /// <param name="command">The SQL command to execute.</param>
        /// <param name="parms">The parameters for the SQL command.</param>
        /// <returns>The first matching record, or <c>null</c> if none found.</returns>
        Task<T?> GetAsync<T>(string command, object parms);

        /// <summary>
        /// Retrieves all records mapped to a list of <typeparamref name="T"/>.
        /// </summary>
        /// <typeparam name="T">The type to map each result row to.</typeparam>
        /// <param name="command">The SQL command to execute.</param>
        /// <param name="parms">The parameters for the SQL command.</param>
        /// <returns>A list of mapped records.</returns>
        Task<List<T>> GetAll<T>(string command, object parms);

        /// <summary>
        /// Executes an INSERT, UPDATE, or DELETE command and returns the number of affected rows.
        /// </summary>
        /// <param name="command">The SQL command to execute.</param>
        /// <param name="parms">The parameters for the SQL command.</param>
        /// <returns>The number of rows affected.</returns>
        Task<int> EditData(string command, object parms);

        /// <summary>
        /// Executes multiple operations within a single database transaction.
        /// </summary>
        /// <param name="action">The async action to execute within the transaction scope.</param>
        Task ExecuteInTransactionAsync(Func<IDbConnection, IDbTransaction, Task> action);
    }
}
