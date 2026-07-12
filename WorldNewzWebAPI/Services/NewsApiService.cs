using System.Net.Http;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Threading.Tasks;
using System;
using System.Linq;
using Microsoft.Extensions.Caching.Memory;
using WorldNewzWebAPI.Models;

namespace WorldNewzWebAPI.Services
{
    public sealed record NewsApiFetchResult(bool Success, string Body, int? StatusCode);

    public interface INewsApiService
    {
        Task<NewsApiFetchResult> FetchNewsAsync(NewsQueryContext context);
        Task<NewsApiFetchResult> FetchCombinedNewsAsync(NewsQueryContext context);
    }

    public class NewsApiService : INewsApiService
    {
        private readonly HttpClient _httpClient;
        private readonly IMemoryCache _cache;
        private static readonly object _lock = new object();
        private static DateTime? _newsApiSuspendedUntil = null;
        private static DateTime? _worldNewsApiSuspendedUntil = null;
        private static bool _newsApiHasConfigError = false;
        private static bool _worldNewsApiHasConfigError = false;

        // API Key configs
        private readonly string? _newsApiKey;
        private readonly string? _worldNewsApiKey;

        public NewsApiService(HttpClient httpClient, IMemoryCache cache)
        {
            _httpClient = httpClient;
            _cache = cache;
            _newsApiKey = Environment.GetEnvironmentVariable("NEWS_API_KEY");
            _worldNewsApiKey = Environment.GetEnvironmentVariable("WORLDNEWS_API_KEY");
        }

        private static string GetActiveProvider()
        {
            lock (_lock)
            {
                var now = DateTime.UtcNow;
                bool newsApiSuspended = _newsApiSuspendedUntil.HasValue && now < _newsApiSuspendedUntil.Value;
                bool worldNewsApiSuspended = _worldNewsApiSuspendedUntil.HasValue && now < _worldNewsApiSuspendedUntil.Value;

                if (newsApiSuspended && !worldNewsApiSuspended)
                {
                    return "WorldNewsAPI";
                }
                if (worldNewsApiSuspended && !newsApiSuspended)
                {
                    return "NewsAPI";
                }
                // If both are suspended or neither is, default to NewsAPI
                return "NewsAPI";
            }
        }

        private static void SuspendProvider(string provider, int? statusCode)
        {
            lock (_lock)
            {
                var now = DateTime.UtcNow;
                if (statusCode == 429 || statusCode == 402)
                {
                    if (provider == "NewsAPI")
                    {
                        _newsApiSuspendedUntil = now.AddHours(1);
                        Console.WriteLine($"[NewsApiService] NewsAPI rate limited (status {statusCode}). Suspended for 1 hour until {_newsApiSuspendedUntil}");
                    }
                    else
                    {
                        _worldNewsApiSuspendedUntil = now.AddHours(1);
                        Console.WriteLine($"[NewsApiService] WorldNewsAPI rate limited (status {statusCode}). Suspended for 1 hour until {_worldNewsApiSuspendedUntil}");
                    }
                }
                else if (statusCode == 401 || statusCode == 403 || statusCode == 500)
                {
                    if (provider == "NewsAPI")
                    {
                        _newsApiSuspendedUntil = now.AddHours(24);
                        _newsApiHasConfigError = true;
                        Console.WriteLine($"[NewsApiService] NewsAPI configuration error (status {statusCode}). Suspended for 24 hours until {_newsApiSuspendedUntil}");
                    }
                    else
                    {
                        _worldNewsApiSuspendedUntil = now.AddHours(24);
                        _worldNewsApiHasConfigError = true;
                        Console.WriteLine($"[NewsApiService] WorldNewsAPI configuration error (status {statusCode}). Suspended for 24 hours until {_worldNewsApiSuspendedUntil}");
                    }
                }
            }
        }

        private static void ResetProviderStatus(string provider)
        {
            lock (_lock)
            {
                if (provider == "NewsAPI")
                {
                    _newsApiSuspendedUntil = null;
                    _newsApiHasConfigError = false;
                }
                else
                {
                    _worldNewsApiSuspendedUntil = null;
                    _worldNewsApiHasConfigError = false;
                }
            }
        }

