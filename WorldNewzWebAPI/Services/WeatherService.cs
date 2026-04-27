using System.Net.Http;
using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;

namespace WorldNewzWebAPI.Services
{
    public class WeatherService
    {
        private readonly HttpClient _httpClient;
        private readonly IMemoryCache _cache;

        public WeatherService(HttpClient httpClient, IMemoryCache cache)
        {
            _httpClient = httpClient;
            _cache = cache;
        }

        public async Task<WeatherDashboardResponse> GetWeather(string locationName)
        {
            if (string.IsNullOrWhiteSpace(locationName))
            {
                return WeatherDashboardResponse.FromError("City is required for weather lookup.");
            }

            var cacheKey = $"weather:{locationName.Trim().ToLowerInvariant()}";
            if (_cache.TryGetValue(cacheKey, out WeatherDashboardResponse cached))
            {
                return cached;
            }

            try
            {
                var encodedLocation = Uri.EscapeDataString(locationName);
                var geoUrl = $"https://geocoding-api.open-meteo.com/v1/search?name={encodedLocation}&count=1&language=en&format=json";
                using var geoResponse = await _httpClient.GetAsync(geoUrl);
                geoResponse.EnsureSuccessStatusCode();
                var geoResponseText = await geoResponse.Content.ReadAsStringAsync();
                using var geoJson = JsonDocument.Parse(geoResponseText);
                var geoRoot = geoJson.RootElement;

                if (!geoRoot.TryGetProperty("results", out var results) || results.GetArrayLength() == 0)
                {
                    return WeatherDashboardResponse.FromError($"Could not find location '{locationName}'.");
                }

                var location = results[0];
                var latitude = location.GetProperty("latitude").GetDouble();
                var longitude = location.GetProperty("longitude").GetDouble();
                var name = location.TryGetProperty("name", out var nameElement) ? nameElement.GetString() ?? locationName : locationName;
                var country = location.TryGetProperty("country", out var countryElement) ? countryElement.GetString() : null;
                var timezone = location.TryGetProperty("timezone", out var timezoneElement) ? timezoneElement.GetString() ?? "UTC" : "UTC";

                var forecastUrl = $"https://api.open-meteo.com/v1/forecast?latitude={latitude}&longitude={longitude}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,uv_index_max,windspeed_10m_max,sunrise,sunset&timezone=auto";
                using var forecastResponse = await _httpClient.GetAsync(forecastUrl);
                forecastResponse.EnsureSuccessStatusCode();
                var forecastResponseText = await forecastResponse.Content.ReadAsStringAsync();
                using var forecastJson = JsonDocument.Parse(forecastResponseText);
                var forecastRoot = forecastJson.RootElement;

                var currentWeatherElement = forecastRoot.GetProperty("current_weather");
                var currentWeather = new CurrentWeather(
                    Temperature: currentWeatherElement.GetProperty("temperature").GetDouble(),
                    WindSpeed: currentWeatherElement.GetProperty("windspeed").GetDouble(),
                    WeatherCode: currentWeatherElement.GetProperty("weathercode").GetInt32(),
                    Time: currentWeatherElement.GetProperty("time").GetString() ?? string.Empty
                );

                var dailyElement = forecastRoot.GetProperty("daily");
                var dates = dailyElement.GetProperty("time").EnumerateArray().Select(x => x.GetString() ?? string.Empty).ToArray();
                var weatherCodes = dailyElement.GetProperty("weathercode").EnumerateArray().Select(x => x.GetInt32()).ToArray();
                var minTemps = dailyElement.GetProperty("temperature_2m_min").EnumerateArray().Select(x => x.GetDouble()).ToArray();
                var maxTemps = dailyElement.GetProperty("temperature_2m_max").EnumerateArray().Select(x => x.GetDouble()).ToArray();
                var precipitationSums = dailyElement.GetProperty("precipitation_sum").EnumerateArray().Select(x => x.GetDouble()).ToArray();
                var uvIndexes = dailyElement.GetProperty("uv_index_max").EnumerateArray().Select(x => x.GetDouble()).ToArray();
                var windSpeedMaxValues = dailyElement.GetProperty("windspeed_10m_max").EnumerateArray().Select(x => x.GetDouble()).ToArray();
                var sunrises = dailyElement.GetProperty("sunrise").EnumerateArray().Select(x => x.GetString() ?? string.Empty).ToArray();
                var sunsets = dailyElement.GetProperty("sunset").EnumerateArray().Select(x => x.GetString() ?? string.Empty).ToArray();

                var dailyForecasts = new List<DailyForecast>();
                for (var i = 0; i < dates.Length; i++)
                {
                    dailyForecasts.Add(new DailyForecast(
                        Date: dates[i],
                        WeatherCode: i < weatherCodes.Length ? weatherCodes[i] : 0,
                        MinTemp: i < minTemps.Length ? minTemps[i] : 0,
                        MaxTemp: i < maxTemps.Length ? maxTemps[i] : 0,
                        PrecipitationSum: i < precipitationSums.Length ? precipitationSums[i] : 0,
                        UVIndex: i < uvIndexes.Length ? uvIndexes[i] : 0,
                        WindSpeedMax: i < windSpeedMaxValues.Length ? windSpeedMaxValues[i] : 0,
                        Sunrise: i < sunrises.Length ? sunrises[i] : string.Empty,
                        Sunset: i < sunsets.Length ? sunsets[i] : string.Empty
                    ));
                }

                var response = new WeatherDashboardResponse(
                    Location: name,
                    Country: country,
                    Latitude: latitude,
                    Longitude: longitude,
                    Timezone: timezone,
                    Current: currentWeather,
                    Daily: dailyForecasts
                );

                _cache.Set(cacheKey, response, TimeSpan.FromMinutes(15));
                return response;
            }
            catch (Exception ex)
            {
                return WeatherDashboardResponse.FromError($"Error fetching weather: {ex.Message}");
            }
        }

        public record WeatherDashboardResponse(
            string Location,
            string? Country,
            double Latitude,
            double Longitude,
            string Timezone,
            CurrentWeather Current,
            IReadOnlyList<DailyForecast> Daily,
            string? Error = null)
        {
            public bool HasError => !string.IsNullOrEmpty(Error);
            public static WeatherDashboardResponse FromError(string message) => new(
                Location: "Unknown",
                Country: null,
                Latitude: 0,
                Longitude: 0,
                Timezone: "UTC",
                Current: new CurrentWeather(0, 0, 0, string.Empty),
                Daily: Array.Empty<DailyForecast>(),
                Error: message
            );
        }

        public record CurrentWeather(double Temperature, double WindSpeed, int WeatherCode, string Time);

        public record DailyForecast(
            string Date,
            int WeatherCode,
            double MinTemp,
            double MaxTemp,
            double PrecipitationSum,
            double UVIndex,
            double WindSpeedMax,
            string Sunrise,
            string Sunset
        );
    }
}
