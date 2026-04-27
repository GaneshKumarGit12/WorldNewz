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

        public NewsService(IConfiguration config, WorldNewsDbContext context, HttpClient httpClient)
            {
                _httpClient = httpClient;
                _context = context;
                _apiKey = config["NEWS_API_KEY"];
            }

        public async Task FetchAndCacheNews(string category)
        {
            try
            {
                // Map categories to Saurav Tech API format
                var categoryMap = new Dictionary<string, string>
                {
                    { "discover", "general" },
                    { "sports", "sports" },
                    { "money", "business" },
                    { "weather", "health" }, // Using health as closest match for weather
                    { "shopping", "entertainment" } // Using entertainment for shopping
                };

                var apiCategory = categoryMap.ContainsKey(category.ToLower()) 
                    ? categoryMap[category.ToLower()] 
                    : "general";

                var url = $"https://saurav.tech/NewsAPI/top-headlines/category/{apiCategory}/in.json";
                var response = await _httpClient.GetStringAsync(url);

                var json = JsonSerializer.Deserialize<Dictionary<string, object>>(response);
                if (json != null && json.ContainsKey("articles"))
                {
                    var articles = JsonSerializer.Deserialize<List<Dictionary<string, object>>>(json["articles"].ToString() ?? "[]");

                    foreach (var article in articles!)
                    {
                        var news = new NewsArticle
                        {
                            Title = article["title"]?.ToString() ?? "",
                            Description = article["description"]?.ToString(),
                            Url = article["url"]?.ToString(),
                            ImageUrl = article["urlToImage"]?.ToString(),
                            PublishedAt = DateTime.TryParse(article["publishedAt"]?.ToString(), out var dt) ? dt : null,
                            CachedAt = DateTime.Now,
                            CategoryId = _context.Categories.FirstOrDefault(c => c.Name == category)?.Id ?? 1
                        };

                        _context.NewsArticles.Add(news);
                    }

                    await _context.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error fetching news for category '{category}': {ex.Message}");
            }
        }
    }
}