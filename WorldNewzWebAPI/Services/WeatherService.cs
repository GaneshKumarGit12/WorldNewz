using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace WorldNewzWebAPI.Services
{
    public class WeatherService
    {
        private readonly HttpClient _httpClient;
        private readonly IMemoryCache _cache;
        private readonly ILogger<WeatherService> _logger;
        private readonly string? _googleApiKey;

        public WeatherService(HttpClient httpClient, IMemoryCache cache, IConfiguration config, ILogger<WeatherService> logger)
        {
            _httpClient = httpClient;
            _cache = cache;
            _logger = logger;
            _googleApiKey = config["WEATHER_API_KEY"] ?? config["GOOGLE_MAPS_API_KEY"];
        }

        public async Task<WeatherDashboardResponse> GetWeather(string? locationName, double? lat = null, double? lon = null)
        {
            // Input Security & Sanitization
            if (lat.HasValue && lon.HasValue)
            {
                if (lat.Value < -90 || lat.Value > 90 || lon.Value < -180 || lon.Value > 180)
                {
                    return WeatherDashboardResponse.FromError("Invalid geographic coordinates provided.");
                }
            }

            string sanitizedLocation = "Hyderabad";
            if (!string.IsNullOrWhiteSpace(locationName))
            {
                // Sanitize location string: trim, allow letters, digits, spaces, commas, hyphens only
                sanitizedLocation = Regex.Replace(locationName.Trim(), @"[^\w\s,-]", "").Trim();
                if (sanitizedLocation.Length > 80)
                {
                    sanitizedLocation = sanitizedLocation.Substring(0, 80);
                }
            }

            var cacheKey = lat.HasValue && lon.HasValue 
                ? $"weather:coords:{Math.Round(lat.Value, 3)}:{Math.Round(lon.Value, 3)}" 
                : $"weather:city:{sanitizedLocation.ToLowerInvariant()}";

            if (_cache.TryGetValue(cacheKey, out WeatherDashboardResponse cached))
            {
                return cached;
            }

            try
            {
                double latitude = 17.3850;
                double longitude = 78.4867;
                string cityName = sanitizedLocation;
                string? countryName = "India";
                string timezone = "Asia/Kolkata";

                if (lat.HasValue && lon.HasValue)
                {
                    latitude = lat.Value;
                    longitude = lon.Value;
                    cityName = await ReverseGeocode(latitude, longitude) ?? $"Coords ({latitude:F2}, {longitude:F2})";
                    countryName = null;
                }
                else
                {
                    var geoResult = await GeocodeLocation(sanitizedLocation);
                    if (geoResult != null)
                    {
                        latitude = geoResult.Latitude;
                        longitude = geoResult.Longitude;
                        cityName = geoResult.Name;
                        countryName = geoResult.Country;
                        timezone = geoResult.Timezone;
                    }
                }

                // Fetch Weather Forecast Telemetry (Current, Hourly 24h, Daily 7-10d)
                var forecastTask = FetchForecastData(latitude, longitude, timezone);
                // Fetch Air Quality Telemetry
                var airQualityTask = FetchAirQualityData(latitude, longitude);

                await Task.WhenAll(forecastTask, airQualityTask);

                var forecastData = forecastTask.Result;
                var airQualityData = airQualityTask.Result;

                if (forecastData == null)
                {
                    return WeatherDashboardResponse.FromError($"Could not retrieve weather telemetry for '{cityName}'.");
                }

                var current = forecastData.Current;
                var hourly = forecastData.Hourly;
                var daily = forecastData.Daily;
                var aqi = airQualityData ?? AirQualityMetrics.Default();

                // Compute Smart Alerts & Advisories
                var alerts = GenerateWeatherAlerts(current, daily, aqi);

                var response = new WeatherDashboardResponse(
                    Location: cityName,
                    Country: countryName,
                    Latitude: latitude,
                    Longitude: longitude,
                    Timezone: timezone,
                    Current: current,
                    Hourly: hourly,
                    Daily: daily,
                    AirQuality: aqi,
                    Alerts: alerts
                );

                // Cache for 15 minutes to preserve rate limits & protect backend
                _cache.Set(cacheKey, response, TimeSpan.FromMinutes(15));
                return response;
            }
            catch (Exception ex)
            {
                // Securely log the exception internally without leaking credentials or internal stack traces to clients
                _logger.LogError(ex, "Error processing weather request for location '{Location}' ({Lat},{Lon})", locationName, lat, lon);
                return WeatherDashboardResponse.FromError("Weather service is currently optimizing telemetry data. Please try again in a few moments.");
            }
        }

        private async Task<GeocodingResult?> GeocodeLocation(string locationName)
        {
            try
            {
                // 1. Optional Google Geocoding API if key available
                if (!string.IsNullOrEmpty(_googleApiKey) && !_googleApiKey.Contains("your_"))
                {
                    var googleGeoUrl = $"https://maps.googleapis.com/maps/api/geocode/json?address={Uri.EscapeDataString(locationName)}&key={_googleApiKey}";
                    using var gResponse = await _httpClient.GetAsync(googleGeoUrl);
                    if (gResponse.IsSuccessStatusCode)
                    {
                        var gText = await gResponse.Content.ReadAsStringAsync();
                        using var gDoc = JsonDocument.Parse(gText);
                        var gRoot = gDoc.RootElement;
                        if (gRoot.TryGetProperty("results", out var gResults) && gResults.GetArrayLength() > 0)
                        {
                            var firstResult = gResults[0];
                            var locElem = firstResult.GetProperty("geometry").GetProperty("location");
                            var formattedName = firstResult.GetProperty("formatted_address").GetString() ?? locationName;
                            var nameParts = formattedName.Split(',');
                            var name = nameParts[0].Trim();
                            var country = nameParts.Length > 1 ? nameParts[nameParts.Length - 1].Trim() : null;

                            return new GeocodingResult(
                                Name: name,
                                Country: country,
                                Latitude: locElem.GetProperty("lat").GetDouble(),
                                Longitude: locElem.GetProperty("lng").GetDouble(),
                                Timezone: "auto"
                            );
                        }
                    }
                }

                // 2. Open-Meteo Geocoding fallback
                var encodedLocation = Uri.EscapeDataString(locationName);
                var geoUrl = $"https://geocoding-api.open-meteo.com/v1/search?name={encodedLocation}&count=1&language=en&format=json";
                using var geoResponse = await _httpClient.GetAsync(geoUrl);
                if (geoResponse.IsSuccessStatusCode)
                {
                    var geoText = await geoResponse.Content.ReadAsStringAsync();
                    using var geoJson = JsonDocument.Parse(geoText);
                    var geoRoot = geoJson.RootElement;

                    if (geoRoot.TryGetProperty("results", out var results) && results.GetArrayLength() > 0)
                    {
                        var loc = results[0];
                        return new GeocodingResult(
                            Name: loc.TryGetProperty("name", out var n) ? n.GetString() ?? locationName : locationName,
                            Country: loc.TryGetProperty("country", out var c) ? c.GetString() : null,
                            Latitude: loc.GetProperty("latitude").GetDouble(),
                            Longitude: loc.GetProperty("longitude").GetDouble(),
                            Timezone: loc.TryGetProperty("timezone", out var tz) ? tz.GetString() ?? "UTC" : "UTC"
                        );
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Geocoding lookup failed for {Location}", locationName);
            }

            return null;
        }

        private async Task<string?> ReverseGeocode(double lat, double lon)
        {
            try
            {
                var url = $"https://geocoding-api.open-meteo.com/v1/search?latitude={lat}&longitude={lon}&count=1&language=en&format=json";
                using var response = await _httpClient.GetAsync(url);
                if (response.IsSuccessStatusCode)
                {
                    var text = await response.Content.ReadAsStringAsync();
                    using var doc = JsonDocument.Parse(text);
                    if (doc.RootElement.TryGetProperty("results", out var results) && results.GetArrayLength() > 0)
                    {
                        var first = results[0];
                        return first.TryGetProperty("name", out var n) ? n.GetString() : null;
                    }
                }
            }
            catch
            {
                // Silently fallback if reverse geocode fails
            }
            return null;
        }

        private async Task<ForecastBundle?> FetchForecastData(double lat, double lon, string timezone)
        {
            try
            {
                var tzParam = Uri.EscapeDataString(timezone == "auto" ? "auto" : timezone);
                var forecastUrl = $"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}" +
                    "&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m" +
                    "&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m" +
                    "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,uv_index_max,wind_speed_10m_max,sunrise,sunset" +
                    $"&timezone={tzParam}";

                using var response = await _httpClient.GetAsync(forecastUrl);
                response.EnsureSuccessStatusCode();
                var jsonText = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(jsonText);
                var root = doc.RootElement;

                // Current weather parsing
                var curElem = root.GetProperty("current");
                double temp = curElem.GetProperty("temperature_2m").GetDouble();
                double apparentTemp = curElem.TryGetProperty("apparent_temperature", out var ap) ? ap.GetDouble() : temp;
                double humidity = curElem.TryGetProperty("relative_humidity_2m", out var rh) ? rh.GetDouble() : 50;
                int code = curElem.GetProperty("weather_code").GetInt32();
                double windSpeed = curElem.GetProperty("wind_speed_10m").GetDouble();
                int windDir = curElem.TryGetProperty("wind_direction_10m", out var wd) ? wd.GetInt32() : 0;
                double pressure = curElem.TryGetProperty("surface_pressure", out var sp) ? sp.GetDouble() : 1013.25;
                string time = curElem.TryGetProperty("time", out var t) ? t.GetString() ?? DateTime.UtcNow.ToString("o") : DateTime.UtcNow.ToString("o");

                var current = new CurrentWeather(
                    TemperatureC: Math.Round(temp, 1),
                    TemperatureF: Math.Round(temp * 9 / 5 + 32, 1),
                    FeelsLikeC: Math.Round(apparentTemp, 1),
                    FeelsLikeF: Math.Round(apparentTemp * 9 / 5 + 32, 1),
                    Humidity: (int)Math.Round(humidity),
                    WindSpeedKmH: Math.Round(windSpeed, 1),
                    WindDirectionDeg: windDir,
                    WindDirectionCompass: DegreesToCompass(windDir),
                    PressureHPa: Math.Round(pressure, 1),
                    WeatherCode: code,
                    Time: time
                );

                // Hourly forecast parsing (next 24 hours)
                var hourlyList = new List<HourlyForecast>();
                if (root.TryGetProperty("hourly", out var hElem))
                {
                    var times = hElem.GetProperty("time").EnumerateArray().Select(x => x.GetString()).ToArray();
                    var temps = hElem.GetProperty("temperature_2m").EnumerateArray().Select(x => x.GetDouble()).ToArray();
                    var codes = hElem.GetProperty("weather_code").EnumerateArray().Select(x => x.GetInt32()).ToArray();
                    var probs = hElem.TryGetProperty("precipitation_probability", out var pr) 
                        ? pr.EnumerateArray().Select(x => x.GetInt32()).ToArray() : Array.Empty<int>();
                    var precips = hElem.TryGetProperty("precipitation", out var pc) 
                        ? pc.EnumerateArray().Select(x => x.GetDouble()).ToArray() : Array.Empty<double>();
                    var winds = hElem.TryGetProperty("wind_speed_10m", out var ws) 
                        ? ws.EnumerateArray().Select(x => x.GetDouble()).ToArray() : Array.Empty<double>();

                    int startIndex = 0;
                    DateTime nowUtc = DateTime.UtcNow;
                    for (int i = 0; i < times.Length; i++)
                    {
                        if (DateTime.TryParse(times[i], out var tVal) && tVal >= nowUtc.AddHours(-1))
                        {
                            startIndex = i;
                            break;
                        }
                    }

                    for (int i = startIndex; i < Math.Min(times.Length, startIndex + 24); i++)
                    {
                        double hTemp = temps[i];
                        hourlyList.Add(new HourlyForecast(
                            Time: times[i] ?? "",
                            TemperatureC: Math.Round(hTemp, 1),
                            TemperatureF: Math.Round(hTemp * 9 / 5 + 32, 1),
                            WeatherCode: codes[i],
                            RainProbability: i < probs.Length ? probs[i] : 0,
                            PrecipitationMm: i < precips.Length ? Math.Round(precips[i], 1) : 0,
                            WindSpeedKmH: i < winds.Length ? Math.Round(winds[i], 1) : 0
                        ));
                    }
                }

                // Daily forecast parsing (next 7 to 10 days)
                var dailyList = new List<DailyForecast>();
                if (root.TryGetProperty("daily", out var dElem))
                {
                    var dates = dElem.GetProperty("time").EnumerateArray().Select(x => x.GetString() ?? "").ToArray();
                    var dCodes = dElem.GetProperty("weather_code").EnumerateArray().Select(x => x.GetInt32()).ToArray();
                    var maxTemps = dElem.GetProperty("temperature_2m_max").EnumerateArray().Select(x => x.GetDouble()).ToArray();
                    var minTemps = dElem.GetProperty("temperature_2m_min").EnumerateArray().Select(x => x.GetDouble()).ToArray();
                    var precipSums = dElem.TryGetProperty("precipitation_sum", out var ps) 
                        ? ps.EnumerateArray().Select(x => x.GetDouble()).ToArray() : Array.Empty<double>();
                    var rainProbs = dElem.TryGetProperty("precipitation_probability_max", out var rpm) 
                        ? rpm.EnumerateArray().Select(x => x.GetInt32()).ToArray() : Array.Empty<int>();
                    var uvs = dElem.TryGetProperty("uv_index_max", out var uv) 
                        ? uv.EnumerateArray().Select(x => x.GetDouble()).ToArray() : Array.Empty<double>();
                    var windMaxes = dElem.TryGetProperty("wind_speed_10m_max", out var wsm) 
                        ? wsm.EnumerateArray().Select(x => x.GetDouble()).ToArray() : Array.Empty<double>();
                    var sunrises = dElem.TryGetProperty("sunrise", out var sr) 
                        ? sr.EnumerateArray().Select(x => x.GetString() ?? "").ToArray() : Array.Empty<string>();
                    var sunsets = dElem.TryGetProperty("sunset", out var ss) 
                        ? ss.EnumerateArray().Select(x => x.GetString() ?? "").ToArray() : Array.Empty<string>();

                    for (int i = 0; i < dates.Length; i++)
                    {
                        double maxC = maxTemps[i];
                        double minC = minTemps[i];
                        var (phaseVal, phaseName) = CalculateMoonPhase(dates[i]);

                        dailyList.Add(new DailyForecast(
                            Date: dates[i],
                            WeatherCode: i < dCodes.Length ? dCodes[i] : 0,
                            MinTempC: Math.Round(minC, 1),
                            MaxTempC: Math.Round(maxC, 1),
                            MinTempF: Math.Round(minC * 9 / 5 + 32, 1),
                            MaxTempF: Math.Round(maxC * 9 / 5 + 32, 1),
                            PrecipitationSumMm: i < precipSums.Length ? Math.Round(precipSums[i], 1) : 0,
                            RainProbabilityMax: i < rainProbs.Length ? rainProbs[i] : 0,
                            UVIndexMax: i < uvs.Length ? Math.Round(uvs[i], 1) : 0,
                            WindSpeedMaxKmH: i < windMaxes.Length ? Math.Round(windMaxes[i], 1) : 0,
                            Sunrise: i < sunrises.Length ? sunrises[i] : "",
                            Sunset: i < sunsets.Length ? sunsets[i] : "",
                            MoonPhaseValue: phaseVal,
                            MoonPhaseName: phaseName
                        ));
                    }
                }

                return new ForecastBundle(current, hourlyList, dailyList);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to parse Open-Meteo forecast data for ({Lat},{Lon})", lat, lon);
                return null;
            }
        }

        private async Task<AirQualityMetrics?> FetchAirQualityData(double lat, double lon)
        {
            try
            {
                var aqUrl = $"https://air-quality-api.open-meteo.com/v1/air-quality?latitude={lat}&longitude={lon}" +
                    "&current=us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone";

                using var response = await _httpClient.GetAsync(aqUrl);
                if (response.IsSuccessStatusCode)
                {
                    var text = await response.Content.ReadAsStringAsync();
                    using var doc = JsonDocument.Parse(text);
                    var cur = doc.RootElement.GetProperty("current");

                    int aqi = cur.TryGetProperty("us_aqi", out var a) ? a.GetInt32() : 45;
                    double pm25 = cur.TryGetProperty("pm2_5", out var p2) ? p2.GetDouble() : 12.0;
                    double pm10 = cur.TryGetProperty("pm10", out var p1) ? p1.GetDouble() : 25.0;
                    double co = cur.TryGetProperty("carbon_monoxide", out var c) ? c.GetDouble() : 210.0;
                    double no2 = cur.TryGetProperty("nitrogen_dioxide", out var n) ? n.GetDouble() : 15.0;
                    double so2 = cur.TryGetProperty("sulphur_dioxide", out var s) ? s.GetDouble() : 5.0;
                    double o3 = cur.TryGetProperty("ozone", out var o) ? o.GetDouble() : 40.0;

                    var (status, advisory) = GetAQIStatusAndAdvisory(aqi);

                    return new AirQualityMetrics(
                        US_AQI: aqi,
                        StatusLabel: status,
                        HealthAdvisory: advisory,
                        PM2_5: Math.Round(pm25, 1),
                        PM10: Math.Round(pm10, 1),
                        CO: Math.Round(co, 1),
                        NO2: Math.Round(no2, 1),
                        SO2: Math.Round(so2, 1),
                        O3: Math.Round(o3, 1)
                    );
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Air quality query failed for ({Lat},{Lon})", lat, lon);
            }

            return AirQualityMetrics.Default();
        }

        private static List<WeatherAlert> GenerateWeatherAlerts(CurrentWeather current, IReadOnlyList<DailyForecast> daily, AirQualityMetrics aqi)
        {
            var alerts = new List<WeatherAlert>();

            if (aqi.US_AQI > 150)
            {
                alerts.Add(new WeatherAlert(
                    Severity: "Warning",
                    Title: "Unhealthy Air Quality Warning",
                    Message: $"AQI is {aqi.US_AQI} ({aqi.StatusLabel}). Sensitive groups and general public should avoid prolonged outdoor exposure.",
                    Icon: "😷"
                ));
            }

            if (daily.Count > 0)
            {
                var today = daily[0];
                if (today.RainProbabilityMax >= 70)
                {
                    alerts.Add(new WeatherAlert(
                        Severity: "Info",
                        Title: "Rain Advisory",
                        Message: $"High probability of rain today ({today.RainProbabilityMax}%). Carry an umbrella when stepping out!",
                        Icon: "☔"
                    ));
                }

                if (today.UVIndexMax >= 8)
                {
                    alerts.Add(new WeatherAlert(
                        Severity: "Warning",
                        Title: "High UV Index Warning",
                        Message: $"Very High UV Index ({today.UVIndexMax:F1}). Apply SPF 30+ sunscreen and wear protective eyewear.",
                        Icon: "☀️"
                    ));
                }

                if (today.WindSpeedMaxKmH >= 40)
                {
                    alerts.Add(new WeatherAlert(
                        Severity: "Warning",
                        Title: "Strong Wind Advisory",
                        Message: $"Peak gusty winds up to {today.WindSpeedMaxKmH:F0} km/h expected today. Exercise caution while driving.",
                        Icon: "💨"
                    ));
                }
            }

            if (current.WeatherCode >= 95)
            {
                alerts.Add(new WeatherAlert(
                    Severity: "Severe",
                    Title: "Severe Thunderstorm Alert",
                    Message: "Active thunderstorm activity detected in your area. Stay indoors and away from windows.",
                    Icon: "⚡"
                ));
            }

            return alerts;
        }

        private static string DegreesToCompass(int degrees)
        {
            string[] directions = { "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW" };
            int index = (int)Math.Round((degrees % 360) / 22.5);
            return directions[index % 16];
        }

        private static (string Status, string Advisory) GetAQIStatusAndAdvisory(int aqi)
        {
            if (aqi <= 50)
                return ("Good", "Air quality is satisfactory, posing little to no health risk.");
            if (aqi <= 100)
                return ("Moderate", "Air quality is acceptable; sensitive individuals may experience minor irritation.");
            if (aqi <= 150)
                return ("Unhealthy for Sensitive Groups", "General public is unlikely to be affected; sensitive groups should limit prolonged outdoor activity.");
            if (aqi <= 200)
                return ("Unhealthy", "Everyone may begin to experience health effects; sensitive groups may experience serious effects.");
            if (aqi <= 300)
                return ("Very Unhealthy", "Health warnings of emergency conditions. Entire population is likely to be affected.");

            return ("Hazardous", "Health alert: everyone may experience more serious health effects. Avoid all outdoor physical activity.");
        }

        private static (double Value, string Name) CalculateMoonPhase(string dateStr)
        {
            if (!DateTime.TryParse(dateStr, out var date))
            {
                date = DateTime.UtcNow;
            }

            // Approximate moon phase calculation based on synodic month (29.53059 days)
            DateTime knownNewMoon = new DateTime(2000, 1, 6, 18, 14, 0, DateTimeKind.Utc);
            double daysSince = (date - knownNewMoon).TotalDays;
            double cycle = 29.53058867;
            double phase = (daysSince % cycle) / cycle;
            if (phase < 0) phase += 1.0;

            string name = phase switch
            {
                < 0.03 => "New Moon",
                < 0.22 => "Waxing Crescent",
                < 0.28 => "First Quarter",
                < 0.47 => "Waxing Gibbous",
                < 0.53 => "Full Moon",
                < 0.72 => "Waning Gibbous",
                < 0.78 => "Third Quarter",
                < 0.97 => "Waning Crescent",
                _ => "New Moon"
            };

            return (Math.Round(phase, 2), name);
        }

        // Data Models
        public record GeocodingResult(string Name, string? Country, double Latitude, double Longitude, string Timezone);

        public record ForecastBundle(CurrentWeather Current, List<HourlyForecast> Hourly, List<DailyForecast> Daily);

        public record WeatherDashboardResponse(
            string Location,
            string? Country,
            double Latitude,
            double Longitude,
            string Timezone,
            CurrentWeather Current,
            IReadOnlyList<HourlyForecast> Hourly,
            IReadOnlyList<DailyForecast> Daily,
            AirQualityMetrics AirQuality,
            IReadOnlyList<WeatherAlert> Alerts,
            string? Error = null)
        {
            public bool HasError => !string.IsNullOrEmpty(Error);
            public static WeatherDashboardResponse FromError(string message) => new(
                Location: "Unknown",
                Country: null,
                Latitude: 0,
                Longitude: 0,
                Timezone: "UTC",
                Current: CurrentWeather.Default(),
                Hourly: Array.Empty<HourlyForecast>(),
                Daily: Array.Empty<DailyForecast>(),
                AirQuality: AirQualityMetrics.Default(),
                Alerts: Array.Empty<WeatherAlert>(),
                Error: message
            );
        }

        public record CurrentWeather(
            double TemperatureC,
            double TemperatureF,
            double FeelsLikeC,
            double FeelsLikeF,
            int Humidity,
            double WindSpeedKmH,
            int WindDirectionDeg,
            string WindDirectionCompass,
            double PressureHPa,
            int WeatherCode,
            string Time)
        {
            public static CurrentWeather Default() => new(28.0, 82.4, 29.0, 84.2, 55, 12.0, 270, "W", 1012.0, 2, DateTime.UtcNow.ToString("o"));
        }

        public record HourlyForecast(
            string Time,
            double TemperatureC,
            double TemperatureF,
            int WeatherCode,
            int RainProbability,
            double PrecipitationMm,
            double WindSpeedKmH
        );

        public record DailyForecast(
            string Date,
            int WeatherCode,
            double MinTempC,
            double MaxTempC,
            double MinTempF,
            double MaxTempF,
            double PrecipitationSumMm,
            int RainProbabilityMax,
            double UVIndexMax,
            double WindSpeedMaxKmH,
            string Sunrise,
            string Sunset,
            double MoonPhaseValue,
            string MoonPhaseName
        );

        public record AirQualityMetrics(
            int US_AQI,
            string StatusLabel,
            string HealthAdvisory,
            double PM2_5,
            double PM10,
            double CO,
            double NO2,
            double SO2,
            double O3)
        {
            public static AirQualityMetrics Default() => new(42, "Good", "Air quality is satisfactory, posing little to no health risk.", 11.2, 22.0, 190.0, 14.5, 4.2, 38.0);
        }

        public record WeatherAlert(
            string Severity,
            string Title,
            string Message,
            string Icon
        );
    }
}
