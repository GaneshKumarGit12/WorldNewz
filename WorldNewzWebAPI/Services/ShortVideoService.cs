using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;

namespace WorldNewzWebAPI.Services
{
    public class ShortVideoService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;

        public ShortVideoService(HttpClient httpClient)
        {
            _httpClient = httpClient;
            _apiKey = Environment.GetEnvironmentVariable("WN_YOUTUBE_KEY") ?? "";
        }

        public async Task<List<ShortVideo>> GetTrendingShortVideosAsync()
        {
            if (string.IsNullOrWhiteSpace(_apiKey))
            {
                return GetDefaultVideos();
            }

            try
            {
                // Query YouTube API v3 search for short video clips under 'shorts' keyword
                var query = "shorts news technology finance";
                var url = $"https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q={Uri.EscapeDataString(query)}&maxResults=6&videoDuration=short&key={_apiKey}";
                
                using var request = new HttpRequestMessage(HttpMethod.Get, url);
                // Standard user-agent headers
                request.Headers.Add("User-Agent", "WorldNewzApp/1.0");

                using var response = await _httpClient.SendAsync(request);
                if (!response.IsSuccessStatusCode)
                {
                    return GetDefaultVideos();
                }

                var text = await response.Content.ReadAsStringAsync();
                using var json = JsonDocument.Parse(text);
                var root = json.RootElement;

                if (!root.TryGetProperty("items", out var items) || items.GetArrayLength() == 0)
                {
                    return GetDefaultVideos();
                }

                var resultList = new List<ShortVideo>();
                var random = new Random();

                foreach (var item in items.EnumerateArray())
                {
                    if (!item.TryGetProperty("id", out var idElement) || 
                        !idElement.TryGetProperty("videoId", out var videoIdElement))
                    {
                        continue;
                    }

                    var videoId = videoIdElement.GetString() ?? string.Empty;
                    var snippet = item.GetProperty("snippet");
                    var title = snippet.GetProperty("title").GetString() ?? "Trending Short";
                    var author = snippet.GetProperty("channelTitle").GetString() ?? "YouTube Channel";
                    var thumbnails = snippet.GetProperty("thumbnails");
                    var imageUrl = thumbnails.TryGetProperty("high", out var highThumb) 
                        ? highThumb.GetProperty("url").GetString() ?? "" 
                        : thumbnails.GetProperty("default").GetProperty("url").GetString() ?? "";

                    // Construct embedded loop player link
                    var videoUrl = $"https://www.youtube.com/embed/{videoId}";

                    // Simulated metrics for premium feel
                    var viewsBase = random.Next(250, 4800);
                    var viewsText = viewsBase >= 1000 ? $"{((double)viewsBase / 1000.0).ToString("0.1")}M" : $"{viewsBase}K";
                    var likes = random.Next(15000, 140000);
                    var comments = random.Next(80, 2400);

                    resultList.Add(new ShortVideo
                    {
                        Id = videoId,
                        Title = System.Net.WebUtility.HtmlDecode(title),
                        VideoUrl = videoUrl,
                        ViewsCount = viewsText,
                        LikesCount = likes,
                        CommentsCount = comments,
                        Author = author,
                        AuthorAvatar = imageUrl,
                        Category = "Trending",
                        Duration = "0:59"
                    });
                }

                return resultList.Count > 0 ? resultList : GetDefaultVideos();
            }
            catch
            {
                return GetDefaultVideos();
            }
        }

        private List<ShortVideo> GetDefaultVideos()
        {
            return new List<ShortVideo>
            {
                new ShortVideo
                {
                    Id = "vid-1",
                    Title = "Global Tech & AI Revolution: What's Next in 2026? 🤖",
                    VideoUrl = "https://assets.mixkit.co/videos/preview/mixkit-futuristic-robot-head-interface-34440-large.mp4",
                    ViewsCount = "1.2M",
                    LikesCount = 84200,
                    CommentsCount = 1420,
                    Author = "TechCrunch Daily",
                    AuthorAvatar = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=60",
                    Category = "Technology",
                    Duration = "0:15"
                },
                new ShortVideo
                {
                    Id = "vid-2",
                    Title = "Why the Stock Market is Fluctuating Today 📈",
                    VideoUrl = "https://assets.mixkit.co/videos/preview/mixkit-hand-holding-a-smartphone-with-a-financial-app-41617-large.mp4",
                    ViewsCount = "920K",
                    LikesCount = 61200,
                    CommentsCount = 890,
                    Author = "Market Watchers",
                    AuthorAvatar = "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=100&auto=format&fit=crop&q=60",
                    Category = "Business",
                    Duration = "0:12"
                },
                new ShortVideo
                {
                    Id = "vid-3",
                    Title = "Incoming Monsoon & Severe Storm Warnings 🌧️",
                    VideoUrl = "https://assets.mixkit.co/videos/preview/mixkit-rain-falling-on-a-window-pane-4054-large.mp4",
                    ViewsCount = "2.4M",
                    LikesCount = 153000,
                    CommentsCount = 4500,
                    Author = "Weather Channel",
                    AuthorAvatar = "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=100&auto=format&fit=crop&q=60",
                    Category = "Weather",
                    Duration = "0:09"
                }
            };
        }
    }

    public class ShortVideo
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string VideoUrl { get; set; } = string.Empty;
        public string ViewsCount { get; set; } = string.Empty;
        public int LikesCount { get; set; }
        public int CommentsCount { get; set; }
        public string Author { get; set; } = string.Empty;
        public string AuthorAvatar { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Duration { get; set; } = string.Empty;
    }
}
