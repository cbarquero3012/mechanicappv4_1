using System.Net;
using Npgsql;

namespace MechanicApp.Server.Middleware
{
    /// <summary>
    /// Global exception handling middleware.
    /// Catches unhandled exceptions and returns safe, consistent JSON error responses
    /// without exposing internal details (stack traces, SQL, connection strings).
    /// </summary>
    public class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        /// <summary>
        /// Processes the HTTP request and catches any unhandled exceptions.
        /// </summary>
        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await next(context);
            }
            catch (NpgsqlException ex)
            {
                logger.LogError(ex, "Database error on {Method} {Path}",
                    context.Request.Method, context.Request.Path);

                context.Response.StatusCode = (int)HttpStatusCode.ServiceUnavailable;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsJsonAsync(new
                {
                    message = "A database error occurred. Please try again later.",
                    code = "DB_ERROR"
                });
            }
            catch (ArgumentException ex)
            {
                logger.LogWarning(ex, "Bad argument on {Method} {Path}",
                    context.Request.Method, context.Request.Path);

                context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsJsonAsync(new
                {
                    message = ex.Message,
                    code = "BAD_REQUEST"
                });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Unhandled exception on {Method} {Path}",
                    context.Request.Method, context.Request.Path);

                context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsJsonAsync(new
                {
                    message = "An internal server error occurred.",
                    code = "INTERNAL_ERROR"
                });
            }
        }
    }
}
