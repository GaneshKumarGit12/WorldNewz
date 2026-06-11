using System;
using System.Collections.Generic;

namespace WorldNewzWebAPI.Models
{
    public class Poll
    {
        public int Id { get; set; }
        public string Question { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public ICollection<PollOption> Options { get; set; } = new List<PollOption>();
    }

    public class PollOption
    {
        public int Id { get; set; }
        public int PollId { get; set; }
        public string OptionText { get; set; } = string.Empty;
        public int Votes { get; set; } = 0;
        public bool IsCorrect { get; set; } = false;
    }

    public class PollSubmission
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public double Percentage { get; set; }
        public string Status { get; set; } = string.Empty; // "Red", "Orange", "Green"
        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    }
}
