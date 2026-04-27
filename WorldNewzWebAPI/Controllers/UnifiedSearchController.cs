using Microsoft.AspNetCore.Mvc;
using System.Net.Http;
using System.Threading.Tasks;
using WorldNewzWebAPI.Models;
using System.Text.Json;

namespace WorldNewzWebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UnifiedSearchController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly JsonSerializerOptions _jsonOptions;

        public UnifiedSearchController(IHttpClientFactory httpClientFactory)
        {
            _httpClientFactory = httpClientFactory;
            _jsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        }

        private string? GetApiKey()
        {
            return Environment.GetEnvironmentVariable("NEWS_API_KEY");
        }

        [HttpGet("search")]
        public async Task<IActionResult> Search(
            [FromQuery] string? query,
            [FromQuery] string? country,
            [FromQuery] string? sources)
        {
            var apiKey = GetApiKey();
            if (string.IsNullOrEmpty(apiKey))
                return BadRequest(new { error = "Missing NEWS_API_KEY" });

            // Normalize empty strings
            query = string.IsNullOrWhiteSpace(query) ? null : query;
            country = string.IsNullOrWhiteSpace(country) ? null : country;
            sources = string.IsNullOrWhiteSpace(sources) ? null : sources;

            // 🚫 Guard against invalid combinations
            if (!string.IsNullOrEmpty(sources) && (!string.IsNullOrEmpty(country) || !string.IsNullOrEmpty(query)))
            {
                return BadRequest(new { error = "Invalid parameter combination: sources cannot be combined with country or query." });
            }

            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Add("User-Agent", "WorldNewzWebAPI/1.0");

            // ✅ Build URL based on valid NewsAPI rules
            string url;
            if (!string.IsNullOrEmpty(sources))
            {
                url = $"https://newsapi.org/v2/top-headlines?sources={sources}&apiKey={apiKey}";
            }
            else if (!string.IsNullOrEmpty(country) && !string.IsNullOrEmpty(query))
            {
                url = $"https://newsapi.org/v2/top-headlines?country={country}&q={query}&apiKey={apiKey}";
            }
            else if (!string.IsNullOrEmpty(country))
            {
                url = $"https://newsapi.org/v2/top-headlines?country={country}&apiKey={apiKey}";
            }
            else if (!string.IsNullOrEmpty(query))
            {
                url = $"https://newsapi.org/v2/everything?q={query}&apiKey={apiKey}";
            }
            else
            {
                url = $"https://newsapi.org/v2/top-headlines?apiKey={apiKey}";
            }

            Console.WriteLine($"DEBUG URL: {url}");

            var response = await client.GetAsync(url);
            if (!response.IsSuccessStatusCode)
                return StatusCode((int)response.StatusCode, new { error = "Failed to fetch search results", details = response.ReasonPhrase });

            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<NewsApiResponse>(json, _jsonOptions);

            // ✅ Fallback if empty and query provided
            if (result != null && result.TotalResults == 0 && !string.IsNullOrEmpty(query))
            {
                var fallbackUrl = $"https://newsapi.org/v2/everything?q={query}&apiKey={apiKey}";
                Console.WriteLine($"DEBUG Fallback URL: {fallbackUrl}");

                var fallbackResponse = await client.GetAsync(fallbackUrl);
                if (fallbackResponse.IsSuccessStatusCode)
                {
                    var fallbackJson = await fallbackResponse.Content.ReadAsStringAsync();
                    result = JsonSerializer.Deserialize<NewsApiResponse>(fallbackJson, _jsonOptions);
                }
            }

            return Ok(result);
        }

        [HttpGet("sources")]
        public async Task<IActionResult> GetSources()
        {
            var apiKey = GetApiKey();
            if (string.IsNullOrEmpty(apiKey))
                return BadRequest(new { error = "Missing NEWS_API_KEY" });

            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Add("User-Agent", "WorldNewzWebAPI/1.0");
            var url = $"https://newsapi.org/v2/sources?apiKey={apiKey}";

            Console.WriteLine($"DEBUG API KEY: {(string.IsNullOrEmpty(apiKey) ? "EMPTY" : apiKey.Substring(0, 5) + "...")}");
            Console.WriteLine($"DEBUG URL: {url}");

            var response = await client.GetAsync(url);
            if (!response.IsSuccessStatusCode)
                return StatusCode((int)response.StatusCode, new { error = "Failed to fetch sources", details = response.ReasonPhrase });

            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<SourcesResponse>(json, _jsonOptions);

            return Ok(result);
        }
    }
}