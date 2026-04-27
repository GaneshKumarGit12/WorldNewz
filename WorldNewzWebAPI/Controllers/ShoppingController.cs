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
public class ShoppingController : ControllerBase
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly INewsApiService _newsApiService;

    public ShoppingController(IHttpClientFactory httpClientFactory, INewsApiService newsApiService)
    {
        _httpClientFactory = httpClientFactory;
        _newsApiService = newsApiService;
    }

    [HttpGet("shopping")]
    public async Task<IActionResult> GetShopping([FromQuery] string? country = "us")
    {
        var shoppingKey = Environment.GetEnvironmentVariable("SHOPPING_API_KEY");
        var algoliaAppId = Environment.GetEnvironmentVariable("ALGOLIA_APP_ID");
        var articles = new List<object>();

        // 1. Fetch Algolia API
        if (!string.IsNullOrWhiteSpace(shoppingKey) && !string.IsNullOrWhiteSpace(algoliaAppId))
        {
            var url = $"https://{algoliaAppId}-dsn.algolia.net/1/keys/ALGOLIA_API_KEY";
            try
            {
                var client = _httpClientFactory.CreateClient();
                var request = new HttpRequestMessage(HttpMethod.Get, url);
                
                request.Headers.Add("X-Algolia-API-Key", shoppingKey);
                request.Headers.Add("X-Algolia-Application-Id", algoliaAppId);

                var response = await client.SendAsync(request);
                var responseBody = await response.Content.ReadAsStringAsync();

                articles.Add(new
                {
                    title = "Algolia Key Metadata",
                    description = responseBody,
                    url = "https://algolia.com",
                    urlToImage = "https://via.placeholder.com/600x400?text=Algolia+Data",
                    publishedAt = DateTime.UtcNow.ToString("o"),
                    source = new { name = "Algolia Search Backend" }
                });
            }
            catch (Exception)
            {
                // Continue
            }
        }

        // 2. Fetch standard News API populated articles
        country ??= "in";
        var context = new NewsQueryContext
        {
            Country = country,
            Query = "shopping",
            IsTopHeadlines = false,
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
                            source = a.TryGetProperty("source", out var src) && src.ValueKind != JsonValueKind.Null ? JsonSerializer.Deserialize<object>(src.GetRawText()) : new { name = "Shopping News" }
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
