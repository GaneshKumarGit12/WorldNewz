using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using System.Collections.Generic;
using System;
using System.Text.Json;
using WorldNewzWebAPI.Services;
using WorldNewzWebAPI.Models;

[ApiController]
[Route("api/news")]
public class TravelController : ControllerBase
{
    private readonly INewsApiService _newsApiService;

    public TravelController(INewsApiService newsApiService)
    {
        _newsApiService = newsApiService;
    }

    [HttpGet("travel")]
    public async Task<IActionResult> GetTravel(
        [FromQuery] string? country = "us",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var articles = new List<object>();
        var context = new NewsQueryContext
        {
            Query = "travel OR tourism OR destination",
            Country = country,
            Language = "en",
            IsTopHeadlines = false, // Since travel is a query, use everything
            Page = page,
            PageSize = pageSize
        };

        var fetchResult = await _newsApiService.FetchNewsAsync(context);
        if (fetchResult.Success)
        {
            try
            {
                using var doc = JsonDocument.Parse(fetchResult.Body);
                if (doc.RootElement.TryGetProperty("articles", out var newsArts) && newsArts.ValueKind == JsonValueKind.Array)
                {
                    foreach (var a in newsArts.EnumerateArray())
                    {
                        articles.Add(new
                        {
                            title = a.TryGetProperty("title", out var t) && t.ValueKind == JsonValueKind.String ? t.GetString() : null,
                            description = a.TryGetProperty("description", out var d) && d.ValueKind == JsonValueKind.String ? d.GetString() : null,
                            url = a.TryGetProperty("url", out var u) && u.ValueKind == JsonValueKind.String ? u.GetString() : null,
                            urlToImage = a.TryGetProperty("urlToImage", out var img) && img.ValueKind == JsonValueKind.String ? img.GetString() : null,
                            publishedAt = a.TryGetProperty("publishedAt", out var pub) && pub.ValueKind == JsonValueKind.String ? pub.GetString() : null,
                            source = a.TryGetProperty("source", out var src) && src.ValueKind != JsonValueKind.Null ? JsonSerializer.Deserialize<object>(src.GetRawText()) : new { name = "Travel News" }
                        });
                    }
                }
            }
            catch { /* Ignore parsing errors */ }
        }
        else
        {
            return StatusCode(fetchResult.StatusCode ?? 500, new { error = "Failed to fetch travel news", details = fetchResult.Body });
        }

        return Ok(new
        {
            status = "ok",
            totalResults = articles.Count,
            articles = articles
        });
    }
}
