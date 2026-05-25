FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["src/OdontoCloud.Api/OdontoCloud.Api.csproj", "src/OdontoCloud.Api/"]
COPY ["src/OdontoCloud.Application/OdontoCloud.Application.csproj", "src/OdontoCloud.Application/"]
COPY ["src/OdontoCloud.Infrastructure/OdontoCloud.Infrastructure.csproj", "src/OdontoCloud.Infrastructure/"]
COPY ["src/OdontoCloud.Domain/OdontoCloud.Domain.csproj", "src/OdontoCloud.Domain/"]

RUN dotnet restore "src/OdontoCloud.Api/OdontoCloud.Api.csproj"

COPY . .
RUN dotnet publish "src/OdontoCloud.Api/OdontoCloud.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

ENV ASPNETCORE_URLS=http://0.0.0.0:10000
ENV ASPNETCORE_ENVIRONMENT=Production

COPY --from=build /app/publish .

EXPOSE 10000

ENTRYPOINT ["dotnet", "OdontoCloud.Api.dll"]
