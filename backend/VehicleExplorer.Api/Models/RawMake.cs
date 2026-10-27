using System.Text.Json.Serialization;

namespace VehicleExplorer.Api.Models
{
    public sealed record RawMake(
       [property: JsonPropertyName("Make_ID")] int MakeId,
       [property: JsonPropertyName("Make_Name")] string? MakeName);
}
