namespace VehicleExplorer.Api.Models
{
    public sealed record NhtsaEnvelope<T>(int Count, string? Message, List<T>? Results);
}
