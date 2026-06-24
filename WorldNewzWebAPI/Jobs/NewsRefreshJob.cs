using Quartz;
using WorldNewzWebAPI.Services;

namespace WorldNewzWebAPI.Jobs
{
    public class NewsRefreshJob : IJob
    {
        private readonly NewsService _newsService;
        private readonly INewsEnrichmentService _enrichmentService;

        public NewsRefreshJob(NewsService newsService, INewsEnrichmentService enrichmentService)
        {
            _newsService = newsService;
            _enrichmentService = enrichmentService;
        }

        public async Task Execute(IJobExecutionContext context)
        {
            try
            {
                Console.WriteLine($"[Quartz] Refreshing news at {DateTime.Now}");
                var categories = new[] { "Discover", "Sports", "Money", "Weather", "Shopping" };
                foreach (var category in categories)
                {
                    try
                    {
                        await _newsService.FetchAndCacheNews(category.ToLower());
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[Quartz] Error fetching news for category '{category}': {ex.Message}");
                    }
                }

                // Pre-enrich the latest articles to fix thin content
                try
                {
                    await _enrichmentService.PreEnrichLatestArticlesAsync(5);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[Quartz] Pre-enrichment failed: {ex.Message}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Quartz] NewsRefreshJob failed: {ex.Message}");
            }
        }
    }
}
