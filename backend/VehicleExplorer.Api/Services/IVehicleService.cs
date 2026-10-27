using VehicleExplorer.Api.Models;

namespace VehicleExplorer.Api.Services;

public interface IVehicleService
{
    Task<IReadOnlyList<MakeDto>> GetMakesAsync(CancellationToken ct);

    Task<IReadOnlyList<VehicleTypeDto>> GetVehicleTypesAsync(int makeId, CancellationToken ct);

    /// <param name="vehicleType">Optional NHTSA vehicle type name, e.g. "Passenger Car".</param>
    Task<IReadOnlyList<ModelDto>> GetModelsAsync(int makeId, int year, string? vehicleType, CancellationToken ct);
}
