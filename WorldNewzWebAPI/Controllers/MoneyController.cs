using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using System.Net.Http;
using System.Collections.Generic;
using System;
using System.Text.Json;
using WorldNewzWebAPI.Services;
using WorldNewzWebAPI.Models;

namespace WorldNewzWebAPI.Controllers
{
    [ApiController]
    [Route("api/news")]
    public class MoneyController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly INewsApiService _newsApiService;
        private readonly INewsEnrichmentService _enrichmentService;

        public MoneyController(
            IHttpClientFactory httpClientFactory, 
            INewsApiService newsApiService,
            INewsEnrichmentService enrichmentService)
        {
            _httpClientFactory = httpClientFactory;
            _newsApiService = newsApiService;
            _enrichmentService = enrichmentService;
        }

        [HttpGet("money")]
        public async Task<IActionResult> GetMoney(
            [FromQuery] string? country = "us",
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var apiKey = Environment.GetEnvironmentVariable("MONEY_API_KEY");
            var articles = new List<NewsArticleDto>();

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

                                articles.Add(new NewsArticleDto
                                {
                                    Title = $"{name} ({symbol})",
                                    Description = $"Exchange Data: Currency: {currency}. Source: FinancialModelingPrep",
                                    Url = "https://financialmodelingprep.com/",
                                    UrlToImage = "https://via.placeholder.com/600x400?text=FMP+Stock+Search",
                                    PublishedAt = DateTime.UtcNow,
                                    Source = new SourceDto { Name = "Financial Modeling Prep" },
                                    Verified = true,
                                    Headline = $"{name} ({symbol}) Stock Exchange Info",
                                    Summary = $"Stock market data for {name} ({symbol}) trading in currency {currency}.",
                                    Context = "This tracks financial exchange data retrieved dynamically from Financial Modeling Prep.",
                                    SocialMediaHook = $"Markets Check: {name} ({symbol}). #Finance #Stocks",
                                    Category = "Money"
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
                Page = page,
                PageSize = pageSize
            };

            var fetchResult = await _newsApiService.FetchCombinedNewsAsync(context);
            if (fetchResult.Success)
            {
                try
                {
                    var apiResponse = JsonSerializer.Deserialize<NewsApiResponse>(fetchResult.Body, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    var rawArticles = apiResponse?.Articles ?? new List<Article>();
                    var enriched = await _enrichmentService.FilterDeduplicateAndEnrichAsync(rawArticles, "Money");
                    articles.AddRange(enriched);
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
}
