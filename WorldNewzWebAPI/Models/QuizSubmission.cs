using System;

namespace WorldNewzWebAPI.Models
{
    public class QuizSubmission
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public int Score { get; set; }
        public int Coins { get; set; }
        public double Percentage { get; set; }
        public string Status { get; set; } = string.Empty; // "Red", "Orange", "Green"
        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    }
}
