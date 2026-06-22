using Quartz;
using System.Threading.Tasks;
using System;
using WorldNewzWebAPI.Services;

namespace WorldNewzWebAPI.Jobs
{
    public class AmazonProductRefreshJob : IJob
    {
        private readonly AmazonProductService _productService;

        public AmazonProductRefreshJob(AmazonProductService productService)
        {
            _productService = productService;
        }

        public async Task Execute(IJobExecutionContext context)
        {
            try
            {
                Console.WriteLine($"[Quartz] Running scheduled daily refresh for Amazon deals at {DateTime.Now}");
                await _productService.RefreshDailyDealsAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Quartz] AmazonProductRefreshJob failed: {ex.Message}");
            }
        }
    }
}
