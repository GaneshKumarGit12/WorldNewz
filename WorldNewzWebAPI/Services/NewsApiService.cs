using System.Net.Http;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Threading.Tasks;
using System;
using System.Linq;
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
        private static string _activeProvider = "NewsAPI"; // "NewsAPI" or "WorldNewsAPI"
        private static readonly object _lock = new object();

        // API Key configs
        private readonly string? _newsApiKey;
        private readonly string? _worldNewsApiKey;

        public NewsApiService(HttpClient httpClient)
        {
            _httpClient = httpClient;
            _newsApiKey = Environment.GetEnvironmentVariable("NEWS_API_KEY");
            _worldNewsApiKey = Environment.GetEnvironmentVariable("WORLDNEWS_API_KEY");
        }

        public async Task<NewsApiFetchResult> FetchNewsAsync(NewsQueryContext context)
        {
            string currentProvider;
            lock (_lock)
            {
                currentProvider = _activeProvider;
            }

            // Try the current active provider
            var result = currentProvider == "NewsAPI"
                ? await TryNewsApiAsync(context)
                : await TryWorldNewsApiAsync(context);

            // If success, return immediately
            if (result.Success) return result;

            // If failed due to Rate Limit / Quota Exceeded (429 or 402)
            if (result.StatusCode == 429 || result.StatusCode == 402)
            {
                // Switch provider
                lock (_lock)
                {
                    if (_activeProvider == currentProvider)
                    {
                        _activeProvider = currentProvider == "NewsAPI" ? "WorldNewsAPI" : "NewsAPI";
                        Console.WriteLine($"[NewsApiService] Provider {_activeProvider} reached daily limit. Switched to fallback provider.");
                    }
                }

                // Retry with the fallback provider
                return _activeProvider == "NewsAPI"
                    ? await TryNewsApiAsync(context)
                    : await TryWorldNewsApiAsync(context);
            }

            return result;
        }

        public async Task<NewsApiFetchResult> FetchCombinedNewsAsync(NewsQueryContext context)
        {
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

            return new NewsApiFetchResult(true, resultObject.ToJsonString(), 200);
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
