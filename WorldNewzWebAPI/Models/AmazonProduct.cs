using System;

namespace WorldNewzWebAPI.Models
{
    public class AmazonProduct
    {
        public int Id { get; set; }
        public string Asin { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public decimal OriginalPrice { get; set; }
        public double Rating { get; set; }
        public int ReviewCount { get; set; }
        public string Category { get; set; } = string.Empty;
        public string ProductUrl { get; set; } = string.Empty; // Holds direct or custom/short link
        public bool IsActive { get; set; } = true;
        public DateTime DateAdded { get; set; } = DateTime.UtcNow;
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
        public DateTime? LastSyncedAt { get; set; }
        public bool IsFallback { get; set; } = false;
    }
}

