using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace WorldNewzWebAPI.Models
{
    public class FreeToGameItem
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("thumbnail")]
        public string Thumbnail { get; set; } = string.Empty;

        [JsonPropertyName("short_description")]
        public string ShortDescription { get; set; } = string.Empty;

        [JsonPropertyName("game_url")]
        public string GameUrl { get; set; } = string.Empty;

        [JsonPropertyName("genre")]
        public string Genre { get; set; } = string.Empty;

        [JsonPropertyName("platform")]
        public string Platform { get; set; } = string.Empty;

        [JsonPropertyName("publisher")]
        public string Publisher { get; set; } = string.Empty;

        [JsonPropertyName("developer")]
        public string Developer { get; set; } = string.Empty;

        [JsonPropertyName("release_date")]
        public string ReleaseDate { get; set; } = string.Empty;

        [JsonPropertyName("freetogame_profile_url")]
        public string FreeToGameProfileUrl { get; set; } = string.Empty;
    }

    public class FreeToGameDetails
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("thumbnail")]
        public string Thumbnail { get; set; } = string.Empty;

        [JsonPropertyName("status")]
        public string Status { get; set; } = string.Empty;

        [JsonPropertyName("short_description")]
        public string ShortDescription { get; set; } = string.Empty;

        [JsonPropertyName("description")]
        public string Description { get; set; } = string.Empty;

        [JsonPropertyName("game_url")]
        public string GameUrl { get; set; } = string.Empty;

        [JsonPropertyName("genre")]
        public string Genre { get; set; } = string.Empty;

        [JsonPropertyName("platform")]
        public string Platform { get; set; } = string.Empty;

        [JsonPropertyName("publisher")]
        public string Publisher { get; set; } = string.Empty;

        [JsonPropertyName("developer")]
        public string Developer { get; set; } = string.Empty;

        [JsonPropertyName("release_date")]
        public string ReleaseDate { get; set; } = string.Empty;

        [JsonPropertyName("freetogame_profile_url")]
        public string FreeToGameProfileUrl { get; set; } = string.Empty;

        [JsonPropertyName("minimum_system_requirements")]
        public MinimumSystemRequirements? MinimumSystemRequirements { get; set; }

        [JsonPropertyName("screenshots")]
        public List<ScreenshotItem> Screenshots { get; set; } = new();
    }

    public class MinimumSystemRequirements
    {
        [JsonPropertyName("os")]
        public string Os { get; set; } = string.Empty;

        [JsonPropertyName("processor")]
        public string Processor { get; set; } = string.Empty;

        [JsonPropertyName("memory")]
        public string Memory { get; set; } = string.Empty;

        [JsonPropertyName("graphics")]
        public string Graphics { get; set; } = string.Empty;

        [JsonPropertyName("storage")]
        public string Storage { get; set; } = string.Empty;
    }

    public class ScreenshotItem
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("image")]
        public string Image { get; set; } = string.Empty;
    }
}
