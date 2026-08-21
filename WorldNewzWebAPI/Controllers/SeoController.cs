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
                ("politics", "0.8", "hourly"),
                ("technology", "0.8", "hourly"),
                ("business", "0.8", "hourly"),
                ("science-health", "0.8", "hourly"),
                ("lifestyle", "0.8", "hourly"),
                ("education", "0.8", "hourly"),
                ("opinion", "0.8", "hourly"),
                ("trending", "0.8", "hourly"),
                ("podcasts-videos", "0.8", "hourly"),
                ("local-news", "0.8", "hourly"),
                ("travel", "0.8", "hourly"),
                ("food", "0.8", "hourly"),
                ("entertainment", "0.8", "hourly"),
                ("services", "0.8", "hourly"),
                ("gaming", "0.8", "hourly"),
                ("cartoons", "0.8", "hourly"),
                ("polls", "0.8", "hourly"),
                ("polls-history", "0.8", "hourly"),
                ("badge-quiz", "0.8", "hourly"),
                ("quiz-history", "0.8", "hourly"),
                ("jobs", "0.6", "daily"),
                ("movies", "0.6", "daily"),
                ("transportation", "0.6", "daily"),
                ("stocks", "0.6", "hourly"),
                ("trending-videos", "0.8", "daily"),
                ("play-games", "0.8", "daily"),
                ("amazon-products", "0.9", "daily"),
                ("privacy-policy", "0.3", "yearly"),
                ("terms", "0.3", "yearly"),
                ("disclaimer", "0.3", "yearly"),
                ("about", "0.7", "monthly"),
                ("contact", "0.7", "monthly"),
                ("editorial-briefings", "0.8", "daily"),
                ("editorial-guidelines", "0.6", "monthly"),
                ("chatbot", "0.8", "daily")
            };

            foreach (var (path, priority, freq) in pages)
            {
                var url = string.IsNullOrEmpty(path) ? siteUrl : $"{siteUrl}/{path}";
                sb.AppendLine($@"  <url>
    <loc>{System.Security.SecurityElement.Escape(url)}</loc>
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
    <loc>{System.Security.SecurityElement.Escape(url)}</loc>
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
            Response.Headers.CacheControl = "public, max-age=3600";
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
                    var pubDate = (a.PublishedAt ?? DateTime.UtcNow).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss+00:00");
                    var escapedTitle = System.Security.SecurityElement.Escape(a.Title);
                    var escapedUrl = System.Security.SecurityElement.Escape(url);

                    sb.AppendLine($@"  <url>
    <loc>{escapedUrl}</loc>
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
            Response.Headers.CacheControl = "public, max-age=1800";
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
Disallow: /admin/
Disallow: /hubs/
Disallow: /health
Disallow: /search
Disallow: /gsearch
Disallow: /bookmarks
Disallow: /comments

Sitemap: {siteUrl}/sitemap.xml
Sitemap: {siteUrl}/news-sitemap.xml";
            Response.Headers.CacheControl = "public, max-age=3600";
            return Content(content, "text/plain");
        }

        [HttpGet("llms.txt")]
        public IActionResult LlmsTxt()
        {
            var content = @"# WorldNewzs

> WorldNewzs is a real-time, multi-category news aggregation and editorial intelligence platform. We curate, verify, synthesize, and analyze breaking global headlines across politics, technology, business, science, health, sports, money, and lifestyle from trusted international publications.

## Primary News Categories
- [Top Discover News](https://worldnewzs.in/): Real-time curated breaking headlines, top stories, and editorial briefings.
- [Politics News](https://worldnewzs.in/politics): Global governance, legislative reforms, international diplomacy, and geopolitical analysis.
- [Technology & AI News](https://worldnewzs.in/technology): Breakthroughs in artificial intelligence, silicon hardware, cybersecurity, consumer gadgets, and software ecosystems.
- [Business & Markets News](https://worldnewzs.in/business): Stock market summaries, macroeconomic trends, mergers and acquisitions, venture capital, and corporate earnings.
- [Science & Health News](https://worldnewzs.in/science-health): Medical studies, clinical discoveries, public health guidance, space exploration, and climate science.
- [Sports News](https://worldnewzs.in/sports): Global tournament scores, football transfers, cricket match analyses, tennis championships, and Olympic coverage.
- [Money & Personal Finance](https://worldnewzs.in/money): Investment strategies, wealth planning, tax-saving guidelines, retirement planning, and cryptocurrency trends.
- [Lifestyle & Culture](https://worldnewzs.in/lifestyle): Modern fashion, wellness practices, architectural trends, interior design, and mindful living.
- [Education News](https://worldnewzs.in/education): Academic research, global universities, scholarship notifications, career guidance, and learning technologies.
- [Opinion & Editorials](https://worldnewzs.in/opinion): In-depth commentary, viewpoint columns, expert debates, and think-tank policy reviews.
- [Trending News](https://worldnewzs.in/trending): Viral social media moments, cultural highlights, and verified internet trends.
- [Local News](https://worldnewzs.in/local-news): City-level civic reporting, municipal developments, regional infrastructure, and community events.
- [Podcasts & Videos](https://worldnewzs.in/podcasts-videos): Curated multimedia interviews, investigative audio podcasts, and visual news explainers.
- [Weather Forecasts](https://worldnewzs.in/weather): Hyper-local meteorological reports, severe weather alerts, temperature indices, and climate forecasts.
- [Food & Dining](https://worldnewzs.in/food): Culinary guides, quick healthy recipes, dietary science, and restaurant critique.
- [Travel Guides](https://worldnewzs.in/travel): Destination itineraries, booking tips, visa regulations, and transit advisories.
- [Entertainment & Cinema](https://worldnewzs.in/entertainment): Box office reports, celebrity interviews, film reviews, and television broadcast schedules.
- [Gaming & Esports](https://worldnewzs.in/gaming): Video game reviews, esports tournaments, console hardware updates, and patch guides.
- [Cartoons & Satire](https://worldnewzs.in/cartoons): Daily editorial cartoons, comic illustrations, and cultural satire.

## Interactive Tools & Reader Utilities
- [Badge Trivia Quiz](https://worldnewzs.in/badge-quiz): Daily multi-category general knowledge trivia quizzes with coins and progression badges.
- [Opinion Polls](https://worldnewzs.in/polls): Real-time public sentiment voting on geopolitical, economic, and technological topics.
- [Polls History](https://worldnewzs.in/polls-history): Historical voting sentiment records and public opinion trends.
- [Quiz History](https://worldnewzs.in/quiz-history): Personal trivia scoring history, leaderboard standings, and question reviews.
- [Stock Market Dashboard](https://worldnewzs.in/stocks): Live indices updates, Nifty 50, Sensex, top gainers, losers, and market summaries.
- [Jobs Board](https://worldnewzs.in/jobs): Curated remote and on-site career listings for developers, designers, marketers, and analysts.
- [Movies Database](https://worldnewzs.in/movies): Film directory featuring trending cinema releases, ratings, reviews, and cast information.
- [Transportation & Transit](https://worldnewzs.in/transportation): Commute route planner, cab listings, transit schedules, and city travel guides.
- [NewsBot AI Assistant](https://worldnewzs.in/chatbot): Interactive AI news assistant for querying verified article archives and factual briefings.
- [Deals & Shopping Hub](https://worldnewzs.in/amazon-products): Curated product deals, buying guides, and verified online shopping discounts.
- [Trending Videos & Shorts](https://worldnewzs.in/trending-videos): Short-form video news clips, technology demonstrations, and sports highlights.
- [Play Games Arcade](https://worldnewzs.in/play-games): Interactive web browser games including Retro Mario, Chess, Hit Goal, and DVCubie2026 Snake Arena.

## Editorial Standards & Legal
- [Editorial Briefings](https://worldnewzs.in/editorial-briefings): Deep-dive investigative journalism and sector-specific analytical briefings.
- [Editorial Guidelines](https://worldnewzs.in/editorial-guidelines): Standards of accuracy, fact-checking methodology, correction policy, and source transparency.
- [About WorldNewzs](https://worldnewzs.in/about): Our editorial mission, curation process, technology stack, and leadership team.
- [Contact Us](https://worldnewzs.in/contact): Editorial tips, feedback submissions, corrections, and press inquiries.
- [Privacy Policy](https://worldnewzs.in/privacy-policy): User privacy, GDPR/CCPA compliance, cookies disclosure, and data retention policies.
- [Terms & Conditions](https://worldnewzs.in/terms): Website terms of service, acceptable use, and intellectual property disclaimers.
- [Disclaimer](https://worldnewzs.in/disclaimer): News aggregation disclaimers, third-party content notices, and financial liability disclaimers.

## Optional Extended Documentation
- [Full LLM Context & Schemas](https://worldnewzs.in/llms-full.txt): Comprehensive platform documentation, JSON schemas, content cadence, and API endpoints.";
            Response.Headers.CacheControl = "public, max-age=86400";
            return Content(content, "text/markdown; charset=utf-8");
        }
    }
}
