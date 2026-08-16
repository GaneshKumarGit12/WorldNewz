using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace WorldNewzWebAPI.Services
{
    /// <summary>
    /// Background HostedService that periodically refreshes the Amazon Creator API OAuth2 access token
    /// before it expires, removing authentication latency from user-facing requests.
    /// </summary>
    public class AmazonTokenBackgroundRefreshService : BackgroundService
    {
        private readonly AmazonCreatorApiService _apiService;
        private readonly ILogger<AmazonTokenBackgroundRefreshService> _logger;
        private readonly TimeSpan _refreshInterval = TimeSpan.FromMinutes(45);

        public AmazonTokenBackgroundRefreshService(
            AmazonCreatorApiService apiService,
            ILogger<AmazonTokenBackgroundRefreshService> logger)
        {
            _apiService = apiService;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            if (!_apiService.IsConfigured)
            {
                _logger.LogInformation("[AmazonTokenBackgroundRefreshService] Amazon Creator API credentials not configured. Background token refresh suspended.");
                return;
            }

            _logger.LogInformation("[AmazonTokenBackgroundRefreshService] Background token refresh timer initialized.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    _logger.LogInformation("[AmazonTokenBackgroundRefreshService] Performing proactive background OAuth2 token refresh...");
                    await _apiService.GetAccessTokenAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogWarning($"[AmazonTokenBackgroundRefreshService] Proactive token refresh encountered transient issue: {ex.Message}");
                }

                try
                {
                    await Task.Delay(_refreshInterval, stoppingToken);
                }
                catch (TaskCanceledException)
                {
                    break;
                }
            }

            _logger.LogInformation("[AmazonTokenBackgroundRefreshService] Background token refresh service stopping.");
        }
    }
}
