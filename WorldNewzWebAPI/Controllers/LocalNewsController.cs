using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WorldNewzWebAPI.Data;
using WorldNewzWebAPI.Models;
using WorldNewzWebAPI.Services;

namespace WorldNewzWebAPI.Controllers
{
    [ApiController]
    [Route("api/news")]
    public class LocalNewsController : ControllerBase
    {
        private readonly IGNewsService _gnewsService;
        private readonly INewsApiService _newsApiService;
        private readonly INewsEnrichmentService _enrichmentService;
        private readonly WorldNewsDbContext _db;

        public LocalNewsController(
            IGNewsService gnewsService,
            INewsApiService newsApiService,
            INewsEnrichmentService enrichmentService,
            WorldNewsDbContext db)
        {
            _gnewsService = gnewsService;
            _newsApiService = newsApiService;
            _enrichmentService = enrichmentService;
            _db = db;
        }

        [HttpGet("gnews-headlines")]
        public async Task<IActionResult> GetGNewsHeadlines([FromQuery] string country = "in")
        {
            if (string.IsNullOrWhiteSpace(country)) country = "in";
            
            try
            {
                var articles = await _gnewsService.GetTopHeadlinesAsync(country);
                return Ok(new
                {
                    status = "ok",
                    totalResults = articles.Count,
                    articles = articles
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️ Error in GetGNewsHeadlines, using fallback: {ex.Message}");
                try
                {
                    var context = new NewsQueryContext
                    {
                        Query = "Telangana OR Hyderabad OR local OR india",
                        Country = country,
                        Language = "en",
                        IsTopHeadlines = false,
                        Page = 1,
                        PageSize = 10
                    };
                    var fetchResult = await _newsApiService.FetchCombinedNewsAsync(context);
                    if (fetchResult.Success)
                    {
                        var apiResponse = JsonSerializer.Deserialize<NewsApiResponse>(fetchResult.Body, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                        var rawArticles = apiResponse?.Articles ?? new List<Article>();
                        var enriched = await _enrichmentService.FilterDeduplicateAndEnrichAsync(rawArticles, "Local News (India)");
                        if (enriched.Any())
                        {
                            return Ok(new
                            {
                                status = "ok",
                                totalResults = enriched.Count,
                                articles = enriched
                            });
                        }
                    }
                }
                catch (Exception fallbackEx)
                {
                    Console.WriteLine($"❌ API Fallback failed: {fallbackEx.Message}");
                }

                try
                {
                    // Fallback to database
                    var localCategory = await _db.Categories.FirstOrDefaultAsync(c => c.Name.Contains("Local"));
                    if (localCategory != null)
                    {
                        var dbArticles = await _db.NewsArticles
                            .Where(a => a.CategoryId == localCategory.Id)
                            .OrderByDescending(a => a.PublishedAt ?? a.CachedAt)
                            .Take(10)
                            .ToListAsync();

                        if (dbArticles.Any())
                        {
                            var mapped = dbArticles.Select(a => new Article
                            {
                                Title = a.Title,
                                Description = a.Description,
                                Url = a.Url ?? "",
                                UrlToImage = a.ImageUrl,
                                PublishedAt = a.PublishedAt,
                                Source = new Source { Name = "Local News" }
                            }).ToList();

                            return Ok(new
                            {
                                status = "ok",
                                totalResults = mapped.Count,
                                articles = mapped
                            });
                        }
                    }
                }
                catch (Exception dbEx)
                {
                    Console.WriteLine($"❌ DB Fallback failed: {dbEx.Message}");
                }

                // Final fallback: return empty list
                return Ok(new
                {
                    status = "ok",
                    totalResults = 0,
                    articles = new List<Article>()
                });
            }
        }

        [HttpGet("gnews-more")]
        public async Task<IActionResult> GetGNewsMore([FromQuery] string country = "in", [FromQuery] int page = 1)
        {
            if (string.IsNullOrWhiteSpace(country)) country = "in";
            if (page < 1) page = 1;

            try
            {
                var articles = await _gnewsService.GetMoreLocalNewsAsync(country, page);
                return Ok(new
                {
                    status = "ok",
                    totalResults = articles.Count,
                    articles = articles
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️ Error in GetGNewsMore, using fallback for page={page}: {ex.Message}");
                try
                {
                    var context = new NewsQueryContext
                    {
                        Query = "Telangana OR Hyderabad OR local OR india",
                        Country = country,
                        Language = "en",
                        IsTopHeadlines = false,
                        Page = page,
                        PageSize = 9
                    };
                    var fetchResult = await _newsApiService.FetchCombinedNewsAsync(context);
                    if (fetchResult.Success)
                    {
                        var apiResponse = JsonSerializer.Deserialize<NewsApiResponse>(fetchResult.Body, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                        var rawArticles = apiResponse?.Articles ?? new List<Article>();
                        var enriched = await _enrichmentService.FilterDeduplicateAndEnrichAsync(rawArticles, "Local News (India)");
                        if (enriched.Any())
                        {
                            return Ok(new
                            {
                                status = "ok",
                                totalResults = enriched.Count,
                                articles = enriched
                            });
                        }
                    }
                }
                catch (Exception fallbackEx)
                {
                    Console.WriteLine($"❌ API Fallback failed: {fallbackEx.Message}");
                }

                try
                {
                    // Fallback to database
                    var localCategory = await _db.Categories.FirstOrDefaultAsync(c => c.Name.Contains("Local"));
                    if (localCategory != null)
                    {
                        var dbArticles = await _db.NewsArticles
                            .Where(a => a.CategoryId == localCategory.Id)
                            .OrderByDescending(a => a.PublishedAt ?? a.CachedAt)
                            .Skip((page - 1) * 9)
                            .Take(9)
                            .ToListAsync();

                        if (dbArticles.Any())
                        {
                            var mapped = dbArticles.Select(a => new Article
                            {
                                Title = a.Title,
                                Description = a.Description,
                                Url = a.Url ?? "",
                                UrlToImage = a.ImageUrl,
                                PublishedAt = a.PublishedAt,
                                Source = new Source { Name = "Local News" }
                            }).ToList();

                            return Ok(new
                            {
                                status = "ok",
                                totalResults = mapped.Count,
                                articles = mapped
                            });
                        }
                    }
                }
                catch (Exception dbEx)
                {
                    Console.WriteLine($"❌ DB Fallback failed: {dbEx.Message}");
                }

                return Ok(new
                {
                    status = "ok",
                    totalResults = 0,
                    articles = new List<Article>()
                });
            }
        }
    }
}

