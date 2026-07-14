using System.Net.Http;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Threading.Tasks;
using System;
using System.Linq;
using Microsoft.Extensions.Caching.Memory;
using WorldNewzWebAPI.Models;
using WorldNewzWebAPI.Data;
using Microsoft.EntityFrameworkCore;

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
        private readonly WorldNewsDbContext _db;
        private static readonly object _lock = new object();
        private static DateTime? _newsApiSuspendedUntil = null;
        private static DateTime? _worldNewsApiSuspendedUntil = null;
        private static bool _newsApiHasConfigError = false;
        private static bool _worldNewsApiHasConfigError = false;

        // API Key configs
        private readonly string? _newsApiKey;
        private readonly string? _worldNewsApiKey;

        public NewsApiService(HttpClient httpClient, IMemoryCache cache, WorldNewsDbContext db)
        {
            _httpClient = httpClient;
            _cache = cache;
            _db = db;
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

        private string MapContextToCategory(NewsQueryContext context)
        {
            if (!string.IsNullOrEmpty(context.Category))
            {
                if (context.Category.Equals("general", StringComparison.OrdinalIgnoreCase)) return "Discover";
                if (context.Category.Equals("business", StringComparison.OrdinalIgnoreCase)) return "Business";
                if (context.Category.Equals("technology", StringComparison.OrdinalIgnoreCase)) return "Technology";
                if (context.Category.Equals("sports", StringComparison.OrdinalIgnoreCase)) return "Sports";
                if (context.Category.Equals("science", StringComparison.OrdinalIgnoreCase)) return "Science-Health";
                if (context.Category.Equals("health", StringComparison.OrdinalIgnoreCase)) return "Science-Health";
                if (context.Category.Equals("entertainment", StringComparison.OrdinalIgnoreCase)) return "Entertainment";
                return context.Category;
            }

            if (!string.IsNullOrEmpty(context.Query))
            {
                var q = context.Query.ToLowerInvariant();
                if (q.Contains("politics") || q.Contains("election") || q.Contains("government")) return "Politics";
                if (q.Contains("science") || q.Contains("health") || q.Contains("medical") || q.Contains("space") || q.Contains("environment")) return "Science-Health";
                if (q.Contains("lifestyle") || q.Contains("fashion") || q.Contains("wellness")) return "Lifestyle";
                if (q.Contains("education") || q.Contains("learning") || q.Contains("student")) return "Education";
                if (q.Contains("opinion") || q.Contains("editorial") || q.Contains("perspective")) return "Opinion";
                if (q.Contains("trending") || q.Contains("viral") || q.Contains("meme")) return "Trending";
                if (q.Contains("podcast") || q.Contains("video") || q.Contains("interview")) return "Podcasts-Videos";
                if (q.Contains("telangana") || q.Contains("hyderabad") || q.Contains("local")) return "Local News";
                if (q.Contains("service") || q.Contains("consultant") || q.Contains("saas")) return "Services";
                if (q.Contains("gaming") || q.Contains("e-sports") || q.Contains("xbox") || q.Contains("playstation")) return "Gaming";
                if (q.Contains("cartoon") || q.Contains("anime") || q.Contains("manga")) return "Cartoons";
                if (q.Contains("food") || q.Contains("dining") || q.Contains("recipe")) return "Food";
                if (q.Contains("travel") || q.Contains("hotel") || q.Contains("destination")) return "Travel";
                if (q.Contains("sports") || q.Contains("cricket") || q.Contains("football")) return "Sports";
                if (q.Contains("finance") || q.Contains("stock") || q.Contains("market") || q.Contains("money")) return "Money";
                if (q.Contains("shopping") || q.Contains("deals") || q.Contains("e-commerce")) return "Shopping";
            }

            return "Discover";
        }

        private async Task<NewsApiFetchResult> GetDatabaseFallbackResult(NewsQueryContext context)
        {
            try
            {
                var categoryName = MapContextToCategory(context);
                
                // Fetch the category
                var category = await _db.Categories.FirstOrDefaultAsync(c => c.Name.ToLower() == categoryName.ToLower());
                if (category == null)
                {
                    category = await _db.Categories.FirstOrDefaultAsync(c => c.Name.ToLower().Contains(categoryName.ToLower()) || categoryName.ToLower().Contains(c.Name.ToLower()));
                }

                if (category != null)
                {
                    var offset = (context.Page - 1) * context.PageSize;
                    var dbArticles = await _db.NewsArticles
                        .Where(a => a.CategoryId == category.Id)
                        .OrderByDescending(a => a.PublishedAt ?? a.CachedAt)
                        .Skip(offset)
                        .Take(context.PageSize)
                        .ToListAsync();

                    if (dbArticles.Any())
                    {
                        Console.WriteLine($"[NewsApiService] Using database fallback for category: {categoryName} (Count: {dbArticles.Count})");
                        
                        // Map database articles to the News API JSON schema
                        var articlesJson = dbArticles.Select(a => new
                        {
                            title = a.Title,
                            description = a.Description,
                            url = a.Url ?? "",
                            urlToImage = a.ImageUrl,
                            publishedAt = (a.PublishedAt ?? a.CachedAt).ToString("yyyy-MM-ddTHH:mm:ssZ"),
                            source = new { name = "WorldNewz Archive" }
                        }).ToList();

                        var responseObj = new
                        {
                            status = "ok",
                            totalResults = dbArticles.Count,
                            articles = articlesJson
                        };

                        var jsonString = JsonSerializer.Serialize(responseObj);
                        return new NewsApiFetchResult(true, jsonString, 200);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[NewsApiService] DB fallback generation failed: {ex.Message}");
            }
            
            return new NewsApiFetchResult(false, "{\"status\":\"error\",\"message\":\"All news providers failed and database fallback was empty.\"}", 500);
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

            if (!result.Success)
            {
                Console.WriteLine("[NewsApiService] Primary/Fallback API providers failed. Trying SauravTech backup...");
                var backupResult = await TrySauravTechBackupAsync(context);
                if (backupResult.Success)
                {
                    result = backupResult;
                }
                else
                {
                    var dbFallback = await GetDatabaseFallbackResult(context);
                    if (dbFallback.Success)
                    {
                        result = dbFallback;
                    }
                }
            }

            if (result.Success)
            {
                var cacheDuration = result.Body.Contains("WorldNewz Archive")
                    ? TimeSpan.FromMinutes(15)
                    : TimeSpan.FromMinutes(60);
                _cache.Set(cacheKey, result, cacheDuration);
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

            if (combinedArticlesList.Count == 0)
            {
                Console.WriteLine("[NewsApiService] Combined news list is empty. Trying SauravTech backup...");
                var backupResult = await TrySauravTechBackupAsync(context);
                if (backupResult.Success)
                {
                    _cache.Set(cacheKey, backupResult, TimeSpan.FromMinutes(60));
                    return backupResult;
                }

                var dbFallback = await GetDatabaseFallbackResult(context);
                if (dbFallback.Success)
                {
                    _cache.Set(cacheKey, dbFallback, TimeSpan.FromMinutes(15));
                    return dbFallback;
                }
            }

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
                _cache.Set(cacheKey, result, TimeSpan.FromMinutes(60));
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

        private async Task<NewsApiFetchResult> TrySauravTechBackupAsync(NewsQueryContext context)
        {
            try
            {
                var categoryMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    { "discover", "general" },
                    { "sports", "sports" },
                    { "money", "business" },
                    { "weather", "health" }, 
                    { "shopping", "entertainment" },
                    { "politics", "general" },
                    { "technology", "technology" },
                    { "business", "business" },
                    { "science-health", "science" },
                    { "lifestyle", "general" },
                    { "education", "general" },
                    { "entertainment", "entertainment" },
                    { "food", "health" },
                    { "travel", "general" },
                    { "gaming", "technology" },
                    { "cartoons", "entertainment" },
                    { "services", "general" }
                };

                var cat = "general";
                if (!string.IsNullOrEmpty(context.Category) && categoryMap.TryGetValue(context.Category, out var mappedCat))
                {
                    cat = mappedCat;
                }
                else if (!string.IsNullOrEmpty(context.Query))
                {
                    var q = context.Query.ToLowerInvariant();
                    if (q.Contains("politics") || q.Contains("election")) cat = "general";
                    else if (q.Contains("science") || q.Contains("health") || q.Contains("medical")) cat = "science";
                    else if (q.Contains("business") || q.Contains("finance") || q.Contains("stock") || q.Contains("money")) cat = "business";
                    else if (q.Contains("tech") || q.Contains("comput") || q.Contains("software")) cat = "technology";
                    else if (q.Contains("sports") || q.Contains("cricket") || q.Contains("football")) cat = "sports";
                    else if (q.Contains("entertain") || q.Contains("movie") || q.Contains("music")) cat = "entertainment";
                }

                var country = string.Equals(context.Country, "in", StringComparison.OrdinalIgnoreCase) ? "in" : "us";
                var url = $"https://saurav.tech/NewsAPI/top-headlines/category/{cat}/{country}.json";

                Console.WriteLine($"[SauravTech NewsAPI Backup URL] {url}");

                using var request = new HttpRequestMessage(HttpMethod.Get, url);
                var response = await _httpClient.SendAsync(request);
                var responseBody = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    return new NewsApiFetchResult(false, responseBody, (int)response.StatusCode);
                }

                return new NewsApiFetchResult(true, AddQueryUsedField(responseBody, url), (int)response.StatusCode);
            }
            catch (Exception ex)
            {
                return new NewsApiFetchResult(false, $"{{\"error\": \"SauravTech backup failed: {ex.Message}\"}}", 500);
            }
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
