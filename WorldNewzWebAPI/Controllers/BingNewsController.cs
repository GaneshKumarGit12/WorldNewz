using Microsoft.AspNetCore.Mvc;
using System.Net.Http;
using System.Threading.Tasks;

namespace WorldNewzWebAPI.Controllers
{
    [ApiController]
    [Route("api/news")]
    public class BingNewsController : ControllerBase
    {
        private readonly HttpClient _httpClient;

        public BingNewsController(IHttpClientFactory httpClientFactory)
        {
            _httpClient = httpClientFactory.CreateClient();
        }

        /// <summary>
        /// Fetches news articles from Bing News Search API.
        /// </summary>
        /// <param name="query">Search term (default: latest news).</param>
        /// <returns>JSON response containing Bing news results.</returns>
        [HttpGet("bing")]
        public async Task<IActionResult> GetBingNews([FromQuery] string query = "latest news")
        {
            var apiKey = Environment.GetEnvironmentVariable("BING_API_KEY");
            if (string.IsNullOrEmpty(apiKey))
            {
                return StatusCode(500, new { error = "Missing Bing API key", details = "Set BING_API_KEY in .env" });
            }

            var url = $"https://api.bing.microsoft.com/v7.0/news/search?q={query}&mkt=en-IN";
            // mkt=en-IN ensures Indian localization; change to en-US, en-GB, etc. if needed

            var request = new HttpRequestMessage(HttpMethod.Get, url);
            request.Headers.Add("Ocp-Apim-Subscription-Key", apiKey);

            try
            {
                var response = await _httpClient.SendAsync(request);
                response.EnsureSuccessStatusCode();
                var json = await response.Content.ReadAsStringAsync();
                return Content(json, "application/json");
            }
            catch (HttpRequestException ex)
            {
                return StatusCode(500, new { error = "Failed to fetch Bing news", details = ex.Message });
            }
        }
    }
}