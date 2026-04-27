FROM mcr.microsoft.com/dotnet/aspnet:6.0 AS base
WORKDIR /app
EXPOSE 5000

FROM mcr.microsoft.com/dotnet/sdk:6.0 AS build
WORKDIR /src
COPY WorldNewzWebAPI/WorldNewzWebAPI.csproj WorldNewzWebAPI/
RUN dotnet restore WorldNewzWebAPI/WorldNewzWebAPI.csproj
COPY . .
WORKDIR /src/WorldNewzWebAPI
RUN dotnet publish WorldNewzWebAPI.csproj -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "WorldNewzWebAPI.dll"]
