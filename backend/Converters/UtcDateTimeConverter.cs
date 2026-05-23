using System.Text.Json;
using System.Text.Json.Serialization;

namespace MechanicApp.Server.Converters;

/// <summary>
/// Serializes DateTime values as UTC ISO-8601 strings (ending in "Z").
/// PostgreSQL TIMESTAMP columns are returned by Dapper as DateTimeKind.Unspecified;
/// this converter promotes them to UTC so the Angular client can apply the
/// tenant's timezone via the localDate pipe.
/// </summary>
public sealed class UtcDateTimeConverter : JsonConverter<DateTime>
{
    public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        => DateTime.Parse(reader.GetString()!);

    public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
    {
        var utc = value.Kind == DateTimeKind.Unspecified
            ? DateTime.SpecifyKind(value, DateTimeKind.Utc)
            : value.ToUniversalTime();
        writer.WriteStringValue(utc.ToString("o")); // "o" = round-trip ISO-8601 with Z suffix
    }
}

/// <summary>Handles nullable DateTime? counterpart.</summary>
public sealed class NullableUtcDateTimeConverter : JsonConverter<DateTime?>
{
    public override DateTime? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Null) return null;
        return DateTime.Parse(reader.GetString()!);
    }

    public override void Write(Utf8JsonWriter writer, DateTime? value, JsonSerializerOptions options)
    {
        if (value is null) { writer.WriteNullValue(); return; }
        var utc = value.Value.Kind == DateTimeKind.Unspecified
            ? DateTime.SpecifyKind(value.Value, DateTimeKind.Utc)
            : value.Value.ToUniversalTime();
        writer.WriteStringValue(utc.ToString("o"));
    }
}