        public async Task<NewsApiFetchResult> FetchNewsAsync(NewsQueryContext context)
        {
            var cacheKey = $"news_api_cache_{context.Query}_{context.Category}_{context.Country}_{context.Language}_{context.Page}_{context.PageSize}_{context.IsTopHeadlines}_{context.Source}";
            if (_cache.TryGetValue(cacheKey, out NewsApiFetchResult? cachedResult) && cachedResult != null)
            {
                Console.WriteLine($"[NewsApiService] Cache HIT for key: {cacheKey}");
                return cachedResult;
            }

            string primaryProvider = GetActiveProvider();
            var result = primaryProvider == "NewsAPI"
                ? await TryNewsApiAsync(context)
                : await TryWorldNewsApiAsync(context);

            if (result.Success)
            {
                ResetProviderStatus(primaryProvider);
            }
            else
            {
                // Suspend the failed provider
                SuspendProvider(primaryProvider, result.StatusCode);

                // Try the fallback provider
                string fallbackProvider = primaryProvider == "NewsAPI" ? "WorldNewsAPI" : "NewsAPI";
                
                // Only try fallback if it does not have a config error
                bool fallbackHasConfigError;
                lock (_lock)
                {
                    fallbackHasConfigError = fallbackProvider == "NewsAPI" ? _newsApiHasConfigError : _worldNewsApiHasConfigError;
                }

                if (!fallbackHasConfigError)
                {
                    Console.WriteLine($"[NewsApiService] Primary provider {primaryProvider} failed (Status: {result.StatusCode}). Retrying with fallback {fallbackProvider}...");
                    var fallbackResult = fallbackProvider == "NewsAPI"
                        ? await TryNewsApiAsync(context)
                        : await TryWorldNewsApiAsync(context);

                    if (fallbackResult.Success)
                    {
                        ResetProviderStatus(fallbackProvider);
                        result = fallbackResult;
                    }
                    else
                    {
                        // Suspend fallback provider too if it also failed
                        SuspendProvider(fallbackProvider, fallbackResult.StatusCode);
                        result = fallbackResult;
                    }
                }
            }

            if (result.Success)
            {
                _cache.Set(cacheKey, result, TimeSpan.FromMinutes(15));
            }

            return result;
        }

        public async Task<NewsApiFetchResult> FetchCombinedNewsAsync(NewsQueryContext context)
        {
            var cacheKey = $"news_api_combined_cache_{context.Query}_{context.Category}_{context.Country}_{context.Language}_{context.Page}_{context.PageSize}_{context.IsTopHeadlines}_{context.Source}";
            if (_cache.TryGetValue(cacheKey, out NewsApiFetchResult? cachedResult) && cachedResult != null)
            {
                Console.WriteLine($"[NewsApiService] Combined Cache HIT for key: {cacheKey}");
                return cachedResult;
            }

            var taskNews = TryNewsApiAsync(context);
            var taskWorld = TryWorldNewsApiAsync(context);

            await Task.WhenAll(taskNews, taskWorld);

            var combinedArticlesList = new System.Collections.Generic.List<JsonNode>();
            int totalResults = 0;

            if (taskNews.Result.Success)
            {
                using var doc = JsonDocument.Parse(taskNews.Result.Body);
                if (doc.RootElement.TryGetProperty("articles", out var newsArts) && newsArts.ValueKind == JsonValueKind.Array)
                {
                    totalResults += doc.RootElement.TryGetProperty("totalResults", out var tr) ? tr.GetInt32() : 0;
                    foreach (var a in newsArts.EnumerateArray()) combinedArticlesList.Add(JsonNode.Parse(a.GetRawText())!);
                }
            }

            if (taskWorld.Result.Success)
            {
                using var doc = JsonDocument.Parse(taskWorld.Result.Body);
                if (doc.RootElement.TryGetProperty("articles", out var worldArts) && worldArts.ValueKind == JsonValueKind.Array)
                {
                    totalResults += doc.RootElement.TryGetProperty("totalResults", out var tr) ? tr.GetInt32() : 0;
                    foreach (var a in worldArts.EnumerateArray()) combinedArticlesList.Add(JsonNode.Parse(a.GetRawText())!);
                }
            }

            var sortedArticles = combinedArticlesList.OrderBy(a => 
            {
                if (a is JsonObject obj && obj.TryGetPropertyValue("urlToImage", out var img) && img is JsonValue val && val.TryGetValue<string>(out var url))
                {
                    if (!string.IsNullOrWhiteSpace(url)) return 0;
                }
                return 1;
            }).ToList();

            var finalCombinedArray = new JsonArray();
            foreach(var a in sortedArticles) finalCombinedArray.Add(a);

            var resultObject = new JsonObject
            {
                ["status"] = "ok",
                ["totalResults"] = totalResults,
                ["articles"] = finalCombinedArray,
                ["queryUsed"] = "Combined APIs"
            };

            var result = new NewsApiFetchResult(true, resultObject.ToJsonString(), 200);

            if (taskNews.Result.Success || taskWorld.Result.Success)
            {
                _cache.Set(cacheKey, result, TimeSpan.FromMinutes(15));
            }

            return result;
        }

