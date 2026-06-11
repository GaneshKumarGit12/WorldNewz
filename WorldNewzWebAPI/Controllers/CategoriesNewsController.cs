using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using System.Collections.Generic;
using System;
using System.Text.Json;
using WorldNewzWebAPI.Services;
using WorldNewzWebAPI.Models;

namespace WorldNewzWebAPI.Controllers
{
    [ApiController]
    [Route("api/news")]
    public class CategoriesNewsController : ControllerBase
    {
        private readonly INewsApiService _newsApiService;
        private readonly INewsEnrichmentService _enrichmentService;

        public CategoriesNewsController(INewsApiService newsApiService, INewsEnrichmentService enrichmentService)
        {
            _newsApiService = newsApiService;
            _enrichmentService = enrichmentService;
        }

        private async Task<IActionResult> GetCategoryNews(string categoryLabel, string? query, string? standardCategory, string? country, bool isTopHeadlines, int page, int pageSize)
        {
            var context = new NewsQueryContext
            {
                Query = query,
                Category = standardCategory,
                Country = country,
                Language = "en",
                IsTopHeadlines = isTopHeadlines,
                Page = page,
                PageSize = pageSize
            };

            var fetchResult = await _newsApiService.FetchCombinedNewsAsync(context);
            if (!fetchResult.Success)
            {
                return StatusCode(fetchResult.StatusCode ?? 500, new { error = $"Failed to fetch {categoryLabel} news", details = fetchResult.Body });
            }

            try
            {
                var apiResponse = JsonSerializer.Deserialize<NewsApiResponse>(fetchResult.Body, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                var rawArticles = apiResponse?.Articles ?? new List<Article>();
                var enriched = await _enrichmentService.FilterDeduplicateAndEnrichAsync(rawArticles, categoryLabel);

                // Cache category feed at browser & CDN edge for 5 minutes
                Response.Headers.CacheControl = "public, max-age=300";

                return Ok(new
                {
                    status = "ok",
                    totalResults = enriched.Count,
                    articles = enriched
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Failed to parse and process {categoryLabel} articles", details = ex.Message });
            }
        }

        [HttpGet("politics")]
        public Task<IActionResult> GetPolitics([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            return GetCategoryNews("Politics", "politics OR election OR government OR policy", null, "us", false, page, pageSize);
        }

        [HttpGet("technology")]
        public Task<IActionResult> GetTechnology([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            return GetCategoryNews("Technology", null, "technology", "us", true, page, pageSize);
        }

        [HttpGet("business")]
        public Task<IActionResult> GetBusiness([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            return GetCategoryNews("Business", null, "business", "us", true, page, pageSize);
        }

        [HttpGet("science-health")]
        public Task<IActionResult> GetScienceHealth([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            return GetCategoryNews("Science & Health", "science OR health OR medical OR space OR environment", null, "us", false, page, pageSize);
        }

        [HttpGet("lifestyle")]
        public Task<IActionResult> GetLifestyle([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            return GetCategoryNews("Lifestyle", "lifestyle OR fashion OR wellness OR culture OR \"personal growth\"", null, "us", false, page, pageSize);
        }

        [HttpGet("education")]
        public Task<IActionResult> GetEducation([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            return GetCategoryNews("Education", "education OR learning OR student OR university OR exams OR career", null, "us", false, page, pageSize);
        }

        [HttpGet("opinion")]
        public Task<IActionResult> GetOpinion([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            return GetCategoryNews("Opinion", "opinion OR editorial OR column OR perspective", null, "us", false, page, pageSize);
        }

        [HttpGet("trending")]
        public Task<IActionResult> GetTrending([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            return GetCategoryNews("Trending", "trending OR viral OR \"social media\" OR pop culture OR meme", null, "us", false, page, pageSize);
        }

        [HttpGet("podcasts-videos")]
        public Task<IActionResult> GetPodcastsVideos([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            return GetCategoryNews("Podcasts & Videos", "podcast OR video OR interview OR explainer OR clip", null, "us", false, page, pageSize);
        }

        [HttpGet("local-news")]
        public Task<IActionResult> GetLocalNews([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            return GetCategoryNews("Local News (India)", "Telangana OR Hyderabad OR local", null, "in", false, page, pageSize);
        }

        [HttpGet("services")]
        public Task<IActionResult> GetServices([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            return GetCategoryNews("Services", "service OR consultant OR platform OR utility OR SaaS OR \"business services\"", null, "us", false, page, pageSize);
        }

        [HttpGet("gaming")]
        public Task<IActionResult> GetGaming([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            return GetCategoryNews("Gaming", "gaming OR e-sports OR xbox OR playstation OR nintendo OR \"PC games\" OR \"mobile game\" OR steam", null, "us", false, page, pageSize);
        }

        [HttpGet("cartoons")]
        public Task<IActionResult> GetCartoons([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            return GetCategoryNews("Cartoons", "cartoon OR anime OR manga OR animation OR disney OR pixar OR nickelodeon OR \"comic book\"", null, "us", false, page, pageSize);
        }
    }
}
