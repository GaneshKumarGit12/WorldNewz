using Quartz;
using System;
using System.Threading.Tasks;
using WorldNewzWebAPI.Services;

namespace WorldNewzWebAPI.Jobs
{
    public class SitemapPingJob : IJob
    {
        private readonly ISitemapPingService _pingService;

        public SitemapPingJob(ISitemapPingService pingService)
        {
            _pingService = pingService;
        }

        public async Task Execute(IJobExecutionContext context)
        {
            try
            {
                Console.WriteLine($"[Quartz] Running scheduled sitemap ping to search engines at {DateTime.UtcNow}");
                await _pingService.PingSearchEnginesAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Quartz] SitemapPingJob failed: {ex.Message}");
            }
        }
    }
}
