using Microsoft.AspNetCore.Mvc;
using System.Text;

namespace WorldNewzWebAPI.Controllers
{
    [ApiController]
    [Route("")]
    public class SeoController : ControllerBase
    {
        private readonly IConfiguration _cfg;

        public SeoController(IConfiguration cfg)
        {
            _cfg = cfg;
        }

        [HttpGet("sitemap.xml")]
        [ResponseCache(Duration = 3600)]
        public IActionResult Sitemap()
        {
            var siteUrl = "https://world-newz.vercel.app";

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
                ("terms", "0.3", "yearly")
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

            sb.AppendLine("</urlset>");
            return Content(sb.ToString(), "application/xml", Encoding.UTF8);
        }

        [HttpGet("robots.txt")]
        public IActionResult RobotsTxt()
        {
            var siteUrl = "https://world-newz.vercel.app";
            var content = $@"User-agent: *
Allow: /
Disallow: /api/
Disallow: /swagger/

Sitemap: {siteUrl}/sitemap.xml";
            return Content(content, "text/plain");
        }
    }
}
