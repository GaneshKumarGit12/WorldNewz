using Microsoft.EntityFrameworkCore;
using WorldNewzWebAPI.Models;

namespace WorldNewzWebAPI.Data
{
    public class WorldNewsDbContext : DbContext
    {
        public WorldNewsDbContext(DbContextOptions<WorldNewsDbContext> options) : base(options) { }

        public DbSet<Category> Categories { get; set; }
        public DbSet<NewsArticle> NewsArticles { get; set; }
        public DbSet<Ad> Ads { get; set; }
        public DbSet<SeoKeyword> SeoKeywords { get; set; }
        public DbSet<EnrichedArticle> EnrichedArticles { get; set; }
        public DbSet<FacebookPageSetting> FacebookPageSettings { get; set; }
        public DbSet<Poll> Polls { get; set; }
        public DbSet<PollOption> PollOptions { get; set; }
        public DbSet<AmazonProduct> AmazonProducts { get; set; }
        public DbSet<JobPosting> JobPostings { get; set; }
        public DbSet<CabDriver> CabDrivers { get; set; }
        public DbSet<RideBooking> RideBookings { get; set; }

        public DbSet<PlayGamesPlayer> PlayGamesPlayers { get; set; }
        public DbSet<PlayGamesLeaderboard> PlayGamesLeaderboards { get; set; }
        public DbSet<PlayGamesScore> PlayGamesScores { get; set; }
        public DbSet<PlayGamesAchievement> PlayGamesAchievements { get; set; }
        public DbSet<PlayGamesPlayerAchievement> PlayGamesPlayerAchievements { get; set; }
        public DbSet<PlayGamesSavedGame> PlayGamesSavedGames { get; set; }
    }
}
