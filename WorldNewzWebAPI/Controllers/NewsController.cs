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
        private readonly string? _geminiApiKey;
        private readonly JsonSerializerOptions _jsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

        public NewsController(
            INewsApiService newsApiService, 
            INewsEnrichmentService enrichmentService,
            IHttpClientFactory httpClientFactory,
            WorldNewsDbContext db,
            IConfiguration config)
        {
            _newsApiService = newsApiService;
            _enrichmentService = enrichmentService;
            _httpClientFactory = httpClientFactory;
            _db = db;
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


        [HttpPost("gemini-search")]
        public async Task<IActionResult> GeminiSearch([FromBody] GeminiSearchRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Query))
            {
                return BadRequest(new { error = "Query is required" });
            }

            var apiKey = Environment.GetEnvironmentVariable("GEMINI_API_KEY");
            if (string.IsNullOrWhiteSpace(apiKey))
            {
                return StatusCode(500, new { error = "Gemini API key is not configured on the server." });
            }

            var prompt = $"Generate a comprehensive news briefing on the topic: \"{request.Query}\". " +
                         "Respond ONLY with a raw JSON object containing the following keys: " +
                         "\"headline\" (string, catchy news headline), " +
                         "\"summary\" (string, detailed 2-3 paragraph news summary/overview of the current state of this topic), " +
                         "\"takeaways\" (array of exactly 3 bullet points showing key facts/developments), " +
                         "\"context\" (string, paragraph explaining 'Why it matters'). " +
                         "Do not wrap the response in markdown code blocks like ```json. Return ONLY the raw JSON.";

            var requestBody = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new[]
                        {
                            new { text = prompt }
                        }
                    }
                }
            };

            try
            {
                var client = _httpClientFactory.CreateClient();
                var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={apiKey}";
                
                var jsonContent = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
                var response = await client.PostAsync(url, jsonContent);
                var responseBody = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    Console.WriteLine($"⚠️ gemini-1.5-flash returned {response.StatusCode}. Retrying with gemini-pro...");
                    url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={apiKey}";
                    response = await client.PostAsync(url, jsonContent);
                    responseBody = await response.Content.ReadAsStringAsync();
                }

                if (!response.IsSuccessStatusCode)
                {
                    return StatusCode((int)response.StatusCode, new { error = "Gemini API returned an error", details = responseBody });
                }

                using var doc = JsonDocument.Parse(responseBody);
                var root = doc.RootElement;
                
                if (root.TryGetProperty("candidates", out var candidates) && 
                    candidates.ValueKind == JsonValueKind.Array && 
                    candidates.GetArrayLength() > 0)
                {
                    var candidate = candidates[0];
                    if (candidate.TryGetProperty("content", out var content) &&
                        content.TryGetProperty("parts", out var parts) &&
                        parts.ValueKind == JsonValueKind.Array &&
                        parts.GetArrayLength() > 0)
                    {
                        var text = parts[0].GetProperty("text").GetString() ?? "";
                        
                        // Clean any markdown wrapper formatting
                        text = text.Replace("```json", "").Replace("```", "").Trim();

                        try
                        {
                            using var parsedDoc = JsonDocument.Parse(text);
                            return Ok(parsedDoc.RootElement.Clone());
                        }
                        catch
                        {
                            return Ok(new { success = true, rawText = text });
                        }
                    }
                }

                return BadRequest(new { error = "No content generated by Gemini." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Exception during Gemini search execution", details = ex.Message });
            }
        }

        [HttpGet("jobs")]
        public async Task<IActionResult> GetJobs([FromQuery] int page = 1)
        {
            try
            {
                var client = _httpClientFactory.CreateClient();
                client.Timeout = TimeSpan.FromSeconds(8);
                client.DefaultRequestHeaders.UserAgent.ParseAdd("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

                var url = $"https://www.arbeitnow.com/api/job-board-api?page={page}";
                var response = await client.GetAsync(url);
                
                List<object> clientJobs = new();
                object? links = null;
                object? meta = null;

                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var apiResponse = JsonSerializer.Deserialize<ArbeitnowResponse>(content, _jsonOptions);
                    if (apiResponse != null && apiResponse.data != null)
                    {
                        links = apiResponse.links;
                        meta = apiResponse.meta;

                        foreach (var job in apiResponse.data)
                        {
                            var existing = await _db.JobPostings.FindAsync(job.slug);
                            if (existing == null)
                            {
                                _db.JobPostings.Add(new JobPosting
                                {
                                    Slug = job.slug,
                                    CompanyName = job.company_name,
                                    Title = job.title,
                                    Description = job.description,
                                    Remote = job.remote,
                                    Url = job.url,
                                    Tags = job.tags != null ? string.Join(",", job.tags) : null,
                                    JobTypes = job.job_types != null ? string.Join(",", job.job_types) : null,
                                    Location = job.location,
                                    CreatedAt = job.created_at,
                                    IsLocal = false
                                });
                            }
                            else if (!existing.IsLocal)
                            {
                                existing.CompanyName = job.company_name;
                                existing.Title = job.title;
                                existing.Description = job.description;
                                existing.Remote = job.remote;
                                existing.Url = job.url;
                                existing.Tags = job.tags != null ? string.Join(",", job.tags) : null;
                                existing.JobTypes = job.job_types != null ? string.Join(",", job.job_types) : null;
                                existing.Location = job.location;
                                existing.CreatedAt = job.created_at;
                            }
                        }
                        await _db.SaveChangesAsync();

                        clientJobs = apiResponse.data.Select(job => (object)new {
                            slug = job.slug,
                            company_name = job.company_name,
                            title = job.title,
                            description = job.description,
                            remote = job.remote,
                            url = job.url,
                            tags = job.tags ?? new List<string>(),
                            job_types = job.job_types ?? new List<string>(),
                            location = job.location,
                            created_at = job.created_at,
                            isLocal = false
                        }).ToList();
                    }
                }
                else
                {
                    // Fallback to DB if external API call fails
                    var dbJobs = await _db.JobPostings
                        .OrderByDescending(j => j.CreatedAt)
                        .Skip((page - 1) * 20)
                        .Take(20)
                        .ToListAsync();

                    clientJobs = dbJobs.Select(job => (object)new {
                        slug = job.Slug,
                        company_name = job.CompanyName,
                        title = job.Title,
                        description = job.Description,
                        remote = job.Remote,
                        url = job.Url,
                        tags = job.Tags != null ? job.Tags.Split(',').ToList() : new List<string>(),
                        job_types = job.JobTypes != null ? job.JobTypes.Split(',').ToList() : new List<string>(),
                        location = job.Location,
                        created_at = job.CreatedAt,
                        isLocal = job.IsLocal
                    }).ToList();

                    meta = new { current_page = page, next = clientJobs.Count == 20 ? page + 1 : (int?)null };
                }

                if (page == 1)
                {
                    var localPostings = await _db.JobPostings
                        .Where(j => j.IsLocal)
                        .OrderByDescending(j => j.CreatedAt)
                        .ToListAsync();

                    var mappedLocals = localPostings.Select(job => (object)new {
                        slug = job.Slug,
                        company_name = job.CompanyName,
                        title = job.Title,
                        description = job.Description,
                        remote = job.Remote,
                        url = job.Url,
                        tags = job.Tags != null ? job.Tags.Split(',').ToList() : new List<string>(),
                        job_types = job.JobTypes != null ? job.JobTypes.Split(',').ToList() : new List<string>(),
                        location = job.Location,
                        created_at = job.CreatedAt,
                        isLocal = true
                    });

                    clientJobs.InsertRange(0, mappedLocals);
                }

                Response.Headers.CacheControl = "public, max-age=1800"; // Cache for 30 minutes
                return Ok(new { data = clientJobs, links = links, meta = meta });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("jobs/detail/{slug}")]
        public async Task<IActionResult> GetJobDetail(string slug)
        {
            try
            {
                var job = await _db.JobPostings.FirstOrDefaultAsync(j => j.Slug == slug);
                if (job != null)
                {
                    return Ok(new {
                        slug = job.Slug,
                        company_name = job.CompanyName,
                        title = job.Title,
                        description = job.Description,
                        remote = job.Remote,
                        url = job.Url,
                        tags = job.Tags != null ? job.Tags.Split(',').ToList() : new List<string>(),
                        job_types = job.JobTypes != null ? job.JobTypes.Split(',').ToList() : new List<string>(),
                        location = job.Location,
                        created_at = job.CreatedAt,
                        isLocal = job.IsLocal
                    });
                }

                // Try searching on Arbeitnow API by slug words
                var query = slug.Replace("-", " ");
                var client = _httpClientFactory.CreateClient();
                client.Timeout = TimeSpan.FromSeconds(8);
                client.DefaultRequestHeaders.UserAgent.ParseAdd("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

                var response = await client.GetAsync($"https://www.arbeitnow.com/api/job-board-api?search={Uri.EscapeDataString(query)}");
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var apiResponse = JsonSerializer.Deserialize<ArbeitnowResponse>(content, _jsonOptions);
                    if (apiResponse != null && apiResponse.data != null)
                    {
                        var apiJob = apiResponse.data.FirstOrDefault(j => j.slug == slug);
                        if (apiJob != null)
                        {
                            var newJob = new JobPosting
                            {
                                Slug = apiJob.slug,
                                CompanyName = apiJob.company_name,
                                Title = apiJob.title,
                                Description = apiJob.description,
                                Remote = apiJob.remote,
                                Url = apiJob.url,
                                Tags = apiJob.tags != null ? string.Join(",", apiJob.tags) : null,
                                JobTypes = apiJob.job_types != null ? string.Join(",", apiJob.job_types) : null,
                                Location = apiJob.location,
                                CreatedAt = apiJob.created_at,
                                IsLocal = false
                            };
                            _db.JobPostings.Add(newJob);
                            await _db.SaveChangesAsync();

                            return Ok(new {
                                slug = apiJob.slug,
                                company_name = apiJob.company_name,
                                title = apiJob.title,
                                description = apiJob.description,
                                remote = apiJob.remote,
                                url = apiJob.url,
                                tags = apiJob.tags ?? new List<string>(),
                                job_types = apiJob.job_types ?? new List<string>(),
                                location = apiJob.location,
                                created_at = apiJob.created_at,
                                isLocal = false
                            });
                        }
                    }
                }

                return NotFound(new { error = "Job posting not found" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("jobs/post")]
        public async Task<IActionResult> PostJob([FromBody] JobPostRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.Title) || string.IsNullOrEmpty(request.CompanyName) || string.IsNullOrEmpty(request.Description))
                {
                    return BadRequest(new { error = "Title, Company Name, and Description are required." });
                }

                var cleanCompany = Regex.Replace(request.CompanyName.ToLower(), @"[^a-z0-9\s-]", "").Replace(" ", "-");
                var cleanTitle = Regex.Replace(request.Title.ToLower(), @"[^a-z0-9\s-]", "").Replace(" ", "-");
                var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
                var slug = $"{cleanCompany}-{cleanTitle}-{timestamp}";

                var job = new JobPosting
                {
                    Slug = slug,
                    CompanyName = request.CompanyName,
                    Title = request.Title,
                    Description = request.Description,
                    Remote = request.Remote,
                    Url = request.Url,
                    Tags = request.Tags != null ? string.Join(",", request.Tags) : null,
                    JobTypes = request.JobTypes != null ? string.Join(",", request.JobTypes) : null,
                    Location = request.Location,
                    CreatedAt = timestamp,
                    IsLocal = true
                };

                _db.JobPostings.Add(job);
                await _db.SaveChangesAsync();

                return Ok(new { success = true, slug = slug });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }

    public class GeminiSearchRequest
    {
        public string Query { get; set; } = string.Empty;
    }

    public class ArbeitnowJob
    {
        public string slug { get; set; } = string.Empty;
        public string company_name { get; set; } = string.Empty;
        public string title { get; set; } = string.Empty;
        public string description { get; set; } = string.Empty;
        public bool remote { get; set; }
        public string url { get; set; } = string.Empty;
        public List<string>? tags { get; set; }
        public List<string>? job_types { get; set; }
        public string location { get; set; } = string.Empty;
        public long created_at { get; set; }
    }

    public class ArbeitnowResponse
    {
        public List<ArbeitnowJob> data { get; set; } = new();
        public object? links { get; set; }
        public object? meta { get; set; }
    }

    public class JobPostRequest
    {
        public string CompanyName { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public bool Remote { get; set; }
        public string Url { get; set; } = string.Empty;
        public List<string>? Tags { get; set; }
        public List<string>? JobTypes { get; set; }
        public string Location { get; set; } = string.Empty;
    }
}