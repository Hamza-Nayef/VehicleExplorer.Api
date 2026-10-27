using System.Text.Json.Serialization;

namespace VehicleExplorer.Api.Models
{
    public sealed record RawModel(
           [property: JsonPropertyName("Model_ID")] int ModelId,
           [property: JsonPropertyName("Model_Name")] string? ModelName);
}
