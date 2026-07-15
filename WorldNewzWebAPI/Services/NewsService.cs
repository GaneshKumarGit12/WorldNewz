using System.Net.Http;
using System.Text.Json;
using WorldNewzWebAPI.Data;
using WorldNewzWebAPI.Models;

namespace WorldNewzWebAPI.Services
{
    public class NewsService
    {
        private readonly HttpClient _httpClient;
        private readonly WorldNewsDbContext _context;
        private readonly string _apiKey;
        private readonly IFacebookPostQueue _facebookQueue;

        public NewsService(IConfiguration config, WorldNewsDbContext context, HttpClient httpClient, IFacebookPostQueue facebookQueue)
        {
            _httpClient = httpClient;
            _context = context;
            _apiKey = config["NEWS_API_KEY"];
            _facebookQueue = facebookQueue;
        }

        public async Task FetchAndCacheNews(string category)
        {
            try
            {
                // Map categories to Saurav Tech API format
                var normalizedCategory = (category ?? "discover").Trim().ToLowerInvariant();
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

                var apiCategory = categoryMap.ContainsKey(normalizedCategory)
                    ? categoryMap[normalizedCategory]
                    : "general";

                var url = $"https://saurav.tech/NewsAPI/top-headlines/category/{apiCategory}/in.json";
                var response = await _httpClient.GetStringAsync(url);

                var json = JsonSerializer.Deserialize<Dictionary<string, object>>(response);
                if (json != null && json.ContainsKey("articles"))
                {
                    var articles = JsonSerializer.Deserialize<List<Dictionary<string, object>>>(json["articles"].ToString() ?? "[]");
                    var newArticlesToPost = new List<NewsArticle>();

                    foreach (var article in articles!)
                    {
                        var articleUrl = article["url"]?.ToString();
                        
                        // Check if article already exists to prevent duplicates
                        if (!string.IsNullOrEmpty(articleUrl) && !_context.NewsArticles.Any(a => a.Url == articleUrl))
                        {
                            var news = new NewsArticle
                            {
                                Title = article["title"]?.ToString() ?? "",
                                Description = article["description"]?.ToString(),
                                Url = articleUrl,
                                ImageUrl = article["urlToImage"]?.ToString(),
                                PublishedAt = DateTime.TryParse(article["publishedAt"]?.ToString(), out var dt) ? dt : null,
                                CachedAt = DateTime.Now,
                                CategoryId = _context.Categories.FirstOrDefault(c => c.Name == category)?.Id ?? 1
                            };

                            _context.NewsArticles.Add(news);
                            newArticlesToPost.Add(news);
                        }
                    }

                    await _context.SaveChangesAsync();

                    // Dynamically post up to 5 unique new articles to Facebook page
                    if (newArticlesToPost.Any())
                    {
                        var articlesToPost = newArticlesToPost.Take(5).ToList();
                        Console.WriteLine($"[NewsService] Found {newArticlesToPost.Count} new articles for '{category}'. Enqueuing {articlesToPost.Count} for Facebook.");
                        foreach(var article in articlesToPost)
                        {
                            await _facebookQueue.EnqueuePostAsync(article);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error fetching news for category '{category}': {ex.Message}");
            }
        }
    }
}