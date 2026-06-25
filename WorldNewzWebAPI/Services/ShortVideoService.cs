using System.Collections.Generic;
using System.Threading.Tasks;

namespace WorldNewzWebAPI.Services
{
    public class ShortVideoService
    {
        private readonly List<ShortVideo> _videos;

        public ShortVideoService()
        {
            _videos = new List<ShortVideo>
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
                },
                new ShortVideo
                {
                    Id = "vid-4",
                    Title = "Mastering the Art of Gourmet Plating 🍽️",
                    VideoUrl = "https://assets.mixkit.co/videos/preview/mixkit-chef-plating-a-gourmet-dish-34433-large.mp4",
                    ViewsCount = "680K",
                    LikesCount = 42100,
                    CommentsCount = 512,
                    Author = "Culinary Academy",
                    AuthorAvatar = "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=100&auto=format&fit=crop&q=60",
                    Category = "Lifestyle",
                    Duration = "0:14"
                },
                new ShortVideo
                {
                    Id = "vid-5",
                    Title = "Aerial View: Curved Autumn Roads 🍁",
                    VideoUrl = "https://assets.mixkit.co/videos/preview/mixkit-curvy-road-between-forest-trees-from-above-42630-large.mp4",
                    ViewsCount = "450K",
                    LikesCount = 31000,
                    CommentsCount = 245,
                    Author = "Travel Drones",
                    AuthorAvatar = "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=100&auto=format&fit=crop&q=60",
                    Category = "Travel",
                    Duration = "0:15"
                }
            };
        }

        public Task<List<ShortVideo>> GetTrendingShortVideosAsync()
        {
            return Task.FromResult(_videos);
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
