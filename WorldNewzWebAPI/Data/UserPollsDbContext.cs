using Microsoft.EntityFrameworkCore;
using WorldNewzWebAPI.Models;

namespace WorldNewzWebAPI.Data
{
    public class UserPollsDbContext : DbContext
    {
        public UserPollsDbContext(DbContextOptions<UserPollsDbContext> options) : base(options) { }

        public DbSet<PollSubmission> PollSubmissions { get; set; }
        public DbSet<QuizSubmission> QuizSubmissions { get; set; }
        public DbSet<NewsletterSubscriber> NewsletterSubscribers { get; set; }
        public DbSet<Score> Scores { get; set; }
    }
}
