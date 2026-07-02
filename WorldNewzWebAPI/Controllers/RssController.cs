using Microsoft.AspNetCore.Mvc;
using System.Xml.Linq;
using System.Net.Http;
using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;
using System.Linq;
using WorldNewzWebAPI.Models;
using WorldNewzWebAPI.Services;

namespace WorldNewzWebAPI.Controllers
{
    [Route("rss/{feedType?}")]
    public class RssController : Controller
    {
        private readonly INewsApiService _newsApiService;
        private readonly INewsEnrichmentService _enrichmentService;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IMemoryCache _cache;
        private readonly JsonSerializerOptions _jsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

        public RssController(
            INewsApiService newsApiService,
            INewsEnrichmentService enrichmentService,
            IHttpClientFactory httpClientFactory,
            IMemoryCache cache)
        {
            _newsApiService = newsApiService;
            _enrichmentService = enrichmentService;
            _httpClientFactory = httpClientFactory;
            _cache = cache;
        }

        [HttpGet]
        public async Task<IActionResult> GetFeed(string feedType = "discover")
        {
            feedType = feedType?.ToLower() ?? "discover";
            var cacheKey = $"rss_feed_{feedType}";

            if (!_cache.TryGetValue(cacheKey, out List<Article> articles))
            {
                articles = await FetchArticlesInternal(feedType);
                _cache.Set(cacheKey, articles, TimeSpan.FromMinutes(5));
            }

            XNamespace atom = "http://www.w3.org/2005/Atom";
            XNamespace contentNs = "http://purl.org/rss/1.0/modules/content/";

            var channel = new XElement("channel",
                new XElement("title", $"WorldNewzs {feedType}"),
                new XElement("link", "https://worldnewzs.in"),
                new XElement("description", $"Latest {feedType} news from WorldNewzs"),
                new XElement(atom + "link",
                    new XAttribute("href", $"https://worldnewzs.in/rss/{feedType}"),
                    new XAttribute("rel", "self"),
                    new XAttribute("type", "application/rss+xml"))
            );

            foreach (var a in articles)
            {
                string hashtags = a.Source?.Name?.ToLower() switch
                {
                    "technology" => "#Tech #Innovation #WorldNewzs",
                    "science" => "#Science #Discovery #WorldNewzs",
                    "business" => "#Business #Finance #WorldNewzs",
                    "health" => "#Health #Wellness #WorldNewzs",
                    _ => "#WorldNewzs"
                };

                var fullHtmlSummary = $"<p>{System.Net.WebUtility.HtmlEncode(a.Description ?? "")}</p><p><a href=\"{a.Url}\">Read full story on WorldNewzs</a></p><p><em>Keywords: {hashtags}</em></p>";

                channel.Add(new XElement("item",
                    new XElement("title", (a.Title ?? "Untitled").Trim()),
                    new XElement("link", (a.Url ?? string.Empty).Trim()),
                    new XElement("guid", (a.Url ?? string.Empty).Trim()),
                    new XElement("description", new XText($"{(a.Description ?? "").Trim()} {hashtags}")),
                    new XElement(contentNs + "encoded", new XCData(fullHtmlSummary)),
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
                    new XAttribute(XNamespace.Xmlns + "content", contentNs),
                    channel
                )
            );

            Response.Headers.CacheControl = "public, max-age=300";
            return Content(feed.ToString(), "application/rss+xml");
        }

        private async Task<List<Article>> FetchArticlesInternal(string feedType)
        {
            var articles = new List<Article>();
            try
            {
                if (feedType == "bing")
                {
                    var apiKey = Environment.GetEnvironmentVariable("BING_API_KEY");
                    if (!string.IsNullOrEmpty(apiKey))
                    {
                        var client = _httpClientFactory.CreateClient();
                        var url = "https://api.bing.microsoft.com/v7.0/news/search?q=latest news&mkt=en-IN";
                        var request = new HttpRequestMessage(HttpMethod.Get, url);
                        request.Headers.Add("Ocp-Apim-Subscription-Key", apiKey);
                        var response = await client.SendAsync(request);
                        if (response.IsSuccessStatusCode)
                        {
                            var json = await response.Content.ReadAsStringAsync();
                            using var doc = JsonDocument.Parse(json);
                            if (doc.RootElement.TryGetProperty("value", out var valueElement))
                            {
                                var bingArticles = JsonSerializer.Deserialize<List<BingArticleDto>>(valueElement.GetRawText(), _jsonOptions);
                                if (bingArticles != null)
                                {
                                    articles = bingArticles.Select(b => new Article
                                    {
                                        Title = b.Name,
                                        Description = b.Description,
                                        Url = b.Url,
                                        UrlToImage = b.Image?.Thumbnail?.ContentUrl,
                                        PublishedAt = b.DatePublished,
                                        Source = new Source { Name = b.Provider?.FirstOrDefault()?.Name ?? "Bing News" }
                                    }).ToList();
                                }
                            }
                        }
                    }
                }
                else if (feedType == "money")
                {
                    // Call news service business/money news directly
                    var context = new NewsQueryContext
                    {
                        Country = "us",
                        Category = "business",
                        IsTopHeadlines = true,
                        Page = 1,
                        PageSize = 20
                    };
                    var fetchResult = await _newsApiService.FetchCombinedNewsAsync(context);
                    if (fetchResult.Success)
                    {
                        var apiResponse = JsonSerializer.Deserialize<NewsApiResponse>(fetchResult.Body, _jsonOptions);
                        var rawArticles = apiResponse?.Articles ?? new List<Article>();
                        var enriched = await _enrichmentService.FilterDeduplicateAndEnrichAsync(rawArticles, "Money");
                        articles = enriched.Select(e => new Article
                        {
                            Title = e.Title,
                            Description = e.Description,
                            Url = e.Url,
                            UrlToImage = e.UrlToImage,
                            PublishedAt = e.PublishedAt,
                            Source = new Source { Name = e.Source?.Name }
                        }).ToList();
                    }
                }
                else if (feedType == "search")
                {
                    var context = new NewsQueryContext
                    {
                        Query = "latest news",
                        Page = 1,
                        PageSize = 20,
                        Country = "us",
                        Language = "en",
                        IsTopHeadlines = false
                    };
                    var fetchResult = await _newsApiService.FetchNewsAsync(context);
                    if (fetchResult.Success)
                    {
                        var apiResponse = JsonSerializer.Deserialize<NewsApiResponse>(fetchResult.Body, _jsonOptions);
                        var rawArticles = apiResponse?.Articles ?? new List<Article>();
                        var enriched = await _enrichmentService.FilterDeduplicateAndEnrichAsync(rawArticles, "Search");
                        articles = enriched.Select(e => new Article
                        {
                            Title = e.Title,
                            Description = e.Description,
                            Url = e.Url,
                            UrlToImage = e.UrlToImage,
                            PublishedAt = e.PublishedAt,
                            Source = new Source { Name = e.Source?.Name }
                        }).ToList();
                    }
                }
                else // discover
                {
                    var context = new NewsQueryContext
                    {
                        Country = "us",
                        Category = "general",
                        IsTopHeadlines = true,
                        Page = 1,
                        PageSize = 20
                    };
                    var fetchResult = await _newsApiService.FetchCombinedNewsAsync(context);
                    if (fetchResult.Success)
                    {
                        var apiResponse = JsonSerializer.Deserialize<NewsApiResponse>(fetchResult.Body, _jsonOptions);
                        var rawArticles = apiResponse?.Articles ?? new List<Article>();
                        var enriched = await _enrichmentService.FilterDeduplicateAndEnrichAsync(rawArticles, "Discover");
                        articles = enriched.Select(e => new Article
                        {
                            Title = e.Title,
                            Description = e.Description,
                            Url = e.Url,
                            UrlToImage = e.UrlToImage,
                            PublishedAt = e.PublishedAt,
                            Source = new Source { Name = e.Source?.Name }
                        }).ToList();
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️ RSS FetchArticlesInternal failed for feed '{feedType}': {ex.Message}");
            }

            return articles
                .Where(a => !string.IsNullOrEmpty(a.Url))
                .GroupBy(a => a.Url)
                .Select(g => g.First())
                .OrderByDescending(a => a.PublishedAt ?? DateTime.MinValue)
                .Take(10)
                .ToList();
        }
    }

    // Helper classes for Bing API response mapping
    public class BingArticleDto
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Url { get; set; } = string.Empty;
        public BingImageDto? Image { get; set; }
        public DateTime DatePublished { get; set; }
        public List<BingProviderDto>? Provider { get; set; }
    }

    public class BingImageDto
    {
        public BingThumbnailDto? Thumbnail { get; set; }
    }

    public class BingThumbnailDto
    {
        public string ContentUrl { get; set; } = string.Empty;
    }

    public class BingProviderDto
    {
        public string Name { get; set; } = string.Empty;
    }
}
