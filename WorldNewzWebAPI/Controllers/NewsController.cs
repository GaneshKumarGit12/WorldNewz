using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using System.Threading.Tasks;
using System.Collections.Generic;
using System;
using System.Net.Http;
using System.Text.RegularExpressions;
using System.Text;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using WorldNewzWebAPI.Data;
using WorldNewzWebAPI.Services;
using WorldNewzWebAPI.Models;
using Microsoft.Extensions.Configuration;

namespace WorldNewzWebAPI.Controllers
{
    [ApiController]
    [Route("api/news")]
    public class NewsController : ControllerBase
    {
        private readonly INewsApiService _newsApiService;
        private readonly INewsEnrichmentService _enrichmentService;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly WorldNewsDbContext _db;
        private readonly UserPollsDbContext _userDb;
        private readonly IEmailService _emailService;
        private readonly string? _geminiApiKey;
        private readonly JsonSerializerOptions _jsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

        public NewsController(
            INewsApiService newsApiService, 
            INewsEnrichmentService enrichmentService,
            IHttpClientFactory httpClientFactory,
            WorldNewsDbContext db,
            UserPollsDbContext userDb,
            IEmailService emailService,
            IConfiguration config)
        {
            _newsApiService = newsApiService;
            _enrichmentService = enrichmentService;
            _httpClientFactory = httpClientFactory;
            _db = db;
            _userDb = userDb;
            _emailService = emailService;
            _geminiApiKey = config["GEMINI_API_KEY"] ?? Environment.GetEnvironmentVariable("GEMINI_API_KEY");
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

                // Cache successful discover feed at browser & CDN edge for 5 minutes
                Response.Headers.CacheControl = "public, max-age=300";

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

                // Cache successful search results at browser & CDN edge for 5 minutes
                Response.Headers.CacheControl = "public, max-age=300";

                return Ok(new { results });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Error parsing response: {ex.Message}" });
            }
        }

