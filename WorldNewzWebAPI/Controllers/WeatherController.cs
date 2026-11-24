using System;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using WorldNewzWebAPI.Services;

namespace WorldNewzWebAPI.Controllers
{
    [ApiController]
    [Route("api/news")]
    public class WeatherController : ControllerBase
    {
        private readonly WeatherService _weatherService;
        private readonly HttpClient _httpClient;
        private readonly IMemoryCache _cache;

        public WeatherController(WeatherService weatherService, IHttpClientFactory httpClientFactory, IMemoryCache cache)
        {
            _weatherService = weatherService;
            _httpClient = httpClientFactory.CreateClient();
            _cache = cache;
        }

        [HttpGet("weather")]
        public async Task<IActionResult> GetWeather([FromQuery] string? city, [FromQuery] double? lat, [FromQuery] double? lon)
        {
            // If GPS coordinates provided directly by browser auto-detect
            if (lat.HasValue && lon.HasValue)
            {
                if (lat.Value >= -90 && lat.Value <= 90 && lon.Value >= -180 && lon.Value <= 180)
                {
                    var coordResult = await _weatherService.GetWeather(null, lat.Value, lon.Value);
                    Response.Headers.CacheControl = "public, max-age=900";
                    return Ok(coordResult);
                }
            }

            var defaultCity = "Hyderabad";
            var lookupCity = string.IsNullOrWhiteSpace(city) ? null : city.Trim();

            if (string.IsNullOrWhiteSpace(lookupCity))
            {
                var clientIp = Request.Headers["X-Forwarded-For"].FirstOrDefault()?.Split(',')[0].Trim();
                if (string.IsNullOrWhiteSpace(clientIp))
                {
                    clientIp = HttpContext.Connection.RemoteIpAddress?.ToString();
                }

                string? cityFromIp = null;
                bool isLocalIp = string.IsNullOrWhiteSpace(clientIp) || clientIp == "::1" || clientIp == "127.0.0.1" || clientIp.StartsWith("10.") || clientIp.StartsWith("192.168.");

                if (!isLocalIp && clientIp != null)
                {
                    var cacheKey = $"geolocated_ip_{clientIp}";
                    if (!_cache.TryGetValue(cacheKey, out cityFromIp))
                    {
                        try
                        {
                            using var cts = new System.Threading.CancellationTokenSource(2000);
                            var geoResponse = await _httpClient.GetStringAsync($"https://ipapi.co/{clientIp}/json/", cts.Token);
                            var geoData = JsonDocument.Parse(geoResponse);
                            if (geoData.RootElement.TryGetProperty("city", out var cityProp))
                            {
                                cityFromIp = cityProp.GetString();
                                if (!string.IsNullOrWhiteSpace(cityFromIp))
                                {
                                    _cache.Set(cacheKey, cityFromIp, TimeSpan.FromHours(24));
                                }
                            }
                        }
                        catch
                        {
                            // Quiet fallback on timeout or IP rate limit
                        }
                    }
                }

                lookupCity = !string.IsNullOrWhiteSpace(cityFromIp) ? cityFromIp : defaultCity;
            }

            var weatherResult = await _weatherService.GetWeather(lookupCity);
            if (weatherResult.HasError && !lookupCity.Equals(defaultCity, StringComparison.OrdinalIgnoreCase))
            {
                // Fall back quietly to default city if lookup city fails
                weatherResult = await _weatherService.GetWeather(defaultCity);
            }

            Response.Headers.CacheControl = "public, max-age=900";
            return Ok(weatherResult);
        }
    }
}