        private async Task<NewsApiFetchResult> TryNewsApiAsync(NewsQueryContext context)
        {
            if (string.IsNullOrWhiteSpace(_newsApiKey))
                return new NewsApiFetchResult(false, "{\"error\": \"Missing NEWS_API_KEY\"}", 500);

            string url;
            string langParam = $"language={context.Language ?? "en"}";
            string pageParam = $"page={context.Page}&pageSize={context.PageSize}&apiKey={_newsApiKey}";
            bool hasTextQuery = !string.IsNullOrWhiteSpace(context.Query);

            if (context.IsTopHeadlines)
            {
                string categoryPart = !string.IsNullOrEmpty(context.Category) && !context.Category.Equals("general", StringComparison.OrdinalIgnoreCase)
                    ? $"category={context.Category}"
                    : "";
                
                string countryPart = !string.IsNullOrEmpty(context.Country) ? $"country={context.Country}" : "";
                string queryPart = hasTextQuery ? $"q={Uri.EscapeDataString(context.Query!)}" : "";

                var parts = new[] { categoryPart, countryPart, queryPart }.Where(p => !string.IsNullOrEmpty(p));
                string combined = parts.Any() ? string.Join("&", parts) + "&" : "";

                url = $"https://newsapi.org/v2/top-headlines?{combined}{pageParam}";
            }
            else if (hasTextQuery)
            {
                url = $"https://newsapi.org/v2/everything?q={Uri.EscapeDataString(context.Query!)}&{langParam}&sortBy=relevancy&{pageParam}";
            }
            else
            {
                url = $"https://newsapi.org/v2/top-headlines?{langParam}&{pageParam}";
            }

            Console.WriteLine($"[NewsAPI URL] {url}");

            using var request = new HttpRequestMessage(HttpMethod.Get, url);
            // Required User-Agent by NewsAPI
            request.Headers.Add("User-Agent", "WorldNewzWebAPI/1.0");
            
            var response = await _httpClient.SendAsync(request);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                return new NewsApiFetchResult(false, responseBody, (int)response.StatusCode);
            }

            return new NewsApiFetchResult(true, AddQueryUsedField(responseBody, url), (int)response.StatusCode);
        }

        private async Task<NewsApiFetchResult> TryWorldNewsApiAsync(NewsQueryContext context)
        {
            if (string.IsNullOrWhiteSpace(_worldNewsApiKey))
                return new NewsApiFetchResult(false, "{\"error\": \"Missing WORLDNEWS_API_KEY\"}", 500);

            // WorldNewsAPI mappings
            int offset = (context.Page - 1) * context.PageSize;
            int number = context.PageSize;
            
            bool hasTextQuery = !string.IsNullOrWhiteSpace(context.Query);
            string url;

            if (context.IsTopHeadlines)
            {
                // For Top Headlines
                string cty = !string.IsNullOrWhiteSpace(context.Country) ? context.Country : "us"; // WorldNewsApi needs a valid country here
                url = $"https://api.worldnewsapi.com/top-news?api-key={_worldNewsApiKey}&source-country={cty}&language={context.Language ?? "en"}";
            }
            else
            {
                // For Everything/Search
                string textPart = hasTextQuery ? $"&text={Uri.EscapeDataString(context.Query!)}" : "";
                string cty = !string.IsNullOrWhiteSpace(context.Country) ? $"&source-countries={context.Country}" : "";
                
                url = $"https://api.worldnewsapi.com/search-news?api-key={_worldNewsApiKey}{textPart}{cty}&language={context.Language ?? "en"}&offset={offset}&number={number}";
            }

            Console.WriteLine($"[WorldNewsAPI URL] {url}");

            using var request = new HttpRequestMessage(HttpMethod.Get, url);
            var response = await _httpClient.SendAsync(request);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                return new NewsApiFetchResult(false, responseBody, (int)response.StatusCode);
            }

