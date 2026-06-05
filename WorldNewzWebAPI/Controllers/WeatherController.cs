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
                        var geoResponse = await _httpClient.GetStringAsync("https://ipapi.co/json/");
                        var geoData = JsonDocument.Parse(geoResponse);
                        cityFromIp = geoData.RootElement.GetProperty("city").GetString();
                        if (!string.IsNullOrWhiteSpace(cityFromIp))
                        {
                            _cache.Set("geolocated_ip_city", cityFromIp, TimeSpan.FromHours(24));
                        }
                    }
                    catch
                    {
                        // If IP geolocation fails, do not cache and continue with default city.
                    }
                }

                if (!string.IsNullOrWhiteSpace(cityFromIp))
                {
                    lookupCity = cityFromIp;
                }
            }

            var weatherResult = await _weatherService.GetWeather(lookupCity);
            if (weatherResult.HasError)
            {
                return BadRequest(new { error = weatherResult.Error });
            }

            Response.Headers.CacheControl = "public, max-age=900";
            return Ok(weatherResult);
        }
    }
}
