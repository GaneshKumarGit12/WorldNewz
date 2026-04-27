namespace WorldNewzWebAPI.Models
{
    public class NewsArticle
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Url { get; set; }
        public string? ImageUrl { get; set; }
        public DateTime? PublishedAt { get; set; }
        public DateTime CachedAt { get; set; } = DateTime.Now;

        public int CategoryId { get; set; }
        public Category? Category { get; set; }
    }

}
