using System.Data;
using Dapper;

namespace MechanicApp.Server.Services
{
    /// <summary>
    /// Dapper type handler for <see cref="DateOnly"/>.
    /// Dapper does not natively support DateOnly; this handler converts
    /// between DateOnly and DateTime so INSERT/UPDATE parameters work.
    /// </summary>
    public class DateOnlyTypeHandler : SqlMapper.TypeHandler<DateOnly>
    {
        public override void SetValue(IDbDataParameter parameter, DateOnly value)
        {
            parameter.DbType = DbType.Date;
            parameter.Value = value.ToDateTime(TimeOnly.MinValue);
        }

        public override DateOnly Parse(object value) => value switch
        {
            DateTime dt => DateOnly.FromDateTime(dt),
            DateOnly d => d,
            _ => DateOnly.FromDateTime(Convert.ToDateTime(value))
        };
    }
}
