using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using System.Threading.Tasks;
using System.Collections.Generic;
using System;
using WorldNewzWebAPI.Services;
using WorldNewzWebAPI.Models;

[ApiController]
[Route("api/news")]
public class NewsController : ControllerBase
{
    private readonly INewsApiService _newsApiService;
    private readonly JsonSerializerOptions _jsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

    public NewsController(INewsApiService newsApiService)
    {
        _newsApiService = newsApiService;
    }

    [HttpGet("discover")]
    public async Task<IActionResult> GetDiscover([FromQuery] string? country = "us")
    {
        country ??= "us";
        var context = new NewsQueryContext
        {
            Country = country,
            Category = "general",
            IsTopHeadlines = true,
            Page = 1,
            PageSize = 20
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

        return Content(fetchResult.Body, "application/json");
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
        [FromQuery] string source = "news",
        [FromQuery] string? country = "us",
        [FromQuery] string? language = "en")
    {
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

        // The UI expects { results: [...] } but NewsApiService returns NewsAPI shape { status, totalResults, articles }
        // We unpack 'articles' into 'results' to match what the frontend expects from /search
        try
        {
            using var doc = JsonDocument.Parse(fetchResult.Body);
            var root = doc.RootElement;
            
            var results = new List<object>();
            var resultsWithoutImage = new List<object>();

            if (root.TryGetProperty("articles", out var articles) && articles.ValueKind == JsonValueKind.Array)
            {
                foreach (var article in articles.EnumerateArray())
                {
                    var urlToImageVal = article.TryGetProperty("urlToImage", out var img) && img.ValueKind == JsonValueKind.String ? img.GetString() : null;
                    var item = new
                    {
                        title = article.TryGetProperty("title", out var t) && t.ValueKind == JsonValueKind.String ? t.GetString() : null,
                        description = article.TryGetProperty("description", out var d) && d.ValueKind == JsonValueKind.String ? d.GetString() : null,
                        url = article.TryGetProperty("url", out var u) && u.ValueKind == JsonValueKind.String ? u.GetString() : null,
                        urlToImage = urlToImageVal,
                        publishedAt = article.TryGetProperty("publishedAt", out var pub) && pub.ValueKind == JsonValueKind.String ? pub.GetString() : null,
                        source = new { 
                            id = article.TryGetProperty("source", out var src) && src.TryGetProperty("id", out var sid) && sid.ValueKind == JsonValueKind.String ? sid.GetString() : null, 
                            name = article.TryGetProperty("source", out var src2) && src2.TryGetProperty("name", out var sname) && sname.ValueKind == JsonValueKind.String ? sname.GetString() : "News Provider" 
                        }
                    };

                    if (!string.IsNullOrWhiteSpace(urlToImageVal))
                    {
                        results.Add(item);
                    }
                    else
                    {
                        resultsWithoutImage.Add(item);
                    }
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