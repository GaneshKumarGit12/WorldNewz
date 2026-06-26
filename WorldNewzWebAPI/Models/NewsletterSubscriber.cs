using System;

namespace WorldNewzWebAPI.Models
{
    public class NewsletterSubscriber
    {
        public int Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string SubscriptionType { get; set; } = string.Empty; // "Google" or "Direct"
        public DateTime SubscribedAt { get; set; } = DateTime.UtcNow;
    }
}
