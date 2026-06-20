using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using WorldNewzWebAPI.Models;

namespace WorldNewzWebAPI.Services
{
    public interface IGNewsService
    {
        Task<List<Article>> GetTopHeadlinesAsync(string country);
        Task<List<Article>> GetMoreLocalNewsAsync(string country, int page);
    }

    public class GNewsService : IGNewsService
    {
        private readonly HttpClient _httpClient;
        private readonly IMemoryCache _cache;
        private readonly ILogger<GNewsService> _logger;
        private readonly string? _apiKey;

        public GNewsService(HttpClient httpClient, IMemoryCache cache, ILogger<GNewsService> logger)
        {
            _httpClient = httpClient;
            _cache = cache;
            _logger = logger;
            _apiKey = Environment.GetEnvironmentVariable("GNEWS_API_KEY");
        }

        public async Task<List<Article>> GetTopHeadlinesAsync(string country)
        {
            if (string.IsNullOrWhiteSpace(_apiKey))
            {
                _logger.LogError("GNEWS_API_KEY is not configured.");
                throw new InvalidOperationException("GNews API Key is missing.");
            }

            string countryCode = country.Trim().ToLower();
            string cacheKey = $"gnews_top_{countryCode}";
            if (_cache.TryGetValue(cacheKey, out List<Article>? cachedList) && cachedList != null)
            {
                _logger.LogInformation("Cache HIT for GNews top headlines: {Country}", countryCode);
                return cachedList;
            }

            string url = $"https://gnews.io/api/v4/top-headlines?category=general&lang=en&country={countryCode}&max=10&apikey={_apiKey}";
            
            try
            {
                var response = await _httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();
                var content = await response.Content.ReadAsStringAsync();
                
                var gnewsResponse = JsonSerializer.Deserialize<GNewsApiResponse>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                var mapped = MapGNewsResponse(gnewsResponse);
                
                _cache.Set(cacheKey, mapped, TimeSpan.FromMinutes(10));
                return mapped;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to fetch top headlines from GNews for country: {Country}", countryCode);
                throw;
            }
        }

        public async Task<List<Article>> GetMoreLocalNewsAsync(string country, int page)
        {
            if (string.IsNullOrWhiteSpace(_apiKey))
            {
                _logger.LogError("GNEWS_API_KEY is not configured.");
                throw new InvalidOperationException("GNews API Key is missing.");
            }

            string countryCode = country.Trim().ToLower();
            string cacheKey = $"gnews_more_{countryCode}_page_{page}";
            if (_cache.TryGetValue(cacheKey, out List<Article>? cachedList) && cachedList != null)
            {
                _logger.LogInformation("Cache HIT for GNews more local news: {Country}, Page {Page}", countryCode, page);
                return cachedList;
            }

            string url = $"https://gnews.io/api/v4/top-headlines?category=nation&lang=en&country={countryCode}&max=9&page={page}&apikey={_apiKey}";
            
            try
            {
                var response = await _httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();
                var content = await response.Content.ReadAsStringAsync();
                
                var gnewsResponse = JsonSerializer.Deserialize<GNewsApiResponse>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                var mapped = MapGNewsResponse(gnewsResponse);
                
                _cache.Set(cacheKey, mapped, TimeSpan.FromMinutes(10));
                return mapped;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to fetch more local news from GNews for country: {Country}, page: {Page}", countryCode, page);
                throw;
            }
        }

        private List<Article> MapGNewsResponse(GNewsApiResponse? gnewsResponse)
        {
            var list = new List<Article>();
            if (gnewsResponse?.Articles == null) return list;

            foreach (var a in gnewsResponse.Articles)
            {
                list.Add(new Article
                {
                    Title = a.Title,
                    Description = a.Description ?? "",
                    Url = a.Url,
                    UrlToImage = a.Image ?? "",
                    PublishedAt = a.PublishedAt,
                    Source = new Source
                    {
                        Id = string.Empty,
                        Name = a.Source?.Name ?? "News"
                    }
                });
            }
            return list;
        }

        // Inner classes to parse GNews schema
        private class GNewsApiResponse
        {
            public int TotalArticles { get; set; }
            public List<GNewsArticle> Articles { get; set; } = new();
        }

        private class GNewsArticle
        {
            public string Title { get; set; } = "";
            public string? Description { get; set; }
            public string? Content { get; set; }
            public string Url { get; set; } = "";
            public string? Image { get; set; }
            public DateTime? PublishedAt { get; set; }
            public GNewsSource? Source { get; set; }
        }

        private class GNewsSource
        {
            public string? Name { get; set; }
            public string? Url { get; set; }
        }
    }
}
