using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Caching.Memory;
using VehicleExplorer.Api.Models;

namespace VehicleExplorer.Api.Services;

/// <summary>
/// Thin, cached client for the NHTSA vPIC API. Translates NHTSA's response
/// envelopes into our own DTOs and turns transport failures into one exception type.
/// </summary>
public sealed class NhtsaVehicleService(HttpClient http, IMemoryCache cache) : IVehicleService
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };
    private static readonly TimeSpan MakesTtl = TimeSpan.FromHours(24);
    private static readonly TimeSpan DefaultTtl = TimeSpan.FromHours(1);
    /// <summary>
    /// 
    /// </summary>
    /// <param name="ct"></param>
    /// <returns></returns>
    public async Task<IReadOnlyList<MakeDto>> GetMakesAsync(CancellationToken ct) =>
        await Cached("makes", MakesTtl, async () =>
        {
            var raw = await GetResultsAsync<RawMake>("getallmakes?format=json", ct);
            return raw
                .Where(m => !string.IsNullOrWhiteSpace(m.MakeName))
                .Select(m => new MakeDto(m.MakeId, m.MakeName!.Trim()))
                .DistinctBy(m => m.Id)
                .OrderBy(m => m.Name, StringComparer.OrdinalIgnoreCase)
                .ToList();
        });

    /// <summary>
    /// 
    /// </summary>
    /// <param name="makeId"></param>
    /// <param name="ct"></param>
    /// <returns></returns>
    public async Task<IReadOnlyList<VehicleTypeDto>> GetVehicleTypesAsync(int makeId, CancellationToken ct) =>
        await Cached($"types:{makeId}", DefaultTtl, async () =>
        {
            var raw = await GetResultsAsync<RawVehicleType>($"GetVehicleTypesForMakeId/{makeId}?format=json", ct);
            return raw
                .Where(t => !string.IsNullOrWhiteSpace(t.VehicleTypeName))
                .Select(t => new VehicleTypeDto(t.VehicleTypeId, t.VehicleTypeName!.Trim()))
                .DistinctBy(t => t.Id)
                .OrderBy(t => t.Name, StringComparer.OrdinalIgnoreCase)
                .ToList();
        });
    /// <summary>
    /// 
    /// </summary>
    /// <param name="makeId"></param>
    /// <param name="year"></param>
    /// <param name="vehicleType"></param>
    /// <param name="ct"></param>
    /// <returns></returns>
    public async Task<IReadOnlyList<ModelDto>> GetModelsAsync(int makeId, int year, string? vehicleType, CancellationToken ct)
    {
        var type = string.IsNullOrWhiteSpace(vehicleType) ? null : vehicleType.Trim();

        return await Cached($"models:{makeId}:{year}:{type?.ToLowerInvariant()}", DefaultTtl, async () =>
        {
            var path = $"GetModelsForMakeIdYear/makeId/{makeId}/modelyear/{year}";
            if (type is not null)
            {
                path += $"/vehicletype/{Uri.EscapeDataString(type)}";
            }

            var raw = await GetResultsAsync<RawModel>($"{path}?format=json", ct);
            return raw
                .Where(m => !string.IsNullOrWhiteSpace(m.ModelName))
                .Select(m => new ModelDto(m.ModelId, m.ModelName!.Trim()))
                .DistinctBy(m => (m.Id, m.Name))
                .OrderBy(m => m.Name, StringComparer.OrdinalIgnoreCase)
                .ToList();
        });
    }

    private async Task<IReadOnlyList<T>> Cached<T>(string key, TimeSpan ttl, Func<Task<List<T>>> load)
    {
        // If `load` throws, nothing is cached, so a transient NHTSA failure is not remembered.
        var result = await cache.GetOrCreateAsync(key, entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = ttl;
            return load();
        });
        return result ?? [];
    }
    /// <summary>
    /// 
    /// </summary>
    /// <typeparam name="T"></typeparam>
    /// <param name="relativeUrl"></param>
    /// <param name="ct"></param>
    /// <returns></returns>
    private async Task<List<T>> GetResultsAsync<T>(string relativeUrl, CancellationToken ct)
    {
        try
        {
            using var response = await http.GetAsync(relativeUrl, ct);
            response.EnsureSuccessStatusCode();

            var envelope = await response.Content.ReadFromJsonAsync<NhtsaEnvelope<T>>(JsonOptions, ct);
            return envelope?.Results ?? [];
        }
        catch (Exception ex) when (!ct.IsCancellationRequested &&
                                   ex is HttpRequestException or TaskCanceledException or JsonException)
        {
            throw new Exception(ex.Message, ex);
        }
    }
}
