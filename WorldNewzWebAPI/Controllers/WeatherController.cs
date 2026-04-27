using Microsoft.AspNetCore.Mvc;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using WorldNewzWebAPI.Services;

[ApiController]
[Route("api/news")]
public class WeatherController : ControllerBase
{
    private readonly WeatherService _weatherService;
    private readonly HttpClient _httpClient;

    public WeatherController(WeatherService weatherService, IHttpClientFactory httpClientFactory)
    {
        _weatherService = weatherService;
        _httpClient = httpClientFactory.CreateClient();
    }

    [HttpGet("weather")]
    public async Task<IActionResult> GetWeather([FromQuery] string? city)
    {
        var defaultCity = "Hyderabad";
        var lookupCity = string.IsNullOrWhiteSpace(city) ? defaultCity : city.Trim();

        try
        {
            var geoResponse = await _httpClient.GetStringAsync("https://ipapi.co/json/");
            var geoData = JsonDocument.Parse(geoResponse);
            var cityFromIp = geoData.RootElement.GetProperty("city").GetString();
            if (!string.IsNullOrWhiteSpace(cityFromIp))
            {
                lookupCity = cityFromIp;
            }
        }
        catch
        {
            // If IP geolocation fails, continue with the configured or default city.
        }

        var weatherResult = await _weatherService.GetWeather(lookupCity);
        if (weatherResult.HasError)
        {
            return BadRequest(new { error = weatherResult.Error });
        }

        return Ok(weatherResult);
    }
}
