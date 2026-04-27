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
    }

}
