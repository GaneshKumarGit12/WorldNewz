using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using System.Threading.Tasks;
using System.Collections.Generic;
using System;
using System.Net.Http;
using System.Text.RegularExpressions;
using System.Text;
using System.Linq;
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
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly JsonSerializerOptions _jsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

        public NewsController(
            INewsApiService newsApiService, 
            INewsEnrichmentService enrichmentService,
            IHttpClientFactory httpClientFactory)
        {
            _newsApiService = newsApiService;
            _enrichmentService = enrichmentService;
            _httpClientFactory = httpClientFactory;
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
        public async Task<IActionResult> GetFullContent([FromQuery] string url)
        {
            if (string.IsNullOrWhiteSpace(url))
            {
                return BadRequest(new { error = "URL is required" });
            }

            try
            {
                var client = _httpClientFactory.CreateClient();
                client.DefaultRequestHeaders.UserAgent.ParseAdd("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
                client.Timeout = TimeSpan.FromSeconds(5);

                var response = await client.GetAsync(url);
                if (!response.IsSuccessStatusCode)
                {
                    return StatusCode((int)response.StatusCode, new { error = $"Failed to fetch source article. Status code: {response.StatusCode}" });
                }

                var html = await response.Content.ReadAsStringAsync();

                // Clean script, style, header, footer, comments
                html = Regex.Replace(html, @"<!--.*?-->", "", RegexOptions.Singleline);
                html = Regex.Replace(html, @"<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>", "", RegexOptions.IgnoreCase | RegexOptions.Singleline);
                html = Regex.Replace(html, @"<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>", "", RegexOptions.IgnoreCase | RegexOptions.Singleline);
                html = Regex.Replace(html, @"<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>", "", RegexOptions.IgnoreCase | RegexOptions.Singleline);
                html = Regex.Replace(html, @"<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>", "", RegexOptions.IgnoreCase | RegexOptions.Singleline);
                html = Regex.Replace(html, @"<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>", "", RegexOptions.IgnoreCase | RegexOptions.Singleline);

                var matches = Regex.Matches(html, @"<p\b[^>]*>(.*?)</p>", RegexOptions.IgnoreCase | RegexOptions.Singleline);
                var paragraphs = new List<string>();

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

                if (paragraphs.Count == 0)
                {
                    return Ok(new { success = false, message = "No readable paragraphs found." });
                }

                // Return at most 15 paragraphs
                var content = paragraphs.Take(15).ToList();
                Response.Headers.CacheControl = "public, max-age=3600";
                return Ok(new { success = true, content = content });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Error extracting article content", details = ex.Message });
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
    }

    public class GeminiSearchRequest
    {
        public string Query { get; set; } = string.Empty;
    }
}