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
    public class FoodController : ControllerBase
    {
        private readonly INewsApiService _newsApiService;
        private readonly INewsEnrichmentService _enrichmentService;
        private readonly ISpoonacularService _spoonacularService;

        public FoodController(INewsApiService newsApiService, INewsEnrichmentService enrichmentService, ISpoonacularService spoonacularService)
        {
            _newsApiService = newsApiService;
            _enrichmentService = enrichmentService;
            _spoonacularService = spoonacularService;
        }

        [HttpGet("food")]
        public async Task<IActionResult> GetFood(
            [FromQuery] string? country = "us",
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var context = new NewsQueryContext
            {
                Query = "food OR dining OR recipe OR restaurant",
                Country = country,
                Language = "en",
                IsTopHeadlines = false, 
                Page = page,
                PageSize = pageSize
            };

            var fetchResult = await _newsApiService.FetchNewsAsync(context);
            if (!fetchResult.Success)
            {
                return StatusCode(fetchResult.StatusCode ?? 500, new { error = "Failed to fetch food news", details = fetchResult.Body });
            }

            try
            {
                var apiResponse = JsonSerializer.Deserialize<NewsApiResponse>(fetchResult.Body, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                var rawArticles = apiResponse?.Articles ?? new List<Article>();
                var enriched = await _enrichmentService.FilterDeduplicateAndEnrichAsync(rawArticles, "Food");

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
                return StatusCode(500, new { error = "Failed to parse and process articles", details = ex.Message });
            }
        }

        [HttpGet("/api/food/recipes")]
        public async Task<IActionResult> GetRecipes(
            [FromQuery] string? query,
            [FromQuery] string? diet,
            [FromQuery] string? type,
            [FromQuery] int page = 1,
            [FromQuery] int number = 12)
        {
            var result = await _spoonacularService.SearchRecipesAsync(query, diet, type, page, number);
            return Ok(result);
        }

        [HttpGet("/api/food/recipes/{id}")]
        public async Task<IActionResult> GetRecipeDetails(int id)
        {
            var result = await _spoonacularService.GetRecipeDetailsAsync(id);
            if (result == null)
            {
                return NotFound(new { error = $"Recipe with ID {id} not found." });
            }
            return Ok(result);
        }

        [HttpGet("/api/food/random")]
        public async Task<IActionResult> GetRandomRecipes([FromQuery] int number = 10)
        {
            var result = await _spoonacularService.GetRandomRecipesAsync(number);
            return Ok(result);
        }
    }
}
