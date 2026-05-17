using System.Threading.Channels;
using WorldNewzWebAPI.Models;

namespace WorldNewzWebAPI.Services
{
    public interface IFacebookPostQueue
    {
        ValueTask EnqueuePostAsync(NewsArticle article);
        ValueTask<NewsArticle> DequeuePostAsync(CancellationToken cancellationToken);
    }

    public class FacebookPostQueue : IFacebookPostQueue
    {
        private readonly Channel<NewsArticle> _queue;

        public FacebookPostQueue()
        {
            var options = new BoundedChannelOptions(100)
            {
                FullMode = BoundedChannelFullMode.Wait
            };
            _queue = Channel.CreateBounded<NewsArticle>(options);
        }

        public async ValueTask EnqueuePostAsync(NewsArticle article)
        {
            await _queue.Writer.WriteAsync(article);
        }

        public async ValueTask<NewsArticle> DequeuePostAsync(CancellationToken cancellationToken)
        {
            return await _queue.Reader.ReadAsync(cancellationToken);
        }
    }
}
