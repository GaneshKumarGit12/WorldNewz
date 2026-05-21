using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using System.Net.Http;
using System.Collections.Generic;
using System;
using System.Text.Json;
using WorldNewzWebAPI.Services;
using WorldNewzWebAPI.Models;

namespace WorldNewzWebAPI.Controllers
{
    [ApiController]
    [Route("api/news")]
    public class SportsController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly INewsApiService _newsApiService;
        private readonly INewsEnrichmentService _enrichmentService;

        public SportsController(
            IHttpClientFactory httpClientFactory, 
            INewsApiService newsApiService, 
            INewsEnrichmentService enrichmentService)
        {
            _httpClientFactory = httpClientFactory;
            _newsApiService = newsApiService;
            _enrichmentService = enrichmentService;
        }

        [HttpGet("sports")]
        public async Task<IActionResult> GetSports(
            [FromQuery] string? country = "us",
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var apiKey = Environment.GetEnvironmentVariable("SPORTS_API_KEY");
            var articles = new List<NewsArticleDto>();

            // 1. Fetch ClearSports API
            if (!string.IsNullOrWhiteSpace(apiKey))
            {
                var url = "https://api.clearsportsapi.com/api/v1/api-keys/me";
                try
                {
                    var client = _httpClientFactory.CreateClient();
                    var request = new HttpRequestMessage(HttpMethod.Get, url);
                    request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);

                    var response = await client.SendAsync(request);
                    var responseBody = await response.Content.ReadAsStringAsync();

                    articles.Add(new NewsArticleDto
                    {
                        Title = "Clear Sports API Profile",
                        Description = responseBody,
                        Url = url,
                        UrlToImage = "https://via.placeholder.com/600x400?text=Clear+Sports+API",
                        PublishedAt = DateTime.UtcNow,
                        Source = new SourceDto { Name = "Clear Sports API" },
                        Verified = true,
                        Headline = "Clear Sports API Profile",
                        Summary = "Connection status and profile information retrieved from the Clear Sports API.",
                        Context = "This checks the validity and rate limits for the active Clear Sports API connection.",
                        SocialMediaHook = "Successfully connected to Clear Sports API. #Sports #APIs",
                        Category = "Sports"
                    });
                }
                catch (Exception)
                {
                    // Continue without failing the whole request
                }
            }

            // 2. Fetch standard News API populated articles
            country ??= "us";
            var context = new NewsQueryContext
            {
                Country = country,
                Category = "sports",
                IsTopHeadlines = true,
                Page = page,
                PageSize = pageSize
            };

            var fetchResult = await _newsApiService.FetchCombinedNewsAsync(context);
            if (fetchResult.Success)
            {
                try
                {
                    var apiResponse = JsonSerializer.Deserialize<NewsApiResponse>(fetchResult.Body, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    var rawArticles = apiResponse?.Articles ?? new List<Article>();
                    var enriched = await _enrichmentService.FilterDeduplicateAndEnrichAsync(rawArticles, "Sports");
                    articles.AddRange(enriched);
                }
                catch { /* Ignore parsing errors */ }
            }

            return Ok(new
            {
                status = "ok",
                totalResults = articles.Count,
                articles = articles
            });
        }
    }
}
