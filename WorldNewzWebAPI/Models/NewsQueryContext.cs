namespace WorldNewzWebAPI.Models
{
    public class NewsQueryContext
    {
        public string? Query { get; set; }
        public string? Category { get; set; }
        public string? Country { get; set; }
        public string? Language { get; set; } = "en";
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
        public bool IsTopHeadlines { get; set; } = false;
        
        /// <summary>
        /// Source specification (e.g. "duckduckgo", "news", "all").
        /// Only used by Search.
        /// </summary>
        public string? Source { get; set; }
    }
}
