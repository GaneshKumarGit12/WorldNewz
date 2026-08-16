using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;

namespace WorldNewzWebAPI.Services
{
    public class LiveStreamItem
    {
        public string VideoId { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string ChannelTitle { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string ThumbnailUrl { get; set; } = string.Empty;
        public string EmbedUrl { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public bool IsLive { get; set; } = true;
        public DateTime FetchedAt { get; set; } = DateTime.UtcNow;
    }

    public class LiveStreamService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private static readonly ConcurrentDictionary<string, (LiveStreamItem Stream, DateTime CachedAt)> _cache = new();
        private static readonly TimeSpan CacheDuration = TimeSpan.FromHours(1);

        public LiveStreamService(HttpClient httpClient)
        {
            _httpClient = httpClient;
            _apiKey = Environment.GetEnvironmentVariable("WN_YOUTUBE_KEY") ?? "";
        }

        public async Task<LiveStreamItem> GetLiveStreamAsync(string? category)
        {
            var normalizedCategory = NormalizeCategory(category);

            // Check cache
            if (_cache.TryGetValue(normalizedCategory, out var cached) && DateTime.UtcNow - cached.CachedAt < CacheDuration)
            {
                return cached.Stream;
            }

            // Attempt live YouTube API search if key is configured
            if (!string.IsNullOrWhiteSpace(_apiKey))
            {
                try
                {
                    var liveStream = await FetchLiveStreamFromYouTubeAsync(normalizedCategory);
                    if (liveStream != null)
                    {
                        _cache[normalizedCategory] = (liveStream, DateTime.UtcNow);
                        return liveStream;
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[LiveStreamService] YouTube API fetch exception for '{normalizedCategory}': {ex.Message}");
                }
            }

            // Fallback to verified category 24/7 stream
            var fallback = GetFallbackLiveStream(normalizedCategory);
            _cache[normalizedCategory] = (fallback, DateTime.UtcNow);
            return fallback;
        }

        private async Task<LiveStreamItem?> FetchLiveStreamFromYouTubeAsync(string category)
        {
            string searchQuery = GetCategorySearchQuery(category);
            var url = $"https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&eventType=live&q={Uri.EscapeDataString(searchQuery)}&maxResults=1&order=relevance&key={_apiKey}";

            using var request = new HttpRequestMessage(HttpMethod.Get, url);
            request.Headers.Add("User-Agent", "WorldNewzApp/1.0");
            request.Headers.Add("Referer", "https://worldnewzs.in/");

            using var response = await _httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"[LiveStreamService] YouTube API Error: {response.StatusCode} - {errorContent}");
                return null;
            }

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);

            if (doc.RootElement.TryGetProperty("items", out var items) && items.GetArrayLength() > 0)
            {
                var firstItem = items[0];
                var videoId = firstItem.GetProperty("id").GetProperty("videoId").GetString() ?? "";
                var snippet = firstItem.GetProperty("snippet");
                var title = snippet.GetProperty("title").GetString() ?? $"{category} Live Stream";
                var channelTitle = snippet.GetProperty("channelTitle").GetString() ?? "Live News Network";
                var description = snippet.GetProperty("description").GetString() ?? "";

                string thumbUrl = "";
                if (snippet.TryGetProperty("thumbnails", out var thumbs))
                {
                    if (thumbs.TryGetProperty("high", out var highThumb))
                        thumbUrl = highThumb.GetProperty("url").GetString() ?? "";
                    else if (thumbs.TryGetProperty("medium", out var medThumb))
                        thumbUrl = medThumb.GetProperty("url").GetString() ?? "";
                }

                if (string.IsNullOrEmpty(thumbUrl))
                {
                    thumbUrl = $"https://i.ytimg.com/vi/{videoId}/hqdefault.jpg";
                }

                return new LiveStreamItem
                {
                    VideoId = videoId,
                    Title = title,
                    ChannelTitle = channelTitle,
                    Description = description,
                    ThumbnailUrl = thumbUrl,
                    EmbedUrl = $"https://www.youtube-nocookie.com/embed/{videoId}?autoplay=1&mute=1&playsinline=1&enablejsapi=1&rel=0",
                    Category = category,
                    IsLive = true,
                    FetchedAt = DateTime.UtcNow
                };
            }

            return null;
        }

        private static string NormalizeCategory(string? category)
        {
            if (string.IsNullOrWhiteSpace(category)) return "general";
            var cat = category.Trim().ToLowerInvariant();
            if (cat.Contains("politic")) return "politics";
            if (cat.Contains("tech")) return "technology";
            if (cat.Contains("biz") || cat.Contains("business") || cat.Contains("stock") || cat.Contains("money")) return "business";
            if (cat.Contains("sci") || cat.Contains("health") || cat.Contains("space")) return "science-health";
            if (cat.Contains("sport")) return "sports";
            if (cat.Contains("entertain") || cat.Contains("movie")) return "entertainment";
            if (cat.Contains("local")) return "local";
            return "general";
        }

