using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using System.Net.Http;
using System.Collections.Generic;
using System;
using System.Text.Json;
using WorldNewzWebAPI.Services;
using WorldNewzWebAPI.Models;

[ApiController]
[Route("api/news")]
public class SportsController : ControllerBase
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly INewsApiService _newsApiService;

    public SportsController(IHttpClientFactory httpClientFactory, INewsApiService newsApiService)
    {
        _httpClientFactory = httpClientFactory;
        _newsApiService = newsApiService;
    }

    [HttpGet("sports")]
    public async Task<IActionResult> GetSports([FromQuery] string? country = "us")
    {
        var apiKey = Environment.GetEnvironmentVariable("SPORTS_API_KEY");
        var articles = new List<object>();

        // 1. Fetch ClearSports API
        if (!string.IsNullOrWhiteSpace(apiKey))
        {
            var url = "https://api.clearsportsapi.com/api/v1/api-keys/me";
            try
            {
                var client = _httpClientFactory.CreateClient();
                var request = new HttpRequestMessage(HttpMethod.Get, url);
                request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);

                var response = await client.SendAsync(request);
                var responseBody = await response.Content.ReadAsStringAsync();

                articles.Add(new
                {
                    title = "Clear Sports API Profile",
                    description = responseBody,
                    url = url,
                    urlToImage = "https://via.placeholder.com/600x400?text=Clear+Sports+API",
                    publishedAt = DateTime.UtcNow.ToString("o"),
                    source = new { name = "Clear Sports API" }
                });
            }
            catch (Exception)
            {
                // Continue without failing the whole request
            }
        }

        // 2. Fetch standard News API populated articles
        country ??= "us";
        var context = new NewsQueryContext
        {
            Country = country,
            Category = "sports",
            IsTopHeadlines = true,
            Page = 1,
            PageSize = 20
        };

        var fetchResult = await _newsApiService.FetchCombinedNewsAsync(context);
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
                            source = a.TryGetProperty("source", out var src) && src.ValueKind != JsonValueKind.Null ? JsonSerializer.Deserialize<object>(src.GetRawText()) : new { name = "Sports News" }
                        });
                    }
                }
            }
            catch { /* Ignore parsing errors */ }
        }

        return Ok(new
        {
            status = "ok",
            totalResults = articles.Count,
            articles = articles
        });
    }
}
