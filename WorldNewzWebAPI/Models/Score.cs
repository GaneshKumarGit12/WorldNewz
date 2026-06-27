using System;

namespace WorldNewzWebAPI.Models
{
    public class Score
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public int Points { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
