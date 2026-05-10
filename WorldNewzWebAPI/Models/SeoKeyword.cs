namespace WorldNewzWebAPI.Models
{
    public class SeoKeyword
    {
        public int Id { get; set; }
        public string Category { get; set; } = string.Empty; // "sports","technology", etc.
        public string Primary { get; set; } = "[]";  // JSON array stored as string
        public string Longtail { get; set; } = "[]";  // JSON array stored as string
        public string Trending { get; set; } = "[]";  // JSON array stored as string
        public string MetaDesc { get; set; } = string.Empty; // AI-written meta description
        public DateTime Date { get; set; } = DateTime.UtcNow.Date;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
