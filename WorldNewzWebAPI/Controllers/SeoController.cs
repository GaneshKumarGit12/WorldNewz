using Microsoft.AspNetCore.Mvc;
using System;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using WorldNewzWebAPI.Data;
using WorldNewzWebAPI.Models;

namespace WorldNewzWebAPI.Controllers
{
    [ApiController]
    [Route("")]
    public class SeoController : ControllerBase
    {
        private readonly IConfiguration _cfg;
        private readonly WorldNewsDbContext _db;

        public SeoController(IConfiguration cfg, WorldNewsDbContext db)
        {
            _cfg = cfg;
            _db = db;
        }

        private string GenerateSlug(string title)
        {
            if (string.IsNullOrEmpty(title)) return "article";
            
            var sb = new StringBuilder();
            foreach (char c in title)
            {
                if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9'))
                {
                    sb.Append(char.ToLower(c));
                }
                else
                {
                    sb.Append('-');
                }
            }
            var slug = sb.ToString();
            if (slug.Length > 50)
            {
                slug = slug.Substring(0, 50);
            }
            return slug;
        }

        [HttpGet("sitemap.xml")]
        [ResponseCache(Duration = 3600)]
        public async Task<IActionResult> Sitemap()
        {
            var siteUrl = "https://worldnewzs.in";

            var sb = new StringBuilder();
            sb.AppendLine(@"<?xml version=""1.0"" encoding=""UTF-8""?>");
            sb.AppendLine(@"<urlset xmlns=""http://www.sitemaps.org/schemas/sitemap/0.9"">");

            var pages = new[]
            {
                ("", "1.0", "daily"),
                ("sports", "0.8", "hourly"),
                ("money", "0.8", "hourly"),
                ("weather", "0.8", "hourly"),
                ("shopping", "0.8", "hourly"),
                ("search", "0.5", "daily"),
                ("bookmarks", "0.3", "monthly"),
                ("comments", "0.3", "monthly"),
                ("privacy-policy", "0.3", "yearly"),
                ("terms", "0.3", "yearly"),
                ("about", "0.7", "monthly"),
                ("contact", "0.7", "monthly"),
                ("editorial-briefings", "0.8", "daily"),
                ("editorial-guidelines", "0.6", "monthly")
            };

            foreach (var (path, priority, freq) in pages)
            {
                var url = string.IsNullOrEmpty(path) ? siteUrl : $"{siteUrl}/{path}";
                sb.AppendLine($@"  <url>
    <loc>{url}</loc>
    <changefreq>{freq}</changefreq>
    <priority>{priority}</priority>
    <lastmod>{DateTime.UtcNow:yyyy-MM-dd}</lastmod>
  </url>");
            }

            try
            {
                // Fetch up to 1000 latest cached articles from DB to dynamically populate in the sitemap
                var articles = await _db.NewsArticles
                    .OrderByDescending(a => a.PublishedAt)
                    .Take(1000)
                    .Select(a => new { a.Title, a.PublishedAt })
                    .ToListAsync();

                foreach (var a in articles)
                {
                    var slug = GenerateSlug(a.Title);
                    var url = $"{siteUrl}/article/{slug}";
                    var lastMod = (a.PublishedAt ?? DateTime.UtcNow).ToString("yyyy-MM-dd");
                    sb.AppendLine($@"  <url>
    <loc>{url}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
    <lastmod>{lastMod}</lastmod>
  </url>");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error querying articles for sitemap: {ex.Message}");
            }

            sb.AppendLine("</urlset>");
            return Content(sb.ToString(), "application/xml", Encoding.UTF8);
        }

        [HttpGet("news-sitemap.xml")]
        [ResponseCache(Duration = 1800)]
        public async Task<IActionResult> NewsSitemap()
        {
            var siteUrl = "https://worldnewzs.in";

            var sb = new StringBuilder();
            sb.AppendLine(@"<?xml version=""1.0"" encoding=""UTF-8""?>");
            sb.AppendLine(@"<urlset xmlns=""http://www.sitemaps.org/schemas/sitemap/0.9""");
            sb.AppendLine(@"        xmlns:news=""http://www.google.com/schemas/sitemap-news/0.9"">");

            try
            {
                // Google News sitemaps require articles published in the last 48 hours
                var cutoff = DateTime.UtcNow.AddDays(-2);
                var articles = await _db.NewsArticles
                    .Where(a => a.PublishedAt >= cutoff)
                    .OrderByDescending(a => a.PublishedAt)
                    .Take(250)
                    .Select(a => new { a.Title, a.PublishedAt })
                    .ToListAsync();

                // Fallback: If no articles are in the DB for the last 48 hours, use the latest 15 articles for fallback testing
                if (articles.Count == 0)
                {
                    articles = await _db.NewsArticles
                        .OrderByDescending(a => a.PublishedAt)
                        .Take(15)
                        .Select(a => new { a.Title, a.PublishedAt })
                        .ToListAsync();
                }

                foreach (var a in articles)
                {
                    var slug = GenerateSlug(a.Title);
                    var url = $"{siteUrl}/article/{slug}";
                    var pubDate = (a.PublishedAt ?? DateTime.UtcNow).ToString("yyyy-MM-ddTHH:mm:sszzz");
                    var escapedTitle = System.Security.SecurityElement.Escape(a.Title);

                    sb.AppendLine($@"  <url>
    <loc>{url}</loc>
    <news:news>
      <news:publication>
        <news:name>WorldNewzs</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>{pubDate}</news:publication_date>
      <news:title>{escapedTitle}</news:title>
    </news:news>
  </url>");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error querying articles for news sitemap: {ex.Message}");
            }

            sb.AppendLine("</urlset>");
            return Content(sb.ToString(), "application/xml", Encoding.UTF8);
        }

        [HttpGet("robots.txt")]
        public IActionResult RobotsTxt()
        {
            var siteUrl = "https://worldnewzs.in";
            var content = $@"User-agent: *
Allow: /
Disallow: /api/
Disallow: /swagger/

Sitemap: {siteUrl}/sitemap.xml
Sitemap: {siteUrl}/news-sitemap.xml";
            return Content(content, "text/plain");
        }
    }
}
