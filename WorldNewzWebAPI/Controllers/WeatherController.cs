using Microsoft.AspNetCore.Mvc;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using System;
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
        public async Task<IActionResult> GetWeather([FromQuery] string? city)
        {
            var defaultCity = "Hyderabad";
            var lookupCity = string.IsNullOrWhiteSpace(city) ? defaultCity : city.Trim();

            if (string.IsNullOrWhiteSpace(city))
            {
                // Try to get cached city from IP geolocation
                if (!_cache.TryGetValue("geolocated_ip_city", out string? cityFromIp))
                {
                    try
                    {
                        using var cts = new System.Threading.CancellationTokenSource(2500);
                        var geoResponse = await _httpClient.GetStringAsync("https://ipapi.co/json/", cts.Token);
                        var geoData = JsonDocument.Parse(geoResponse);
                        if (geoData.RootElement.TryGetProperty("city", out var cityProp))
                        {
                            cityFromIp = cityProp.GetString();
                            if (!string.IsNullOrWhiteSpace(cityFromIp))
                            {
                                _cache.Set("geolocated_ip_city", cityFromIp, TimeSpan.FromHours(24));
                            }
                        }
                    }
                    catch
                    {
                        // If IP geolocation fails or 429 rate limit occurs, continue with default city.
                    }
                }

                if (!string.IsNullOrWhiteSpace(cityFromIp))
                {
                    lookupCity = cityFromIp;
                }
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
