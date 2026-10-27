using VehicleExplorer.Api.Services;

namespace VehicleExplorer.Api.Endpoints;

public static class VehicleEndpoints
{
    private const int MinYear = 1950;
    public static IEndpointRouteBuilder MapVehicleEndpoints(this IEndpointRouteBuilder app)
    {
        var api = app.MapGroup("/api");

        // GET /api/makes
        api.MapGet("/makes", async (IVehicleService vehicles, CancellationToken ct) =>
            Results.Ok(await vehicles.GetMakesAsync(ct)));

        // GET /api/makes/448/vehicle-types
        api.MapGet("/makes/{makeId:int}/vehicle-types", async (int makeId, IVehicleService vehicles, CancellationToken ct) =>
            Results.Ok(await vehicles.GetVehicleTypesAsync(makeId, ct)));

        // GET /api/makes/474/models?year=2015[&vehicleType=Passenger%20Car]
        api.MapGet("/makes/{makeId:int}/models", async (
            int makeId, int? year, string? vehicleType, IVehicleService vehicles, CancellationToken ct) =>
        {
            var maxYear = DateTime.UtcNow.Year + 1; // manufacturers publish next model year early
            if (year is null || year < MinYear || year > maxYear)
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["year"] = [$"A model year between {MinYear} and {maxYear} is required."]
                });
            }

            return Results.Ok(await vehicles.GetModelsAsync(makeId, year.Value, vehicleType, ct));
        });
        return app;
    }
}
