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
    public class EntertainmentController : ControllerBase
    {
        private readonly INewsApiService _newsApiService;
        private readonly INewsEnrichmentService _enrichmentService;

        public EntertainmentController(INewsApiService newsApiService, INewsEnrichmentService enrichmentService)
        {
            _newsApiService = newsApiService;
            _enrichmentService = enrichmentService;
        }

        [HttpGet("entertainment")]
        public async Task<IActionResult> GetEntertainment(
            [FromQuery] string? country = "us",
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var context = new NewsQueryContext
            {
                Country = country ?? "us",
                Category = "entertainment",
                IsTopHeadlines = true,
                Page = page,
                PageSize = pageSize
            };

            var fetchResult = await _newsApiService.FetchCombinedNewsAsync(context);
            if (!fetchResult.Success)
            {
                return StatusCode(fetchResult.StatusCode ?? 500, new { error = "Failed to fetch entertainment news", details = fetchResult.Body });
            }

            try
            {
                var apiResponse = JsonSerializer.Deserialize<NewsApiResponse>(fetchResult.Body, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                var rawArticles = apiResponse?.Articles ?? new List<Article>();
                var enriched = await _enrichmentService.FilterDeduplicateAndEnrichAsync(rawArticles, "Entertainment");

                return Ok(new
                {
                    status = "ok",
                    totalResults = enriched.Count,
                    articles = enriched
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to parse and process articles", details = ex.Message });
            }
        }
    }
}
