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
public class MoneyController : ControllerBase
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly INewsApiService _newsApiService;

    public MoneyController(IHttpClientFactory httpClientFactory, INewsApiService newsApiService)
    {
        _httpClientFactory = httpClientFactory;
        _newsApiService = newsApiService;
    }

    [HttpGet("money")]
    public async Task<IActionResult> GetMoney([FromQuery] string? country = "us")
    {
        var apiKey = Environment.GetEnvironmentVariable("MONEY_API_KEY");
        var articles = new List<object>();

        // 1. Fetch FMP API
        if (!string.IsNullOrWhiteSpace(apiKey))
        {
            var url = $"https://financialmodelingprep.com/stable/search-symbol?query=AAPL&apikey={apiKey}";
            try
            {
                var client = _httpClientFactory.CreateClient();
                var response = await client.GetAsync(url);
                
                if (response.IsSuccessStatusCode)
                {
                    var responseBody = await response.Content.ReadAsStringAsync();
                    using var doc = JsonDocument.Parse(responseBody);
                    var root = doc.RootElement;
                    if (root.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var item in root.EnumerateArray())
                        {
                            var name = item.TryGetProperty("name", out var n) ? n.GetString() : "Unknown";
                            var symbol = item.TryGetProperty("symbol", out var s) ? s.GetString() : "Unknown";
                            var currency = item.TryGetProperty("currency", out var c) ? c.GetString() : "";

                            articles.Add(new
                            {
                                title = $"{name} ({symbol})",
                                description = $"Exchange Data: Currency: {currency}. Source: FinancialModelingPrep",
                                url = "https://financialmodelingprep.com/",
                                urlToImage = "https://via.placeholder.com/600x400?text=FMP+Stock+Search",
                                publishedAt = DateTime.UtcNow.ToString("o"),
                                source = new { name = "Financial Modeling Prep" }
                            });
                        }
                    }
                }
            }
            catch (Exception)
            {
                // Continue
            }
        }

        // 2. Fetch standard News API populated articles
        country ??= "us";
        var context = new NewsQueryContext
        {
            Country = country,
            Category = "business",
            IsTopHeadlines = true,
            Page = 1,
            PageSize = 20
        };

        var fetchResult = await _newsApiService.FetchCombinedNewsAsync(context);
        if (fetchResult.Success)
        {
            try
            {
                Console.WriteLine("DEBUG BODY: " + fetchResult.Body);
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
                            source = a.TryGetProperty("source", out var src) && src.ValueKind != JsonValueKind.Null ? JsonSerializer.Deserialize<object>(src.GetRawText()) : new { name = "Business News" }
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
