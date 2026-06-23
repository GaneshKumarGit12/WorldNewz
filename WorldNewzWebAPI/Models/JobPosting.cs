using System.ComponentModel.DataAnnotations;

namespace WorldNewzWebAPI.Models
{
    public class JobPosting
    {
        [Key]
        public string Slug { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public bool Remote { get; set; }
        public string Url { get; set; } = string.Empty;
        public string? Tags { get; set; } // Comma separated values or serialized JSON
        public string? JobTypes { get; set; }
        public string Location { get; set; } = string.Empty;
        public long CreatedAt { get; set; } // Unix timestamp
        public bool IsLocal { get; set; }
    }
}
