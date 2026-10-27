using Microsoft.AspNetCore.Diagnostics;
using VehicleExplorer.Api.Endpoints;
using VehicleExplorer.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddMemoryCache();
builder.Services.AddProblemDetails();
builder.Services.AddHealthChecks();

builder.Services.AddHttpClient<IVehicleService, NhtsaVehicleService>(client =>
{
    client.BaseAddress = new Uri(builder.Configuration["Nhtsa:BaseUrl"] ?? "https://vpic.nhtsa.dot.gov/api/vehicles/");
    client.Timeout = TimeSpan.FromSeconds(15);
});

var app = builder.Build();

app.UseExceptionHandler(errors => errors.Run(async context =>
{
    var error = context.Features.Get<IExceptionHandlerFeature>()?.Error;
    context.Response.StatusCode = StatusCodes.Status500InternalServerError;
    await Results.Problem(title: "Something went wrong.", statusCode: StatusCodes.Status500InternalServerError).ExecuteAsync(context);
}));

app.UseDefaultFiles();
app.UseStaticFiles();

app.MapHealthChecks("/health");
app.MapVehicleEndpoints();

app.Run();
