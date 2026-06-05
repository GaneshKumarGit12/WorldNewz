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
    public class ShoppingController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly INewsApiService _newsApiService;
        private readonly INewsEnrichmentService _enrichmentService;

        public ShoppingController(
            IHttpClientFactory httpClientFactory, 
            INewsApiService newsApiService, 
            INewsEnrichmentService enrichmentService)
        {
            _httpClientFactory = httpClientFactory;
            _newsApiService = newsApiService;
            _enrichmentService = enrichmentService;
        }

        [HttpGet("shopping")]
        public async Task<IActionResult> GetShopping(
            [FromQuery] string? country = "us",
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var shoppingKey = Environment.GetEnvironmentVariable("SHOPPING_API_KEY");
            var algoliaAppId = Environment.GetEnvironmentVariable("ALGOLIA_APP_ID");
            var articles = new List<NewsArticleDto>();

            // 1. Fetch Algolia API
            if (!string.IsNullOrWhiteSpace(shoppingKey) && !string.IsNullOrWhiteSpace(algoliaAppId))
            {
                var url = $"https://{algoliaAppId}-dsn.algolia.net/1/keys/ALGOLIA_API_KEY";
                try
                {
                    var client = _httpClientFactory.CreateClient();
                    var request = new HttpRequestMessage(HttpMethod.Get, url);
                    
                    request.Headers.Add("X-Algolia-API-Key", shoppingKey);
                    request.Headers.Add("X-Algolia-Application-Id", algoliaAppId);

                    var response = await client.SendAsync(request);
                    var responseBody = await response.Content.ReadAsStringAsync();

                    articles.Add(new NewsArticleDto
                    {
                        Title = "Algolia Key Metadata",
                        Description = responseBody,
                        Url = "https://algolia.com",
                        UrlToImage = "https://via.placeholder.com/600x400?text=Algolia+Data",
                        PublishedAt = DateTime.UtcNow,
                        Source = new SourceDto { Name = "Algolia Search Backend" },
                        Verified = true,
                        Headline = "Algolia Search Status",
                        Summary = "Dynamic status from the Algolia Search backend integration.",
                        Context = "This checks details regarding search indexes and API configurations for e-commerce catalog search.",
                        SocialMediaHook = "Connected to Algolia catalog indexes. #ECommerce #Algolia",
                        Category = "Shopping"
                    });
                }
                catch (Exception)
                {
                    // Continue
                }
            }

            // 2. Fetch standard News API populated articles
            country ??= "in";
            var context = new NewsQueryContext
            {
                Country = country,
                Query = "shopping",
                IsTopHeadlines = false,
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
                    var enriched = await _enrichmentService.FilterDeduplicateAndEnrichAsync(rawArticles, "Shopping");
                    articles.AddRange(enriched);
                }
                catch { /* Ignore parsing errors */ }
            }

            Response.Headers.CacheControl = "public, max-age=300";

            return Ok(new
            {
                status = "ok",
                totalResults = articles.Count,
                articles = articles
            });
        }
    }
}
