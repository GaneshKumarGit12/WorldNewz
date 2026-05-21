using System;
using System.ComponentModel.DataAnnotations;

namespace WorldNewzWebAPI.Models
{
    public class EnrichedArticle
    {
        [Key]
        public string Url { get; set; } = string.Empty;

        public string Headline { get; set; } = string.Empty;

        public string Summary { get; set; } = string.Empty;

        public string Context { get; set; } = string.Empty;

        public string SocialMediaHook { get; set; } = string.Empty;

        public bool Verified { get; set; }

        public DateTime EnrichedAt { get; set; } = DateTime.UtcNow;
    }
}
