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
    }
}
