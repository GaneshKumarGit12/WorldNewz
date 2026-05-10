using Quartz;
using WorldNewzWebAPI.Services;

namespace WorldNewzWebAPI.Jobs
{
    public class DailyKeywordJob : IJob
    {
        private readonly SeoKeywordService _seoService;
        private readonly ILogger<DailyKeywordJob> _log;

        public DailyKeywordJob(SeoKeywordService seoService, ILogger<DailyKeywordJob> log)
        {
            _seoService = seoService;
            _log = log;
        }

        public async Task Execute(IJobExecutionContext context)
        {
            try
            {
                _log.LogInformation("[Quartz] Starting daily keyword generation job.");
                await _seoService.RefreshAllKeywordsAsync();
                _log.LogInformation("[Quartz] Daily keyword generation job completed.");
            }
            catch (Exception ex)
            {
                _log.LogError(ex, "[Quartz] DailyKeywordJob failed.");
            }
        }
    }
}
