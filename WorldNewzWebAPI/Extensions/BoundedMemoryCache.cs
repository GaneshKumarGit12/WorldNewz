using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Primitives;

namespace WorldNewzWebAPI.Extensions
{
    /// <summary>
    /// Wraps MemoryCache with a strict SizeLimit while defaulting omitted entry sizes to 1,
    /// preventing unbounded cache growth (OOM on Render.com 512 MB tier) without breaking
    /// callers that omit explicit Size on MemoryCacheEntryOptions.
    /// </summary>
    public sealed class BoundedMemoryCache : IMemoryCache
    {
        private readonly MemoryCache _inner;

        public BoundedMemoryCache(long sizeLimit = 2048)
        {
            _inner = new MemoryCache(new MemoryCacheOptions
            {
                SizeLimit = sizeLimit,
                CompactionPercentage = 0.25,
                ExpirationScanFrequency = TimeSpan.FromMinutes(2)
            });
        }

        public ICacheEntry CreateEntry(object key)
        {
            return new DefaultSizedCacheEntry(_inner.CreateEntry(key));
        }

        public void Remove(object key) => _inner.Remove(key);

        public bool TryGetValue(object key, out object? value) => _inner.TryGetValue(key, out value);

        public void Dispose() => _inner.Dispose();

        private sealed class DefaultSizedCacheEntry : ICacheEntry
        {
            private readonly ICacheEntry _inner;

            public DefaultSizedCacheEntry(ICacheEntry inner)
            {
                _inner = inner;
            }

            public object Key => _inner.Key;
            public object? Value { get => _inner.Value; set => _inner.Value = value; }
            public DateTimeOffset? AbsoluteExpiration { get => _inner.AbsoluteExpiration; set => _inner.AbsoluteExpiration = value; }
            public TimeSpan? AbsoluteExpirationRelativeToNow { get => _inner.AbsoluteExpirationRelativeToNow; set => _inner.AbsoluteExpirationRelativeToNow = value; }
            public TimeSpan? SlidingExpiration { get => _inner.SlidingExpiration; set => _inner.SlidingExpiration = value; }
            public IList<IChangeToken> ExpirationTokens => _inner.ExpirationTokens;
            public IList<PostEvictionCallbackRegistration> PostEvictionCallbacks => _inner.PostEvictionCallbacks;
            public CacheItemPriority Priority { get => _inner.Priority; set => _inner.Priority = value; }
            public long? Size { get => _inner.Size; set => _inner.Size = value; }

            public void Dispose()
            {
                if (_inner.Size == null)
                {
                    _inner.Size = 1;
                }
                _inner.Dispose();
            }
        }
    }
}
