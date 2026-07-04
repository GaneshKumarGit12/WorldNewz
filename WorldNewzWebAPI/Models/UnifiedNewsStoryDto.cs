using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace WorldNewzWebAPI.Models
{
    public class UnifiedNewsStoryDto
    {
        [JsonPropertyName("storyId")]
        public string StoryId { get; set; } = string.Empty;

        [JsonPropertyName("category")]
        public string Category { get; set; } = "General";

        [JsonPropertyName("subcategory")]
        public string Subcategory { get; set; } = "Global Updates";

        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("imageUrl")]
        public string? ImageUrl { get; set; }

        [JsonPropertyName("publishedAt")]
        public DateTime PublishedAt { get; set; } = DateTime.UtcNow;

        [JsonPropertyName("aiBriefing")]
        public AiBriefingDto AiBriefing { get; set; } = new AiBriefingDto();

        [JsonPropertyName("sources")]
        public List<NewsSourceDto> Sources { get; set; } = new List<NewsSourceDto>();

        [JsonPropertyName("contextualPoll")]
        public ContextualPollDto? ContextualPoll { get; set; }
    }

    public class AiBriefingDto
    {
        [JsonPropertyName("summary")]
        public string Summary { get; set; } = string.Empty;

        [JsonPropertyName("takeaways")]
        public List<string> Takeaways { get; set; } = new List<string>();
    }

    public class NewsSourceDto
    {
        [JsonPropertyName("publisher")]
        public string Publisher { get; set; } = string.Empty;

        [JsonPropertyName("url")]
        public string Url { get; set; } = string.Empty;
    }

    public class ContextualPollDto
    {
        [JsonPropertyName("pollId")]
        public int PollId { get; set; }

        [JsonPropertyName("question")]
        public string Question { get; set; } = string.Empty;

        [JsonPropertyName("totalVotes")]
        public int TotalVotes { get; set; }

        [JsonPropertyName("options")]
        public List<ContextualPollOptionDto> Options { get; set; } = new List<ContextualPollOptionDto>();
    }

    public class ContextualPollOptionDto
    {
        [JsonPropertyName("optionId")]
        public int OptionId { get; set; }

        [JsonPropertyName("text")]
        public string Text { get; set; } = string.Empty;

        [JsonPropertyName("votes")]
        public int Votes { get; set; }
    }
}
