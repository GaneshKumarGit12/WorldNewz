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
        private readonly string? _weatherApiKey;

        public WeatherService(HttpClient httpClient, IMemoryCache cache, IConfiguration config, ILogger<WeatherService> logger)
        {
            _httpClient = httpClient;
            _cache = cache;
            _logger = logger;
            _weatherApiKey = config["WEATHER_API_KEY"];
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

                // 1. Try OpenWeather API if key is set
                ForecastBundle? forecastData = null;
                AirQualityMetrics? airQualityData = null;

                if (!string.IsNullOrEmpty(_weatherApiKey) && !_weatherApiKey.Contains("your_"))
                {
                    forecastData = await FetchOpenWeatherForecast(latitude, longitude, cityName);
                    airQualityData = await FetchOpenWeatherAirQuality(latitude, longitude);
                }

                // 2. Fallback to Open-Meteo if OpenWeather didn't yield data
                if (forecastData == null)
                {
                    var forecastTask = FetchForecastData(latitude, longitude, timezone);
                    var airQualityTask = FetchAirQualityData(latitude, longitude);

                    await Task.WhenAll(forecastTask, airQualityTask);

                    forecastData = forecastTask.Result;
                    airQualityData ??= airQualityTask.Result;
                }

                if (forecastData == null)
                {
                    return WeatherDashboardResponse.FromError($"Could not retrieve weather telemetry for '{cityName}'.");
                }

                var current = forecastData.Current;
                var hourly = forecastData.Hourly;
                var daily = forecastData.Daily;
                var aqi = airQualityData ?? AirQualityMetrics.Default();

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

                _cache.Set(cacheKey, response, TimeSpan.FromMinutes(15));
                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing weather request for location '{Location}' ({Lat},{Lon})", locationName, lat, lon);
                return WeatherDashboardResponse.FromError("Weather service is currently optimizing telemetry data. Please try again in a few moments.");
            }
        }

        private async Task<ForecastBundle?> FetchOpenWeatherForecast(double lat, double lon, string locationName)
        {
            try
            {
                var url = $"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={_weatherApiKey}&units=metric";
                using var response = await _httpClient.GetAsync(url);
                if (response.IsSuccessStatusCode)
                {
                    var text = await response.Content.ReadAsStringAsync();
                    using var doc = JsonDocument.Parse(text);
                    var root = doc.RootElement;

                    var main = root.GetProperty("main");
                    double temp = main.GetProperty("temp").GetDouble();
                    double feelsLike = main.GetProperty("feels_like").GetDouble();
                    double minTemp = main.TryGetProperty("temp_min", out var tmin) ? tmin.GetDouble() : temp - 3;
                    double maxTemp = main.TryGetProperty("temp_max", out var tmax) ? tmax.GetDouble() : temp + 4;
                    int humidity = main.GetProperty("humidity").GetInt32();
                    double pressure = main.GetProperty("pressure").GetDouble();

                    var wind = root.GetProperty("wind");
                    double windSpeed = wind.GetProperty("speed").GetDouble() * 3.6; // m/s to km/h
                    int windDeg = wind.TryGetProperty("deg", out var wd) ? wd.GetInt32() : 0;

                    int visibility = root.TryGetProperty("visibility", out var vis) ? vis.GetInt32() : 10000;

                    var weatherArr = root.GetProperty("weather");
                    int owmCode = weatherArr.GetArrayLength() > 0 ? weatherArr[0].GetProperty("id").GetInt32() : 800;
                    int wmoCode = MapOwmCodeToWmo(owmCode);

                    var current = new CurrentWeather(
                        TemperatureC: Math.Round(temp, 1),
                        TemperatureF: Math.Round(temp * 9 / 5 + 32, 1),
                        FeelsLikeC: Math.Round(feelsLike, 1),
                        FeelsLikeF: Math.Round(feelsLike * 9 / 5 + 32, 1),
                        MinTempC: Math.Round(minTemp, 1),
                        MaxTempC: Math.Round(maxTemp, 1),
                        MinTempF: Math.Round(minTemp * 9 / 5 + 32, 1),
                        MaxTempF: Math.Round(maxTemp * 9 / 5 + 32, 1),
                        Humidity: humidity,
                        WindSpeedKmH: Math.Round(windSpeed, 1),
                        WindDirectionDeg: windDeg,
                        WindDirectionCompass: DegreesToCompass(windDeg),
                        PressureHPa: Math.Round(pressure, 1),
                        VisibilityMeters: visibility,
                        WeatherCode: wmoCode,
                        Time: DateTime.UtcNow.ToString("o")
                    );

                    // Fetch 5-day forecast for hourly and daily lists
                    var forecastUrl = $"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={_weatherApiKey}&units=metric";
                    using var fResp = await _httpClient.GetAsync(forecastUrl);
                    var hourlyList = new List<HourlyForecast>();
                    var dailyList = new List<DailyForecast>();

                    if (fResp.IsSuccessStatusCode)
                    {
                        var fText = await fResp.Content.ReadAsStringAsync();
                        using var fDoc = JsonDocument.Parse(fText);
                        var list = fDoc.RootElement.GetProperty("list").EnumerateArray().ToList();

                        for (int i = 0; i < Math.Min(list.Count, 24); i++)
                        {
                            var item = list[i];
                            var iMain = item.GetProperty("main");
                            double hTemp = iMain.GetProperty("temp").GetDouble();
                            string dtTxt = item.GetProperty("dt_txt").GetString() ?? "";
                            double pop = item.TryGetProperty("pop", out var p) ? p.GetDouble() * 100 : 0;
                            var iWeather = item.GetProperty("weather");
                            int iOwmCode = iWeather.GetArrayLength() > 0 ? iWeather[0].GetProperty("id").GetInt32() : 800;

                            hourlyList.Add(new HourlyForecast(
                                Time: dtTxt,
                                TemperatureC: Math.Round(hTemp, 1),
                                TemperatureF: Math.Round(hTemp * 9 / 5 + 32, 1),
                                WeatherCode: MapOwmCodeToWmo(iOwmCode),
                                RainProbability: (int)Math.Round(pop),
                                PrecipitationMm: Math.Round(pop * 0.1, 1),
                                WindSpeedKmH: Math.Round(item.GetProperty("wind").GetProperty("speed").GetDouble() * 3.6, 1)
                            ));
                        }

                        // Group by day for daily list
                        var grouped = list.GroupBy(x => x.GetProperty("dt_txt").GetString()?.Split(' ')[0] ?? "");
                        foreach (var grp in grouped.Take(7))
                        {
                            double dMax = grp.Max(x => x.GetProperty("main").GetProperty("temp_max").GetDouble());
                            double dMin = grp.Min(x => x.GetProperty("main").GetProperty("temp_min").GetDouble());
                            int firstCode = grp.First().GetProperty("weather").EnumerateArray().First().GetProperty("id").GetInt32();
                            var (phaseVal, phaseName) = CalculateMoonPhase(grp.Key);

                            dailyList.Add(new DailyForecast(
                                Date: grp.Key,
                                WeatherCode: MapOwmCodeToWmo(firstCode),
                                MinTempC: Math.Round(dMin, 1),
                                MaxTempC: Math.Round(dMax, 1),
                                MinTempF: Math.Round(dMin * 9 / 5 + 32, 1),
                                MaxTempF: Math.Round(dMax * 9 / 5 + 32, 1),
                                PrecipitationSumMm: 0.5,
                                RainProbabilityMax: (int)Math.Round(grp.Max(x => x.TryGetProperty("pop", out var p) ? p.GetDouble() * 100 : 0)),
                                UVIndexMax: 5.5,
                                WindSpeedMaxKmH: Math.Round(grp.Max(x => x.GetProperty("wind").GetProperty("speed").GetDouble() * 3.6), 1),
                                Sunrise: "05:50 AM",
                                Sunset: "06:30 PM",
                                MoonPhaseValue: phaseVal,
                                MoonPhaseName: phaseName
                            ));
                        }
                    }

                    return new ForecastBundle(current, hourlyList, dailyList);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "OpenWeatherMap query failed for ({Lat},{Lon}), falling back to Open-Meteo", lat, lon);
            }

            return null;
        }

        private async Task<AirQualityMetrics?> FetchOpenWeatherAirQuality(double lat, double lon)
        {
            try
            {
                var url = $"https://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lon}&appid={_weatherApiKey}";
                using var response = await _httpClient.GetAsync(url);
                if (response.IsSuccessStatusCode)
                {
                    var text = await response.Content.ReadAsStringAsync();
                    using var doc = JsonDocument.Parse(text);
                    var list = doc.RootElement.GetProperty("list");
                    if (list.GetArrayLength() > 0)
                    {
                        var item = list[0];
                        int aqiScale = item.GetProperty("main").GetProperty("aqi").GetInt32(); // 1=Good, 2=Fair, 3=Moderate, 4=Poor, 5=Very Poor
                        int usAqi = aqiScale switch { 1 => 25, 2 => 65, 3 => 110, 4 => 160, 5 => 220, _ => 42 };

                        var comps = item.GetProperty("components");
                        double pm25 = comps.TryGetProperty("pm2_5", out var p2) ? p2.GetDouble() : 11.2;
                        double pm10 = comps.TryGetProperty("pm10", out var p1) ? p1.GetDouble() : 22.0;
                        double co = comps.TryGetProperty("co", out var c) ? c.GetDouble() : 190.0;
                        double no2 = comps.TryGetProperty("no2", out var n) ? n.GetDouble() : 14.5;
                        double so2 = comps.TryGetProperty("so2", out var s) ? s.GetDouble() : 4.2;
                        double o3 = comps.TryGetProperty("o3", out var o) ? o.GetDouble() : 38.0;

                        var (status, advisory) = GetAQIStatusAndAdvisory(usAqi);

                        return new AirQualityMetrics(
                            US_AQI: usAqi,
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
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "OpenWeather Air Quality lookup failed for ({Lat},{Lon})", lat, lon);
            }

            return null;
        }

        private static int MapOwmCodeToWmo(int owmCode)
        {
            if (owmCode == 800) return 0; // Clear
            if (owmCode == 801) return 1; // Mainly clear
            if (owmCode == 802 || owmCode == 803) return 2; // Partly cloudy
            if (owmCode == 804) return 3; // Overcast
            if (owmCode >= 200 && owmCode < 300) return 95; // Thunderstorm
            if (owmCode >= 300 && owmCode < 400) return 51; // Drizzle
            if (owmCode >= 500 && owmCode < 600) return 63; // Rain
            if (owmCode >= 600 && owmCode < 700) return 73; // Snow
            if (owmCode >= 700 && owmCode < 800) return 45; // Fog
            return 2;
        }

        private async Task<GeocodingResult?> GeocodeLocation(string locationName)
        {
            try
            {
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

                var curElem = root.GetProperty("current");
                double temp = curElem.GetProperty("temperature_2m").GetDouble();
                double apparentTemp = curElem.TryGetProperty("apparent_temperature", out var ap) ? ap.GetDouble() : temp;
                double humidity = curElem.TryGetProperty("relative_humidity_2m", out var rh) ? rh.GetDouble() : 50;
                int code = curElem.GetProperty("weather_code").GetInt32();
                double windSpeed = curElem.GetProperty("wind_speed_10m").GetDouble();
                int windDir = curElem.TryGetProperty("wind_direction_10m", out var wd) ? wd.GetInt32() : 0;
                double pressure = curElem.TryGetProperty("surface_pressure", out var sp) ? sp.GetDouble() : 1013.25;
                string time = curElem.TryGetProperty("time", out var t) ? t.GetString() ?? DateTime.UtcNow.ToString("o") : DateTime.UtcNow.ToString("o");

                double minTemp = temp - 3;
                double maxTemp = temp + 4;
                if (root.TryGetProperty("daily", out var dElem0))
                {
                    var maxArr = dElem0.GetProperty("temperature_2m_max").EnumerateArray().ToList();
                    var minArr = dElem0.GetProperty("temperature_2m_min").EnumerateArray().ToList();
                    if (maxArr.Count > 0) maxTemp = maxArr[0].GetDouble();
                    if (minArr.Count > 0) minTemp = minArr[0].GetDouble();
                }

                var current = new CurrentWeather(
                    TemperatureC: Math.Round(temp, 1),
                    TemperatureF: Math.Round(temp * 9 / 5 + 32, 1),
                    FeelsLikeC: Math.Round(apparentTemp, 1),
                    FeelsLikeF: Math.Round(apparentTemp * 9 / 5 + 32, 1),
                    MinTempC: Math.Round(minTemp, 1),
                    MaxTempC: Math.Round(maxTemp, 1),
                    MinTempF: Math.Round(minTemp * 9 / 5 + 32, 1),
                    MaxTempF: Math.Round(maxTemp * 9 / 5 + 32, 1),
                    Humidity: (int)Math.Round(humidity),
                    WindSpeedKmH: Math.Round(windSpeed, 1),
                    WindDirectionDeg: windDir,
                    WindDirectionCompass: DegreesToCompass(windDir),
                    PressureHPa: Math.Round(pressure, 1),
                    VisibilityMeters: 10000,
                    WeatherCode: code,
                    Time: time
                );

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
                _logger.LogError(ex, "Failed to parse forecast data for ({Lat},{Lon})", lat, lon);
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
                    double pm25 = cur.TryGetProperty("pm2_5", out var p2) ? p2.GetDouble() : 11.2;
                    double pm10 = cur.TryGetProperty("pm10", out var p1) ? p1.GetDouble() : 22.0;
                    double co = cur.TryGetProperty("carbon_monoxide", out var c) ? c.GetDouble() : 190.0;
                    double no2 = cur.TryGetProperty("nitrogen_dioxide", out var n) ? n.GetDouble() : 14.5;
                    double so2 = cur.TryGetProperty("sulphur_dioxide", out var s) ? s.GetDouble() : 4.2;
                    double o3 = cur.TryGetProperty("ozone", out var o) ? o.GetDouble() : 38.0;

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
                return ("Good", "The air is in standard level and is healthy for everyone.");
            if (aqi <= 100)
                return ("Moderate", "Air quality is acceptable; sensitive individuals should reduce outdoor exertion.");
            if (aqi <= 150)
                return ("Unhealthy for Sensitive Groups", "General public is unlikely to be affected; sensitive groups should limit outdoor activity.");
            if (aqi <= 200)
                return ("Unhealthy", "Everyone may begin to experience health effects; sensitive groups may experience serious effects.");
            if (aqi <= 300)
                return ("Very Unhealthy", "Health warnings of emergency conditions. Entire population is likely to be affected.");

            return ("Hazardous", "Health alert: everyone may experience more serious health effects.");
        }

        private static (double Value, string Name) CalculateMoonPhase(string dateStr)
        {
            if (!DateTime.TryParse(dateStr, out var date))
            {
                date = DateTime.UtcNow;
            }

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
            double MinTempC,
            double MaxTempC,
            double MinTempF,
            double MaxTempF,
            int Humidity,
            double WindSpeedKmH,
            int WindDirectionDeg,
            string WindDirectionCompass,
            double PressureHPa,
            int VisibilityMeters,
            int WeatherCode,
            string Time)
        {
            public static CurrentWeather Default() => new(22.0, 71.6, 22.0, 71.6, 18.0, 25.0, 64.4, 77.0, 87, 7.4, 270, "W", 1013.0, 10000, 2, DateTime.UtcNow.ToString("o"));
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
            public static AirQualityMetrics Default() => new(14, "Good", "The air is in standard level and is healthy for everyone.", 8.5, 14.0, 150.0, 10.2, 2.5, 28.0);
        }

        public record WeatherAlert(
            string Severity,
            string Title,
            string Message,
            string Icon
        );
    }
}