            // Map WorldNewsAPI response to NewsAPI schema
            return new NewsApiFetchResult(true, MapWorldNewsApiToNewsApiSchema(responseBody, url, context.IsTopHeadlines), (int)response.StatusCode);
        }

        private static string MapWorldNewsApiToNewsApiSchema(string jsonString, string queryUsed, bool isTopHeadlines)
        {
            try
            {
                using var document = JsonDocument.Parse(jsonString);
                var root = document.RootElement;
                
                var newArticles = new JsonArray();
                int totalResults = 0;

                if (isTopHeadlines)
                {
                    // /top-news endpoint returns { top_news: [ { news: [ {...} ] } ] }
                    if (root.TryGetProperty("top_news", out var topNews) && topNews.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var cluster in topNews.EnumerateArray())
                        {
                            if (cluster.TryGetProperty("news", out var clusterNews) && clusterNews.ValueKind == JsonValueKind.Array)
                            {
                                foreach (var article in clusterNews.EnumerateArray())
                                {
                                    newArticles.Add(MapArticleNode(article));
                                    totalResults++;
                                }
                            }
                        }
                    }
                }
                else
                {
                    // /search-news endpoint returns { available: X, news: [ {...} ] }
                    if (root.TryGetProperty("available", out var available))
                    {
                        totalResults = available.GetInt32();
                    }

                    if (root.TryGetProperty("news", out var newsArray) && newsArray.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var article in newsArray.EnumerateArray())
                        {
                            newArticles.Add(MapArticleNode(article));
                        }
                    }
                }

                var resultObject = new JsonObject
                {
                    ["status"] = "ok",
                    ["totalResults"] = totalResults,
                    ["articles"] = newArticles,
                    ["queryUsed"] = queryUsed // keep standard for UI
                };

                return resultObject.ToJsonString();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Error Mapping WorldNewsAPI] {ex.Message}");
                return jsonString; // Fallback to raw if logic fails
            }
        }

        private static JsonObject MapArticleNode(JsonElement article)
        {
            var authorStr = article.TryGetProperty("authors", out var authors) && authors.ValueKind == JsonValueKind.Array && authors.GetArrayLength() > 0
                                ? authors[0].GetString() 
                                : article.TryGetProperty("author", out var authorEl) ? authorEl.GetString() : null;

            return new JsonObject
            {
                ["source"] = new JsonObject { 
                    ["id"] = null, 
                    ["name"] = article.TryGetProperty("source_country", out var srcCountry) ? $"WorldNewsAPI ({srcCountry.GetString()})" : "WorldNewsAPI" 
                },
                ["author"] = authorStr,
                ["title"] = article.TryGetProperty("title", out var title) ? title.GetString() : null,
                ["description"] = article.TryGetProperty("summary", out var desc) ? desc.GetString() : article.TryGetProperty("text", out var text) ? text.GetString() : null,
                ["url"] = article.TryGetProperty("url", out var url) ? url.GetString() : null,
                ["urlToImage"] = article.TryGetProperty("image", out var image) ? image.GetString() : null,
                ["publishedAt"] = article.TryGetProperty("publish_date", out var pub) ? pub.GetString() : null,
                ["content"] = article.TryGetProperty("text", out var content) ? content.GetString() : null
            };
        }

        private static string AddQueryUsedField(string json, string queryUsed)
        {
            try
            {
                var node = JsonNode.Parse(json) as JsonObject;
                if (node != null)
                {
                    node["queryUsed"] = queryUsed;
                    return node.ToJsonString();
                }
            }
            catch
            {
                // Ignore
            }

            return json;
        }
    }
}
