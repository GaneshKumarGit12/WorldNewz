using System;
using System.Text.Json.Serialization;

namespace WorldNewzWebAPI.Models
{
    public class NewsArticleDto
    {
        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("description")]
        public string? Description { get; set; }

        [JsonPropertyName("url")]
        public string? Url { get; set; }

        [JsonPropertyName("urlToImage")]
        public string? UrlToImage { get; set; }

        [JsonPropertyName("publishedAt")]
        public DateTime? PublishedAt { get; set; }

        [JsonPropertyName("source")]
        public SourceDto? Source { get; set; }

        [JsonPropertyName("headline")]
        public string? Headline { get; set; }

        [JsonPropertyName("summary")]
        public string? Summary { get; set; }

        [JsonPropertyName("context")]
        public string? Context { get; set; }

        [JsonPropertyName("socialMediaHook")]
        public string? SocialMediaHook { get; set; }

        [JsonPropertyName("verified")]
        public bool Verified { get; set; }

        [JsonPropertyName("category")]
        public string? Category { get; set; }
    }

    public class SourceDto
    {
        [JsonPropertyName("id")]
        public string? Id { get; set; }

        [JsonPropertyName("name")]
        public string? Name { get; set; }
    }
}
