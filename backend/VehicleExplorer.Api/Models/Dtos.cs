namespace VehicleExplorer.Api.Models;

// Shapes returned by OUR API. Deliberately small and stable so the frontend
// does not depend on NHTSA's field names (Make_ID, Model_Name, ...).
public sealed record MakeDto(int Id, string Name);

public sealed record VehicleTypeDto(int Id, string Name);

public sealed record ModelDto(int Id, string Name);