        [HttpGet("full-content")]
        public async Task<IActionResult> GetFullContent(
            [FromQuery] string url, 
            [FromQuery] string? title = null, 
            [FromQuery] string? description = null, 
            [FromQuery] string? category = null)
        {
            if (string.IsNullOrWhiteSpace(url))
            {
                return BadRequest(new { error = "URL is required" });
            }

            try
            {
                // 1. Check if we have the article in EnrichedArticles with FullContent cached
                var cachedArticle = await _db.EnrichedArticles.AsNoTracking().FirstOrDefaultAsync(e => e.Url == url);
                if (cachedArticle != null && !string.IsNullOrWhiteSpace(cachedArticle.FullContent))
                {
                    var cachedParagraphs = cachedArticle.FullContent
                        .Split(new[] { "\n\n", "\r\n\r\n" }, StringSplitOptions.RemoveEmptyEntries)
                        .Select(p => p.Trim())
                        .Where(p => p.Length > 0)
                        .ToList();

                    if (cachedParagraphs.Count > 0)
                    {
                        Response.Headers.CacheControl = "public, max-age=86400"; // Cache dynamic article for 24 hours at edge
                        return Ok(new { success = true, content = cachedParagraphs });
                    }
                }

                // 2. Not cached. Try to fetch/scrape first.
                var paragraphs = new List<string>();
                string html = "";
                try
                {
                    var client = _httpClientFactory.CreateClient();
                    client.DefaultRequestHeaders.UserAgent.ParseAdd("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
                    client.Timeout = TimeSpan.FromSeconds(5);

                    var response = await client.GetAsync(url);
                    if (response.IsSuccessStatusCode)
                    {
                        html = await response.Content.ReadAsStringAsync();

                        // Clean HTML
                        html = Regex.Replace(html, @"<!--.*?-->", "", RegexOptions.Singleline);
                        html = Regex.Replace(html, @"<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>", "", RegexOptions.IgnoreCase | RegexOptions.Singleline);
                        html = Regex.Replace(html, @"<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>", "", RegexOptions.IgnoreCase | RegexOptions.Singleline);
                        html = Regex.Replace(html, @"<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>", "", RegexOptions.IgnoreCase | RegexOptions.Singleline);
                        html = Regex.Replace(html, @"<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>", "", RegexOptions.IgnoreCase | RegexOptions.Singleline);
                        html = Regex.Replace(html, @"<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>", "", RegexOptions.IgnoreCase | RegexOptions.Singleline);

                        var matches = Regex.Matches(html, @"<p\b[^>]*>(.*?)</p>", RegexOptions.IgnoreCase | RegexOptions.Singleline);
                        foreach (Match match in matches)
                        {
                            var pText = match.Groups[1].Value;
                            pText = Regex.Replace(pText, @"<[^>]*>", "").Trim();
                            pText = System.Web.HttpUtility.HtmlDecode(pText);

                            if (pText.Length > 50 && 
                                !pText.Contains("javascript:", StringComparison.OrdinalIgnoreCase) && 
                                !pText.Contains("cookies", StringComparison.OrdinalIgnoreCase) &&
                                !pText.Contains("terms of use", StringComparison.OrdinalIgnoreCase) &&
                                !pText.Contains("privacy policy", StringComparison.OrdinalIgnoreCase) &&
                                !pText.Contains("subscribe", StringComparison.OrdinalIgnoreCase) &&
                                !pText.Contains("advertisement", StringComparison.OrdinalIgnoreCase))
                            {
                                paragraphs.Add(pText);
                            }
                        }
                    }
                }
                catch (Exception scrapeEx)
                {
                    Console.WriteLine($"[FullContent] Scraping failed for {url}: {scrapeEx.Message}");
                }

                // 3. Check if scraped content is sufficient (5+ paragraphs and 600+ words)
                var wordCount = paragraphs.Sum(p => p.Split(new[] { ' ', '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries).Length);
                if (paragraphs.Count >= 5 && wordCount >= 600)
                {
                    await SaveFullContentToCacheAsync(url, string.Join("\n\n", paragraphs));
                    Response.Headers.CacheControl = "public, max-age=86400";
                    return Ok(new { success = true, content = paragraphs.Take(15).ToList() });
                }

                // 4. Content is thin or scraping failed. Call Gemini to generate a high-quality, unique 600+ word report!
                if (!string.IsNullOrWhiteSpace(_geminiApiKey))
                {
                    // Fallback search in database if title is missing
                    if (string.IsNullOrWhiteSpace(title))
                    {
                        var dbArt = await _db.NewsArticles.AsNoTracking().FirstOrDefaultAsync(a => a.Url == url);
                        if (dbArt != null)
                        {
                            title = dbArt.Title;
                            description ??= dbArt.Description;
                        }
                        else
                        {
                            // Try to parse title from HTML title tag
                            var titleMatch = Regex.Match(html, @"<title>(.*?)</title>", RegexOptions.IgnoreCase);
                            if (titleMatch.Success)
                            {
                                title = System.Web.HttpUtility.HtmlDecode(titleMatch.Groups[1].Value.Replace(" - BBC News", "").Replace(" - Reuters", "").Trim());
                            }
                        }
                    }

                    if (!string.IsNullOrWhiteSpace(title))
                    {
                        var generatedParagraphs = await _enrichmentService.GenerateArticleWithGeminiAsync(title, description, category, paragraphs);
                        if (generatedParagraphs != null && generatedParagraphs.Count > 0)
                        {
                            await SaveFullContentToCacheAsync(url, string.Join("\n\n", generatedParagraphs));
                            Response.Headers.CacheControl = "public, max-age=86400";
                            return Ok(new { success = true, content = generatedParagraphs });
                        }
                    }
                }

                // 5. If Gemini is not configured or failed, return whatever we scraped (even if thin)
                if (paragraphs.Count > 0)
                {
                    return Ok(new { success = true, content = paragraphs.Take(15).ToList() });
                }

                return Ok(new { success = false, message = "No readable paragraphs found." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Error extracting article content", details = ex.Message });
            }
        }

        [HttpPost("admin/pre-enrich")]
        public async Task<IActionResult> TriggerPreEnrichment([FromQuery] int count = 5)
        {
            try
            {
                await _enrichmentService.PreEnrichLatestArticlesAsync(count);
                return Ok(new { success = true, message = "Pre-enrichment completed successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message, details = ex.InnerException?.Message ?? ex.Message });
            }
        }

        private async Task SaveFullContentToCacheAsync(string url, string fullContent)
        {
            try
            {
                var cached = await _db.EnrichedArticles.FirstOrDefaultAsync(e => e.Url == url);
                if (cached != null)
                {
                    cached.FullContent = fullContent;
                    cached.EnrichedAt = DateTime.UtcNow;
                    _db.EnrichedArticles.Update(cached);
                }
                else
                {
                    var dbArt = await _db.NewsArticles.AsNoTracking().FirstOrDefaultAsync(a => a.Url == url);
                    _db.EnrichedArticles.Add(new EnrichedArticle
                    {
                        Url = url,
                        Headline = dbArt?.Title ?? "News Update",
                        Summary = dbArt?.Description ?? string.Empty,
                        Context = string.Empty,
                        SocialMediaHook = string.Empty,
                        Verified = true,
                        EnrichedAt = DateTime.UtcNow,
                        FullContent = fullContent
                    });
                }
                await _db.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SaveFullContentToCache] Database write failed: {ex.Message}");
            }
        }


    }
}