using Microsoft.AspNetCore.Mvc;
using System.Xml.Linq;
using System.Net.Http;
using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;
using System.Linq;
using WorldNewzWebAPI.Models;

namespace WorldNewzWebAPI.Controllers
{
    [Route("rss/{feedType?}")]
    public class RssController : Controller
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IMemoryCache _cache;

        public RssController(IHttpClientFactory httpClientFactory, IMemoryCache cache)
        {
            _httpClientFactory = httpClientFactory;
            _cache = cache;
        }

        [HttpGet]
        public async Task<IActionResult> GetFeed(string feedType = "discover")
        {
            var apiEndpoint = feedType?.ToLower() switch
            {
                "bing" => "https://worldnewz.onrender.com/api/news/bing",
                "money" => "https://worldnewz.onrender.com/api/news/money",
                "search" => "https://worldnewz.onrender.com/api/news/search",
                "discover" or _ => "https://worldnewz.onrender.com/api/news/discover"
            };

            var cacheKey = $"rss_feed_{feedType}";

            if (!_cache.TryGetValue(cacheKey, out List<Article> articles))
            {
                var client = _httpClientFactory.CreateClient();
                var response = await client.GetStringAsync(apiEndpoint);

                using var doc = JsonDocument.Parse(response);
                JsonElement root = doc.RootElement;

                if (root.TryGetProperty("articles", out JsonElement articlesElement))
                {
                    articles = JsonSerializer.Deserialize<List<Article>>(articlesElement.GetRawText());
                }
                else if (root.TryGetProperty("value", out JsonElement valueElement))
                {
                    articles = JsonSerializer.Deserialize<List<Article>>(valueElement.GetRawText());
                }
                else
                {
                    articles = new List<Article>();
                }

                articles = articles
                    .Where(a => !string.IsNullOrEmpty(a.Url))
                    .GroupBy(a => a.Url)
                    .Select(g => g.First())
                    .OrderByDescending(a => a.PublishedAt ?? DateTime.MinValue)
                    .Take(10)
                    .ToList();

                _cache.Set(cacheKey, articles, TimeSpan.FromMinutes(5));
            }

            XNamespace atom = "http://www.w3.org/2005/Atom";

            var channel = new XElement("channel",
                new XElement("title", $"WorldNewz {feedType}"),
                new XElement("link", "https://world-newz.vercel.app"),
                new XElement("description", $"Latest {feedType} news from WorldNewz"),
                new XElement(atom + "link",
                    new XAttribute("href", $"https://worldnewz.onrender.com/rss/{feedType}"),
                    new XAttribute("rel", "self"),
                    new XAttribute("type", "application/rss+xml"))
            );

            foreach (var a in articles)
            {
                string hashtags = a.Source?.Name?.ToLower() switch
                {
                    "technology" => "#Tech #Innovation #WorldNewz",
                    "science" => "#Science #Discovery #WorldNewz",
                    "business" => "#Business #Finance #WorldNewz",
                    "health" => "#Health #Wellness #WorldNewz",
                    _ => "#WorldNewz"
                };

                channel.Add(new XElement("item",
                    new XElement("title", (a.Title ?? "Untitled").Trim()),
                    new XElement("link", (a.Url ?? string.Empty).Trim()),
                    new XElement("guid", (a.Url ?? string.Empty).Trim()),
                    new XElement("description", new XText($"{(a.Description ?? "").Trim()} {hashtags}")),
                    new XElement("pubDate", (a.PublishedAt ?? DateTime.UtcNow).ToString("r")),
                    new XElement("category", (a.Source?.Name ?? "General").Trim()),
                    new XElement("enclosure",
                        new XAttribute("url", (a.UrlToImage ?? string.Empty).Trim()),
                        new XAttribute("type", "image/jpeg"),
                        new XAttribute("length", "0"))
                ));
            }

            var feed = new XDocument(
                new XElement("rss",
                    new XAttribute("version", "2.0"),
                    new XAttribute(XNamespace.Xmlns + "atom", atom),
                    channel
                )
            );

            return Content(feed.ToString(), "application/rss+xml");
        }
    }
}
