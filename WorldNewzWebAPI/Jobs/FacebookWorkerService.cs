using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Threading;
using System.Threading.Tasks;
using WorldNewzWebAPI.Services;

namespace WorldNewzWebAPI.Jobs
{
    public class FacebookWorkerService : BackgroundService
    {
        private readonly IFacebookPostQueue _queue;
        private readonly IServiceProvider _serviceProvider;

        public FacebookWorkerService(IFacebookPostQueue queue, IServiceProvider serviceProvider)
        {
            _queue = queue;
            _serviceProvider = serviceProvider;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            Console.WriteLine("[FacebookWorkerService] Started queue processing.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    // Wait for an item to be available in the queue
                    var article = await _queue.DequeuePostAsync(stoppingToken);

                    // Create scope to resolve FacebookService
                    using var scope = _serviceProvider.CreateScope();
                    var fbService = scope.ServiceProvider.GetRequiredService<FacebookService>();
                    
                    Console.WriteLine($"[FacebookWorkerService] Processing post: {article.Title}");
                    await fbService.PostSingleArticleAsync(article);

                    // No arbitrary 60-second delay. We process the next item immediately.
                    // If you want a small buffer (like 2 seconds) to avoid immediate sequential API hits, uncomment the below.
                    // await Task.Delay(2000, stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    // Prevent throwing if stoppingToken is canceled during delay or read
                    break;
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[FacebookWorkerService] Error processing queue: {ex.Message}");
                }
            }

            Console.WriteLine("[FacebookWorkerService] Stopped.");
        }
    }
}
