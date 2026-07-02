using System;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace WorldNewzWebAPI.Services
{
    public interface ISitemapPingService
    {
        Task PingSearchEnginesAsync();
    }

    public class SitemapPingService : ISitemapPingService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<SitemapPingService> _logger;

        public SitemapPingService(IHttpClientFactory httpClientFactory, ILogger<SitemapPingService> logger)
        {
            _httpClientFactory = httpClientFactory;
            _logger = logger;
        }

        public async Task PingSearchEnginesAsync()
        {
            var sitemapUrl = "https://worldnewzs.in/news-sitemap.xml";
            var client = _httpClientFactory.CreateClient();

            var pingTargets = new[]
            {
                $"https://www.google.com/ping?sitemap={Uri.EscapeDataString(sitemapUrl)}",
                $"https://www.bing.com/ping?sitemap={Uri.EscapeDataString(sitemapUrl)}"
            };

            foreach (var target in pingTargets)
            {
                try
                {
                    var response = await client.GetAsync(target);
                    _logger.LogInformation($"Sitemap ping to {target} returned status {response.StatusCode}");
                }
                catch (Exception ex)
                {
                    _logger.LogWarning($"Sitemap ping failed for {target}: {ex.Message}");
                }
            }
        }
    }
}