        private static string GetCategorySearchQuery(string category)
        {
            return category switch
            {
                "politics" => "Sky News live breaking news broadcast",
                "technology" => "tech live breaking technology news updates",
                "business" => "Bloomberg markets and finance live broadcast",
                "science-health" => "NASA live stream space and science updates",
                "sports" => "Sky Sports News live sports updates breaking",
                "entertainment" => "entertainment tonight live news Hollywood",
                "local" => "global news live 24 7 live stream",
                _ => "Sky News live 24 7 world news broadcast"
            };
        }

        public static LiveStreamItem GetFallbackLiveStream(string category)
        {
            var normalized = NormalizeCategory(category);
            return normalized switch
            {
                "politics" => new LiveStreamItem
                {
                    VideoId = "9Auq9mYxFEE",
                    Title = "Sky News Live: Breaking World & Politics News 24/7",
                    ChannelTitle = "Sky News",
                    Description = "Watch Sky News live for uninterrupted global, political, and world breaking news coverage.",
                    ThumbnailUrl = "https://i.ytimg.com/vi/9Auq9mYxFEE/hqdefault.jpg",
                    EmbedUrl = "https://www.youtube-nocookie.com/embed/9Auq9mYxFEE?autoplay=1&mute=1&playsinline=1&enablejsapi=1&rel=0",
                    Category = "politics",
                    IsLive = true
                },
                "business" => new LiveStreamItem
                {
                    VideoId = "dp8PhLsUcFE",
                    Title = "Bloomberg Live: Global Markets, Economy & Business News",
                    ChannelTitle = "Bloomberg Television",
                    Description = "Live global business news, stock market updates, economic analysis, and financial insights.",
                    ThumbnailUrl = "https://i.ytimg.com/vi/dp8PhLsUcFE/hqdefault.jpg",
                    EmbedUrl = "https://www.youtube-nocookie.com/embed/dp8PhLsUcFE?autoplay=1&mute=1&playsinline=1&enablejsapi=1&rel=0",
                    Category = "business",
                    IsLive = true
                },
                "technology" => new LiveStreamItem
                {
                    VideoId = "_yK2NfH_t6M",
                    Title = "Tech Live: Innovations, AI Breakthroughs & Digital Trends",
                    ChannelTitle = "Tech Today Live",
                    Description = "Real-time coverage of technology breakthroughs, gadget launches, and artificial intelligence developments.",
                    ThumbnailUrl = "https://i.ytimg.com/vi/_yK2NfH_t6M/hqdefault.jpg",
                    EmbedUrl = "https://www.youtube-nocookie.com/embed/_yK2NfH_t6M?autoplay=1&mute=1&playsinline=1&enablejsapi=1&rel=0",
                    Category = "technology",
                    IsLive = true
                },
                "science-health" => new LiveStreamItem
                {
                    VideoId = "21X5lGlDOfg",
                    Title = "NASA Live: Earth Views, Space Station & Cosmic Discoveries",
                    ChannelTitle = "NASA",
                    Description = "Official NASA Live stream showcasing real-time views from the International Space Station and scientific updates.",
                    ThumbnailUrl = "https://i.ytimg.com/vi/21X5lGlDOfg/hqdefault.jpg",
                    EmbedUrl = "https://www.youtube-nocookie.com/embed/21X5lGlDOfg?autoplay=1&mute=1&playsinline=1&enablejsapi=1&rel=0",
                    Category = "science-health",
                    IsLive = true
                },
                "sports" => new LiveStreamItem
                {
                    VideoId = "vQK_p7x9bC0",
                    Title = "Sky Sports News Live: Breaking Scores, Transfers & Match Analysis",
                    ChannelTitle = "Sky Sports News",
                    Description = "Live sports news, latest football transfer updates, match reports, and press conferences.",
                    ThumbnailUrl = "https://i.ytimg.com/vi/vQK_p7x9bC0/hqdefault.jpg",
                    EmbedUrl = "https://www.youtube-nocookie.com/embed/vQK_p7x9bC0?autoplay=1&mute=1&playsinline=1&enablejsapi=1&rel=0",
                    Category = "sports",
                    IsLive = true
                },
                _ => new LiveStreamItem
                {
                    VideoId = "9Auq9mYxFEE",
                    Title = "WorldNewzs Live: Global Breaking News & 24/7 Coverage",
                    ChannelTitle = "World Newz Live Broadcast",
                    Description = "Continuous live breaking news reporting, international affairs, and instant global updates.",
                    ThumbnailUrl = "https://i.ytimg.com/vi/9Auq9mYxFEE/hqdefault.jpg",
                    EmbedUrl = "https://www.youtube-nocookie.com/embed/9Auq9mYxFEE?autoplay=1&mute=1&playsinline=1&enablejsapi=1&rel=0",
                    Category = "general",
                    IsLive = true
                }
            };
        }
    }
}
