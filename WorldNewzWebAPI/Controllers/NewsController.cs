using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using System.Threading.Tasks;
using System.Collections.Generic;
using System;
using WorldNewzWebAPI.Services;
using WorldNewzWebAPI.Models;

namespace WorldNewzWebAPI.Controllers
{
    [ApiController]
    [Route("api/news")]
    public class NewsController : ControllerBase
    {
        private readonly INewsApiService _newsApiService;
        private readonly INewsEnrichmentService _enrichmentService;
        private readonly JsonSerializerOptions _jsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

        public NewsController(INewsApiService newsApiService, INewsEnrichmentService enrichmentService)
        {
            _newsApiService = newsApiService;
            _enrichmentService = enrichmentService;
        }

        [HttpGet("discover")]
        public async Task<IActionResult> GetDiscover(
            [FromQuery] string? query = null,
            [FromQuery] string? country = "us",
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            country ??= "us";
            var context = new NewsQueryContext
            {
                Query = query,
                Country = country,
                Category = "general",
                IsTopHeadlines = string.IsNullOrEmpty(query), // use top headlines only if there is no query
                Page = page,
                PageSize = pageSize
            };

            var fetchResult = await _newsApiService.FetchCombinedNewsAsync(context);
            if (!fetchResult.Success)
            {
                return new ContentResult 
                { 
                    Content = fetchResult.Body, 
                    ContentType = "application/json", 
                    StatusCode = fetchResult.StatusCode ?? 500 
                };
            }

            try
            {
                var apiResponse = JsonSerializer.Deserialize<NewsApiResponse>(fetchResult.Body, _jsonOptions);
                var rawArticles = apiResponse?.Articles ?? new List<Article>();
                
                var enrichedArticles = await _enrichmentService.FilterDeduplicateAndEnrichAsync(rawArticles, "Discover");

                return Ok(new
                {
                    status = "ok",
                    totalResults = enrichedArticles.Count,
                    articles = enrichedArticles
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to process and enrich articles", details = ex.Message });
            }
        }

        /// <summary>
        /// Search news articles. Now seamlessly maps DDG usage to the working Active API provider.
        /// Returns { results: [...] } matching the UI's SearchPage expectation.
        /// </summary>
        [HttpGet("search")]
        public async Task<IActionResult> Search(
            [FromQuery] string? query = null,
            [FromQuery] string? category = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 9,
            [FromQuery] string? source = "news",
            [FromQuery] string? country = "us",
            [FromQuery] string? language = "en")
        {
            if (string.Equals(category, "shopping", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(category, "food", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(category, "travel", StringComparison.OrdinalIgnoreCase))
            {
                query = string.IsNullOrEmpty(query) ? category : $"{query} {category}";
                category = null;
            }

            var context = new NewsQueryContext
            {
                Query = query,
                Category = category,
                Page = page,
                PageSize = pageSize,
                Country = country,
                Language = language,
                Source = source,
                // If category is provided, use topheadlines, otherwise everything
                IsTopHeadlines = !string.IsNullOrEmpty(category) || (string.IsNullOrEmpty(query) && !string.IsNullOrEmpty(country))
            };

            var fetchResult = await _newsApiService.FetchNewsAsync(context);

            if (!fetchResult.Success)
            {
                return StatusCode(fetchResult.StatusCode ?? 500, new { error = "Failed to fetch search results", details = fetchResult.Body });
            }

            try
            {
                var apiResponse = JsonSerializer.Deserialize<NewsApiResponse>(fetchResult.Body, _jsonOptions);
                var rawArticles = apiResponse?.Articles ?? new List<Article>();
                
                var enrichedArticles = await _enrichmentService.FilterDeduplicateAndEnrichAsync(rawArticles, category ?? "Search");

                var results = new List<NewsArticleDto>();
                var resultsWithoutImage = new List<NewsArticleDto>();

                foreach (var item in enrichedArticles)
                {
                    if (!string.IsNullOrWhiteSpace(item.UrlToImage))
                    {
                        results.Add(item);
                    }
                    else
                    {
                        resultsWithoutImage.Add(item);
                    }
                }

                // Append articles with no images at the end
                results.AddRange(resultsWithoutImage);

                return Ok(new { results });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Error parsing response: {ex.Message}" });
            }
        }
    }
}