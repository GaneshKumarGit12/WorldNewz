using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace WorldNewzWebAPI.Services
{
    /// <summary>
    /// Background HostedService that periodically refreshes the Amazon Creator API OAuth2 access token
    /// before it expires, removing authentication latency from user-facing requests.
    /// Uses IServiceScopeFactory to avoid capturing transient/typed HttpClient services across the host lifetime.
    /// </summary>
    public class AmazonTokenBackgroundRefreshService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<AmazonTokenBackgroundRefreshService> _logger;
        private readonly TimeSpan _refreshInterval = TimeSpan.FromMinutes(45);

        public AmazonTokenBackgroundRefreshService(
            IServiceScopeFactory scopeFactory,
            ILogger<AmazonTokenBackgroundRefreshService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            using (var checkScope = _scopeFactory.CreateScope())
            {
                var apiService = checkScope.ServiceProvider.GetRequiredService<AmazonCreatorApiService>();
                if (!apiService.IsConfigured)
                {
                    _logger.LogInformation("[AmazonTokenBackgroundRefreshService] Amazon Creator API credentials not configured. Background token refresh suspended.");
                    return;
                }
            }

            _logger.LogInformation("[AmazonTokenBackgroundRefreshService] Background token refresh timer initialized.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var apiService = scope.ServiceProvider.GetRequiredService<AmazonCreatorApiService>();
                    _logger.LogInformation("[AmazonTokenBackgroundRefreshService] Performing proactive background OAuth2 token refresh...");
                    await apiService.GetAccessTokenAsync();
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
