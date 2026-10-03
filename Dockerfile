# Multi-stage build for BillEasePro ASP.NET Core 8 Web API
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Copy solution and project files first to cache restore layer
COPY BillEasePro.slnx ./
COPY src/BillEasePro.Domain/*.csproj ./src/BillEasePro.Domain/
COPY src/BillEasePro.Application/*.csproj ./src/BillEasePro.Application/
COPY src/BillEasePro.Infrastructure/*.csproj ./src/BillEasePro.Infrastructure/
COPY src/BillEasePro.Api/*.csproj ./src/BillEasePro.Api/

RUN dotnet restore src/BillEasePro.Api/BillEasePro.Api.csproj

# Copy the rest of the source code
COPY src/ ./src/

# Build and publish release binaries
WORKDIR /app/src/BillEasePro.Api
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

# Runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Expose standard container port
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "BillEasePro.Api.dll"]
