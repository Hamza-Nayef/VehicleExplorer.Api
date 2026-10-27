# Single image: the .NET API serves both /api/* and the built React app.
# One container = one thing to deploy on a single free-tier AWS instance.

# ---- 1. Build the React app -------------------------------------------------------------
FROM node:22-alpine AS web
WORKDIR /web
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---- 2. Publish the .NET API ------------------------------------------------------------
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS api
WORKDIR /src
# Copy only the project file first so the restore layer is cached until dependencies change.
COPY backend/VehicleExplorer.Api/VehicleExplorer.Api.csproj backend/VehicleExplorer.Api/
RUN dotnet restore backend/VehicleExplorer.Api/VehicleExplorer.Api.csproj
COPY backend/ backend/
RUN dotnet publish backend/VehicleExplorer.Api/VehicleExplorer.Api.csproj -c Release -o /app --no-restore

# ---- 3. Small runtime image -------------------------------------------------------------
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=api /app ./
COPY --from=web /web/dist ./wwwroot

ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080

# Run as the non-root user that Microsoft's images provide.
USER $APP_UID
ENTRYPOINT ["dotnet", "VehicleExplorer.Api.dll"]
