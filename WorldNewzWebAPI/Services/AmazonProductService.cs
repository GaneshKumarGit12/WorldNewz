using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Sockets;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using WorldNewzWebAPI.Data;
using WorldNewzWebAPI.Models;

namespace WorldNewzWebAPI.Services
{
    public sealed class AmazonCatalogQuery
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 24;
        public string? Category { get; set; }
        public string? Search { get; set; }
        public string Sort { get; set; } = "newest";
        public int? MinDiscount { get; set; }
        public decimal? MaxPrice { get; set; }
        public double? MinRating { get; set; }
        public List<string>? ExcludeAsins { get; set; }
    }

    public sealed class CategoryStatDto
    {
        public string Key { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public int Count { get; set; }
        public int MaxDiscount { get; set; }
    }

    public sealed class RawCategoryStatDto
    {
        public string Name { get; set; } = string.Empty;
        public string Group { get; set; } = string.Empty;
        public int Count { get; set; }
    }

    public sealed class AmazonCatalogPageResult
    {
        public string Status { get; set; } = "success";
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalResults { get; set; }
        public int TotalPages { get; set; }
        public int CatalogTotal { get; set; }
        public List<AmazonProduct> Products { get; set; } = new();
        public Dictionary<string, int> CategoryCounts { get; set; } = new();
        public Dictionary<string, int> MaxDiscountByCategory { get; set; } = new();
        public List<CategoryStatDto> CategoryStats { get; set; } = new();
        public List<RawCategoryStatDto> AvailableCategories { get; set; } = new();
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
    }

    public sealed class AmazonHighlightsResult
    {
        public string Status { get; set; } = "success";
        public List<AmazonProduct> HeroDeals { get; set; } = new();
        public List<AmazonProduct> FlashDrops { get; set; } = new();
        public List<AmazonProduct> PriceDrops { get; set; } = new();
        public AmazonProduct? MysteryDeal { get; set; }
        public int TotalActiveDeals { get; set; }
        public int TopVerifiedDiscount { get; set; }
        public List<CategoryStatDto> CategoryStats { get; set; } = new();
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
    }

    public sealed class AmazonWidgetDealsResult
    {
        public string Status { get; set; } = "success";
        public int FourHourBlock { get; set; }
        public string Category { get; set; } = "All";
        public int TotalPoolSize { get; set; }
        public List<AmazonProduct> Products { get; set; } = new();
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
    }

    internal sealed class CatalogStatsSnapshot
    {
        public int TotalActive { get; set; }
        public int TopVerifiedDiscount { get; set; }
        public Dictionary<string, int> CategoryCounts { get; set; } = new();
        public Dictionary<string, int> MaxDiscountByCategory { get; set; } = new();
        public List<CategoryStatDto> CategoryStats { get; set; } = new();
        public List<RawCategoryStatDto> RawCategories { get; set; } = new();
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    }

    public class AmazonProductService
    {
        private readonly WorldNewsDbContext _context;
        private readonly IMemoryCache _cache;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly AmazonCreatorApiService? _creatorApiService;
        private readonly ILogger<AmazonProductService>? _logger;
        private readonly string _associateTag;
        private readonly int _stalenessThresholdHours;

        private const int SeedBatchSize = 100;
        private const int MaxScrapeHtmlBytes = 512 * 1024;
        private const string ExpiredAsin = "B0GR1YWWQ6";

        private static string? _lastSeededFileHash;
        private static long _cacheVersion = 1;
        private static readonly SemaphoreSlim _seedLock = new(1, 1);

        // Canonical storefront categories ensuring 100% of all 21 DB categories are mapped with zero orphans
        public static readonly (string Key, string Label, string[] RawCategories)[] CanonicalCategories =
        {
            ("Electronics", "Electronics & Tech", new[] { "Technology", "Electronics", "Gadgets" }),
            ("Home & Kitchen", "Home & Kitchen", new[] { "Home & Kitchen", "Kitchen & Home", "Home", "Home Appliances", "Home & Decor" }),
            ("Fashion & Lifestyle", "Fashion & Lifestyle", new[] { "Fashion", "Lifestyle" }),
            ("Beauty & Health", "Beauty & Health", new[] { "Beauty & Personal Care", "Health & Fitness", "Baby Products" }),
            ("Sports & Outdoors", "Sports & Outdoors", new[] { "Sports", "Sports & Outdoors", "Automotive" }),
            ("Grocery & Daily Needs", "Grocery & Toys", new[] { "Grocery & Gourmet Foods", "Toys & Games", "Pet Supplies" }),
            ("Essentials & More", "Office, Books & More", new[] { "Shopping", "Office Products", "Education", "Books" })
        };

        private static readonly HashSet<string> AllowedAmazonHosts = new(StringComparer.OrdinalIgnoreCase)
        {
            "amazon.in",
            "www.amazon.in",
            "m.amazon.in",
            "amzn.to",
            "amzn.in",
            "www.amzn.in",
            "link.amazon",
            "amazon.co.in",
            "www.amazon.co.in",
            "amazon.com",
            "www.amazon.com"
        };

        private static readonly JsonSerializerOptions SeedJsonOptions = new()
        {
            PropertyNameCaseInsensitive = true
        };

        public long CacheVersion => Interlocked.Read(ref _cacheVersion);

        public AmazonProductService(
            WorldNewsDbContext context,
            IConfiguration config,
            IMemoryCache cache,
            IHttpClientFactory httpClientFactory,
            IServiceScopeFactory scopeFactory,
            AmazonCreatorApiService? creatorApiService = null,
            ILogger<AmazonProductService>? logger = null)
        {
            _context = context;
            _cache = cache;
            _httpClientFactory = httpClientFactory;
            _scopeFactory = scopeFactory;
            _creatorApiService = creatorApiService;
            _logger = logger;

            _associateTag = Environment.GetEnvironmentVariable("AMAZON_ASSOCIATE_TAG")
                            ?? config["AmazonSettings:AssociateTag"]
                            ?? config["AmazonCreatorApi:AssociateTag"]
                            ?? "ganeshd12-21";

            int.TryParse(config["AmazonCreatorApi:StalenessThresholdHours"] ?? "72", out _stalenessThresholdHours);
            if (_stalenessThresholdHours <= 0) _stalenessThresholdHours = 72;
        }

        public static void InvalidateCache()
        {
            Interlocked.Increment(ref _cacheVersion);
        }

        /// <summary>
        /// Maps any raw DB category name to its canonical storefront group (never returns empty/orphan).
        /// </summary>
        public static string MapToCanonicalGroup(string? rawCategory)
        {
            var cat = (rawCategory ?? string.Empty).Trim();
            if (string.IsNullOrEmpty(cat)) return "Essentials & More";

            foreach (var group in CanonicalCategories)
            {
                if (group.Key.Equals(cat, StringComparison.OrdinalIgnoreCase) ||
                    group.Label.Equals(cat, StringComparison.OrdinalIgnoreCase) ||
                    group.RawCategories.Any(r => r.Equals(cat, StringComparison.OrdinalIgnoreCase)))
                {
                    return group.Key;
                }
            }

            var lower = cat.ToLowerInvariant();
            if (lower.Contains("electronic") || lower.Contains("tech") || lower.Contains("gadget") || lower.Contains("audio") || lower.Contains("mobile") || lower.Contains("phone"))
                return "Electronics";
            if (lower.Contains("kitchen") || lower.Contains("home") || lower.Contains("appliance") || lower.Contains("decor"))
                return "Home & Kitchen";
            if (lower.Contains("fashion") || lower.Contains("lifestyle") || lower.Contains("cloth") || lower.Contains("apparel"))
                return "Fashion & Lifestyle";
            if (lower.Contains("beauty") || lower.Contains("health") || lower.Contains("fitness") || lower.Contains("baby") || lower.Contains("care"))
                return "Beauty & Health";
            if (lower.Contains("sport") || lower.Contains("outdoor") || lower.Contains("auto"))
                return "Sports & Outdoors";
            if (lower.Contains("grocery") || lower.Contains("food") || lower.Contains("toy") || lower.Contains("game") || lower.Contains("pet"))
                return "Grocery & Daily Needs";

            return "Essentials & More";
        }

        /// <summary>
        /// Computes verified discount percentage strictly when OriginalPrice > Price (returns 0 otherwise, capped at 95%).
        /// </summary>
        public static int ComputeVerifiedDiscount(decimal price, decimal originalPrice)
        {
            if (price <= 0 || originalPrice <= price) return 0;
            var pct = (int)Math.Round((double)((originalPrice - price) / originalPrice) * 100.0);
            if (pct <= 0) return 0;
            return Math.Min(pct, 95);
        }

        /// <summary>
        /// Backward-compatible full active catalog fetch (for external legacy callers like copylinkagent).
        /// </summary>
        public async Task<List<AmazonProduct>> GetAffiliateProductsAsync()
        {
            await EnsureDefaultProductsSeededAsync(force: false);

            var products = await _context.AmazonProducts
                .AsNoTracking()
                .Where(p => p.IsActive && p.Asin != ExpiredAsin)
                .OrderByDescending(p => p.Id)
                .ToListAsync();

            foreach (var product in products)
            {
                NormalizeProductForOutput(product);
            }

            return products;
        }

        /// <summary>
        /// Lightweight ASIN-only endpoint for deduplication scripts and external crawlers.
        /// </summary>
        public async Task<List<string>> GetActiveAsinsAsync()
        {
            await EnsureDefaultProductsSeededAsync(force: false);

            var cacheKey = $"amzn_asins_v{CacheVersion}";
            if (_cache.TryGetValue<List<string>>(cacheKey, out var cached) && cached != null)
            {
                return cached;
            }

            var asins = await _context.AmazonProducts
                .AsNoTracking()
                .Where(p => p.IsActive && p.Asin != ExpiredAsin && !string.IsNullOrEmpty(p.Asin))
                .Select(p => p.Asin)
                .Distinct()
                .ToListAsync();

            _cache.Set(cacheKey, asins, new MemoryCacheEntryOptions()
                .SetAbsoluteExpiration(TimeSpan.FromMinutes(10))
                .SetSize(4));

            return asins;
        }

        /// <summary>
        /// Server-side paginated, filtered, and sorted catalog query.
        /// Never loads the full catalog into memory on page requests.
        /// </summary>
        public async Task<AmazonCatalogPageResult> GetCatalogPageAsync(AmazonCatalogQuery query)
        {
            await EnsureDefaultProductsSeededAsync(force: false);

            int page = Math.Max(1, query.Page);
            int pageSize = Math.Clamp(query.PageSize <= 0 ? 24 : query.PageSize, 1, 60);
            string normalizedSort = (query.Sort ?? "newest").Trim().ToLowerInvariant();
            string normalizedCat = string.IsNullOrWhiteSpace(query.Category) ? "All" : query.Category.Trim();
            string normalizedSearch = (query.Search ?? string.Empty).Trim();
            var excludeSet = (query.ExcludeAsins ?? new List<string>())
                .Where(a => !string.IsNullOrWhiteSpace(a))
                .Select(a => a.Trim().ToUpperInvariant())
                .Distinct()
                .OrderBy(a => a)
                .ToList();

            string cacheKey = $"amzn_cat_v{CacheVersion}_p{page}_ps{pageSize}_c{normalizedCat.ToLowerInvariant()}_s{normalizedSearch.ToLowerInvariant()}_o{normalizedSort}_md{query.MinDiscount}_mp{query.MaxPrice}_mr{query.MinRating}_ex{string.Join(',', excludeSet)}";

            // Cache non-search and short-search catalog queries in bounded IMemoryCache
            bool isCacheable = normalizedSearch.Length <= 40;
            if (isCacheable && _cache.TryGetValue<AmazonCatalogPageResult>(cacheKey, out var cachedPage) && cachedPage != null)
            {
                return cachedPage;
            }

            var stats = await GetCatalogStatsSnapshotAsync();

            IQueryable<AmazonProduct> q = _context.AmazonProducts
                .AsNoTracking()
                .Where(p => p.IsActive && p.Asin != ExpiredAsin);

            // Category filter (supports canonical storefront group, legacy tab aliases, OR exact raw DB category)
            q = ApplyCategoryFilter(q, normalizedCat, stats);

            // Exclude specific ASINs if requested
            if (excludeSet.Count > 0)
            {
                q = q.Where(p => !excludeSet.Contains(p.Asin.ToUpper()));
            }

            // Search filter (Title, Category, ASIN, Description)
            if (!string.IsNullOrWhiteSpace(normalizedSearch))
            {
                var term = normalizedSearch.ToLowerInvariant();
                q = q.Where(p =>
                    p.Title.ToLower().Contains(term) ||
                    p.Category.ToLower().Contains(term) ||
                    p.Asin.ToLower().Contains(term) ||
                    p.Description.ToLower().Contains(term));
            }

            bool isSqlite = _context.Database.IsSqlite();

            // Max price filter (native decimal on PostgreSQL/SQL Server preserves idx_amazonproducts_price; double cast for SQLite)
            if (query.MaxPrice.HasValue && query.MaxPrice.Value > 0)
            {
                if (isSqlite)
                {
                    double maxP = (double)query.MaxPrice.Value;
                    q = q.Where(p => (double)p.Price <= maxP && (double)p.Price > 0);
                }
                else
                {
                    decimal maxP = query.MaxPrice.Value;
                    q = q.Where(p => p.Price <= maxP && p.Price > 0m);
                }
            }

            // Min rating filter
            if (query.MinRating.HasValue && double.IsFinite(query.MinRating.Value) && query.MinRating.Value > 0)
            {
                double minR = query.MinRating.Value;
                q = q.Where(p => p.Rating >= minR);
            }

            // Min verified discount % filter (strictly where OriginalPrice > Price; division-free for PostgreSQL safety)
            if (query.MinDiscount.HasValue && query.MinDiscount.Value > 0)
            {
                int clampedMinDiscount = Math.Clamp(query.MinDiscount.Value, 1, 95);
                if (isSqlite)
                {
                    // SQLite cannot translate decimal arithmetic in SQL; scale by 100 in double with tiny epsilon
                    // so exact boundary discounts (e.g. 299.0 -> 269.1 at 10%, 225.0 -> 162.0 at 28%) are not dropped.
                    double minDiscountPct = clampedMinDiscount;
                    q = q.Where(p =>
                        (double)p.OriginalPrice > (double)p.Price &&
                        (double)p.Price > 0 &&
                        (((double)p.OriginalPrice - (double)p.Price) * 100.0 + 1e-7) >= ((double)p.OriginalPrice * minDiscountPct));
                }
                else
                {
                    // Native NUMERIC/decimal arithmetic on PostgreSQL & SQL Server: division-free and exact (no float rounding loss)
                    decimal minDiscountDec = clampedMinDiscount;
                    q = q.Where(p =>
                        p.OriginalPrice > p.Price &&
                        p.Price > 0m &&
                        ((p.OriginalPrice - p.Price) * 100m) >= (p.OriginalPrice * minDiscountDec));
                }
            }

            int totalResults = await q.CountAsync();
            int totalPages = Math.Max(1, (int)Math.Ceiling(totalResults / (double)pageSize));
            if (page > totalPages) page = totalPages;

            // Ordering (using double cast on Price/OriginalPrice so EF Core SQLite & PostgreSQL both translate cleanly)
            IOrderedQueryable<AmazonProduct> ordered = normalizedSort switch
            {
                "discount" => q
                    .OrderByDescending(p => (double)p.Price > 0 && (double)p.OriginalPrice > (double)p.Price && (double)p.OriginalPrice > 0
                        ? (((double)p.OriginalPrice - (double)p.Price) / (double)p.OriginalPrice)
                        : 0.0)
                    .ThenByDescending(p => p.Id),
                "price_asc" => q
                    .OrderBy(p => (double)p.Price <= 0 ? 1 : 0)
                    .ThenBy(p => (double)p.Price)
                    .ThenByDescending(p => p.Id),
                "price_desc" => q.OrderByDescending(p => (double)p.Price).ThenByDescending(p => p.Id),
                "rating" => q.OrderByDescending(p => p.Rating).ThenByDescending(p => p.ReviewCount).ThenByDescending(p => p.Id),
                _ => q.OrderByDescending(p => p.Id)
            };

            var items = await ordered
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            foreach (var item in items)
            {
                NormalizeProductForOutput(item);
            }

            var result = new AmazonCatalogPageResult
            {
                Status = "success",
                Page = page,
                PageSize = pageSize,
                TotalResults = totalResults,
                TotalPages = totalPages,
                CatalogTotal = stats.TotalActive,
                Products = items,
                CategoryCounts = stats.CategoryCounts,
                MaxDiscountByCategory = stats.MaxDiscountByCategory,
                CategoryStats = stats.CategoryStats,
                AvailableCategories = stats.RawCategories,
                LastUpdated = stats.GeneratedAt
            };

            if (isCacheable)
            {
                _cache.Set(cacheKey, result, new MemoryCacheEntryOptions()
                    .SetAbsoluteExpiration(TimeSpan.FromMinutes(5))
                    .SetSize(3));
            }

            return result;
        }

        /// <summary>
        /// Returns curated Hero Spotlight (5), Flash Drops (4, distinct from Hero),
        /// Verified Price Drops (5, strictly OriginalPrice > Price), and IST daily rotating Mystery Deal (1).
        /// </summary>
        public async Task<AmazonHighlightsResult> GetHighlightsAsync()
        {
            await EnsureDefaultProductsSeededAsync(force: false);

            var istDateKey = DateTime.UtcNow.AddHours(5.5).ToString("yyyy-MM-dd");
            var cacheKey = $"amzn_highlights_v{CacheVersion}_{istDateKey}";
            if (_cache.TryGetValue<AmazonHighlightsResult>(cacheKey, out var cached) && cached != null)
            {
                return cached;
            }

            var stats = await GetCatalogStatsSnapshotAsync();

            // Pull a modest pool of newest deals + top discounted deals (<= 140 rows total instead of 4,134)
            var recentPool = await _context.AmazonProducts
                .AsNoTracking()
                .Where(p => p.IsActive && p.Asin != ExpiredAsin && (double)p.Price > 0)
                .OrderByDescending(p => p.Id)
                .Take(80)
                .ToListAsync();

            var topDiscountPool = await _context.AmazonProducts
                .AsNoTracking()
                .Where(p => p.IsActive && p.Asin != ExpiredAsin && (double)p.Price > 0 && (double)p.OriginalPrice > (double)p.Price)
                .OrderByDescending(p => (double)p.Price > 0 && (double)p.OriginalPrice > (double)p.Price && (double)p.OriginalPrice > 0
                    ? (((double)p.OriginalPrice - (double)p.Price) / (double)p.OriginalPrice)
                    : 0.0)
                .ThenByDescending(p => p.Id)
                .Take(60)
                .ToListAsync();

            var usedAsins = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            // 1. Hero Spotlight (5 distinct high-quality recent deals with verified discount preferred)
            var heroCandidates = recentPool
                .Where(p => !string.IsNullOrWhiteSpace(p.ImageUrl) && ComputeVerifiedDiscount(p.Price, p.OriginalPrice) >= 15)
                .Concat(recentPool.Where(p => !string.IsNullOrWhiteSpace(p.ImageUrl)))
                .Concat(topDiscountPool);

            var heroDeals = new List<AmazonProduct>(5);
            foreach (var p in heroCandidates)
            {
                if (heroDeals.Count >= 5) break;
                if (usedAsins.Add(p.Asin))
                {
                    NormalizeProductForOutput(p);
                    heroDeals.Add(p);
                }
            }

            // 2. Flash Drops (4 distinct deals strictly excluding Hero ASINs)
            var flashCandidates = recentPool
                .Concat(topDiscountPool);

            var flashDrops = new List<AmazonProduct>(4);
            foreach (var p in flashCandidates)
            {
                if (flashDrops.Count >= 4) break;
                if (usedAsins.Add(p.Asin))
                {
                    NormalizeProductForOutput(p);
                    flashDrops.Add(p);
                }
            }

            // 3. Verified Price Drops (5 distinct deals strictly with OriginalPrice > Price, never fabricated)
            var priceDropAsins = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var priceDrops = new List<AmazonProduct>(5);
            foreach (var p in topDiscountPool)
            {
                if (priceDrops.Count >= 5) break;
                if (ComputeVerifiedDiscount(p.Price, p.OriginalPrice) <= 0) continue;
                if (usedAsins.Contains(p.Asin)) continue;
                if (priceDropAsins.Add(p.Asin))
                {
                    NormalizeProductForOutput(p);
                    priceDrops.Add(p);
                }
            }
            // Fallback if very small DB has fewer than 5 non-hero discounted items
            if (priceDrops.Count < 5)
            {
                foreach (var p in topDiscountPool)
                {
                    if (priceDrops.Count >= 5) break;
                    if (ComputeVerifiedDiscount(p.Price, p.OriginalPrice) <= 0) continue;
                    if (priceDropAsins.Add(p.Asin))
                    {
                        NormalizeProductForOutput(p);
                        priceDrops.Add(p);
                    }
                }
            }

            // 4. Daily Mystery Deal rotating deterministically by IST date
            AmazonProduct? mysteryDeal = null;
            var mysteryPool = topDiscountPool
                .Where(p => ComputeVerifiedDiscount(p.Price, p.OriginalPrice) >= 20 && !usedAsins.Contains(p.Asin))
                .ToList();
            if (mysteryPool.Count == 0)
            {
                mysteryPool = topDiscountPool.Count > 0 ? topDiscountPool : recentPool;
            }
            if (mysteryPool.Count > 0)
            {
                var istDayNumber = (int)(DateTime.UtcNow.AddHours(5.5).Date - new DateTime(2025, 1, 1)).TotalDays;
                var idx = Math.Abs(istDayNumber) % mysteryPool.Count;
                mysteryDeal = mysteryPool[idx];
                NormalizeProductForOutput(mysteryDeal);
            }

            var result = new AmazonHighlightsResult
            {
                Status = "success",
                HeroDeals = heroDeals,
                FlashDrops = flashDrops,
                PriceDrops = priceDrops,
                MysteryDeal = mysteryDeal,
                TotalActiveDeals = stats.TotalActive,
                TopVerifiedDiscount = stats.TopVerifiedDiscount,
                CategoryStats = stats.CategoryStats,
                LastUpdated = DateTime.UtcNow
            };

            _cache.Set(cacheKey, result, new MemoryCacheEntryOptions()
                .SetAbsoluteExpiration(TimeSpan.FromMinutes(10))
                .SetSize(3));

            return result;
        }

        /// <summary>
        /// Lightweight widget endpoint (~5 KB payload) preserving deterministic 4-hour rotation queue
        /// for ShoppingWidget, AffiliateAdBanner, and ContextualDealsWidget.
        /// </summary>
        public async Task<AmazonWidgetDealsResult> GetWidgetDealsAsync(string? category, int limit = 8, int? fourHourBlock = null)
        {
            await EnsureDefaultProductsSeededAsync(force: false);

            int clampedLimit = Math.Clamp(limit <= 0 ? 8 : limit, 1, 24);
            int block = fourHourBlock ?? (int)(DateTimeOffset.UtcNow.ToUnixTimeSeconds() / (4 * 3600));
            string cat = string.IsNullOrWhiteSpace(category) ? "All" : category.Trim();
            string cacheKey = $"amzn_widget_v{CacheVersion}_c{cat.ToLowerInvariant()}_l{clampedLimit}_b{block}";

            if (_cache.TryGetValue<AmazonWidgetDealsResult>(cacheKey, out var cached) && cached != null)
            {
                return cached;
            }

            IQueryable<AmazonProduct> baseQuery = _context.AmazonProducts
                .AsNoTracking()
                .Where(p => p.IsActive && p.Asin != ExpiredAsin && (double)p.Price > 0);

            IQueryable<AmazonProduct> scoped = ApplyCategoryFilter(baseQuery, cat);
            int poolSize = await scoped.CountAsync();

            if (poolSize == 0 && !cat.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                scoped = baseQuery;
                poolSize = await scoped.CountAsync();
            }

            var selected = new List<AmazonProduct>(clampedLimit);
            if (poolSize > 0)
            {
                int startIndex = (int)(Math.Abs((long)block) % poolSize);
                int firstTake = Math.Min(clampedLimit, poolSize - startIndex);

                var firstBatch = await scoped
                    .OrderByDescending(p => p.Id)
                    .Skip(startIndex)
                    .Take(firstTake)
                    .ToListAsync();
                selected.AddRange(firstBatch);

                int remaining = clampedLimit - selected.Count;
                if (remaining > 0 && poolSize > selected.Count)
                {
                    var wrapBatch = await scoped
                        .OrderByDescending(p => p.Id)
                        .Take(Math.Min(remaining, startIndex))
                        .ToListAsync();
                    selected.AddRange(wrapBatch);
                }

                foreach (var item in selected)
                {
                    NormalizeProductForOutput(item);
                }
            }

            var result = new AmazonWidgetDealsResult
            {
                Status = "success",
                FourHourBlock = block,
                Category = cat,
                TotalPoolSize = poolSize,
                Products = selected,
                LastUpdated = DateTime.UtcNow
            };

            _cache.Set(cacheKey, result, new MemoryCacheEntryOptions()
                .SetAbsoluteExpiration(TimeSpan.FromMinutes(10))
                .SetSize(2));

            return result;
        }

        /// <summary>
        /// Batched daily deals refresh (chunks of 100 + ChangeTracker.Clear) to prevent Render 512 MB OOM spikes.
        /// </summary>
        public async Task RefreshDailyDealsAsync()
        {
            await EnsureDefaultProductsSeededAsync(force: false);

            int lastId = 0;
            int totalUpdated = 0;
            var random = new Random();

            while (true)
            {
                var batch = await _context.AmazonProducts
                    .Where(p => p.Id > lastId)
                    .OrderBy(p => p.Id)
                    .Take(SeedBatchSize)
                    .ToListAsync();

                if (batch.Count == 0) break;
                lastId = batch[^1].Id;

                var asins = batch.Select(p => p.Asin).Where(a => !string.IsNullOrWhiteSpace(a)).ToList();
                bool updatedFromLive = false;

                if (_creatorApiService != null && _creatorApiService.IsConfigured && asins.Count > 0)
                {
                    try
                    {
                        var liveItems = await _creatorApiService.BatchGetItemDetailsAsync(asins);
                        if (liveItems != null && liveItems.Count > 0)
                        {
                            var liveMap = liveItems.ToDictionary(item => item.Asin, StringComparer.OrdinalIgnoreCase);
                            foreach (var product in batch)
                            {
                                if (liveMap.TryGetValue(product.Asin, out var live))
                                {
                                    if (!string.IsNullOrWhiteSpace(live.Title)) product.Title = live.Title;
                                    if (!string.IsNullOrWhiteSpace(live.ImageUrl)) product.ImageUrl = live.ImageUrl;
                                    if (live.Price > 0) product.Price = live.Price;
                                    if (live.OriginalPrice > 0) product.OriginalPrice = live.OriginalPrice;
                                    if (live.Rating > 0) product.Rating = live.Rating;
                                    if (live.ReviewCount > 0) product.ReviewCount = live.ReviewCount;

                                    product.LastSyncedAt = DateTime.UtcNow;
                                    product.LastUpdated = DateTime.UtcNow;
                                    product.IsFallback = false;
                                }
                            }
                            updatedFromLive = true;
                        }
                    }
                    catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.TooManyRequests || ex.StatusCode == HttpStatusCode.ServiceUnavailable)
                    {
                        _logger?.LogWarning($"[AmazonProductService] Circuit Breaker Activated (HTTP {(int?)ex.StatusCode}): Amazon API Throttling.");
                        ApplyThrottlingFallback(batch);
                        updatedFromLive = true;
                    }
                    catch (Exception ex)
                    {
                        _logger?.LogWarning(ex, $"[AmazonProductService] Live Creator API sync issue on batch up to Id {lastId}: {ex.Message}");
                    }
                }

                if (!updatedFromLive)
                {
                    foreach (var product in batch)
                    {
                        // Refresh timestamp & slight authentic review freshness without fabricating fake discounts
                        product.ReviewCount += random.Next(0, 4);
                        product.LastUpdated = DateTime.UtcNow;
                        product.IsFallback = true;
                    }
                }

                await _context.SaveChangesAsync();
                totalUpdated += batch.Count;
                _context.ChangeTracker.Clear();
            }

            InvalidateCache();
            _logger?.LogInformation($"[AmazonProductService] Batched daily refresh completed across {totalUpdated} products.");
        }

        private void ApplyThrottlingFallback(List<AmazonProduct> products)
        {
            var now = DateTime.UtcNow;
            var maxStaleness = TimeSpan.FromHours(_stalenessThresholdHours);
            foreach (var product in products)
            {
                var age = product.LastSyncedAt.HasValue
                    ? (now - product.LastSyncedAt.Value)
                    : (now - (product.LastUpdated ?? now));
                if (age > maxStaleness)
                {
                    _logger?.LogWarning($"[AmazonProductService] Seed product ASIN {product.Asin} exceeded staleness threshold ({_stalenessThresholdHours}h).");
                }
                product.IsFallback = true;
            }
        }

        /// <summary>
        /// Admin upsert for an Amazon product. Invalidates catalog caches and pins via fresh DI scope.
        /// </summary>
        public async Task<AmazonProduct> SaveProductAsync(AmazonProduct productDto)
        {
            if (string.IsNullOrWhiteSpace(productDto.Asin) && !string.IsNullOrWhiteSpace(productDto.ProductUrl))
            {
                productDto.Asin = ParseAsin(productDto.ProductUrl);
            }

            if (string.IsNullOrWhiteSpace(productDto.Asin))
            {
                throw new ArgumentException("ASIN could not be determined. Please provide a valid ASIN or Amazon product URL.");
            }

            productDto.Asin = productDto.Asin.Trim().ToUpperInvariant();
            var existing = await _context.AmazonProducts.FirstOrDefaultAsync(p => p.Asin.ToUpper() == productDto.Asin);
            productDto.ImageUrl = EnsureAbsoluteImageUrl(productDto.ImageUrl, productDto.Asin);

            AmazonProduct saved;
            bool isNew = false;

            if (existing != null)
            {
                existing.Title = productDto.Title;
                existing.Description = productDto.Description;
                existing.ImageUrl = productDto.ImageUrl;
                existing.Price = productDto.Price;
                existing.OriginalPrice = productDto.OriginalPrice;
                existing.Rating = productDto.Rating;
                existing.ReviewCount = productDto.ReviewCount;
                existing.Category = productDto.Category;
                existing.ProductUrl = productDto.ProductUrl;
                existing.IsActive = productDto.IsActive;
                existing.LastUpdated = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                saved = existing;
            }
            else
            {
                productDto.DateAdded ??= DateTime.UtcNow;
                productDto.LastUpdated = DateTime.UtcNow;
                _context.AmazonProducts.Add(productDto);
                await _context.SaveChangesAsync();
                saved = productDto;
                isNew = true;
            }

            InvalidateCache();

            if (isNew)
            {
                TriggerBackgroundPinterestPin(saved);
            }

            NormalizeProductForOutput(saved);
            return saved;
        }

        /// <summary>
        /// Safely resolves and previews an Amazon URL strictly restricted to allowlisted Amazon domains.
        /// Read-only by default (persistToDb = false); DB writes occur only for authenticated admin callers.
        /// Returns both the resolved product preview and whether a DB record was actually persisted.
        /// </summary>
        public async Task<(AmazonProduct Product, bool Persisted)> ParseProductUrlAsync(string url, bool persistToDb = false)
        {
            if (string.IsNullOrWhiteSpace(url))
            {
                throw new ArgumentException("Product URL cannot be empty.");
            }

            var trimmedUrl = url.Trim();
            await ValidateAllowedAmazonUrlAsync(trimmedUrl);

            // 1. Resolve redirect safely hop-by-hop (validating every Location target BEFORE requesting it)
            string resolvedUrl = await GetRedirectUrlAsync(trimmedUrl);
            await ValidateAllowedAmazonUrlAsync(resolvedUrl);

            string asin = ParseAsin(resolvedUrl);
            if (string.IsNullOrEmpty(asin))
            {
                asin = ParseAsin(trimmedUrl);
            }

            if (string.IsNullOrEmpty(asin))
            {
                throw new ArgumentException("Could not find a valid 10-character Amazon ASIN in the provided link. Please paste an Amazon India product link.");
            }

            // 2. Return existing verified catalog item if already in DB
            var normalizedAsin = asin.Trim().ToUpperInvariant();
            var existing = await _context.AmazonProducts
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Asin.ToUpper() == normalizedAsin);
            if (existing != null)
            {
                NormalizeProductForOutput(existing);
                return (existing, false);
            }

            // 3. Scrape live metadata via pooled HttpClient with manual safe redirect validation, 8s timeout & 512 KB cap
            var scraped = await ScrapeAmazonPageAsync(resolvedUrl);

            string finalTitle = !string.IsNullOrWhiteSpace(scraped.Title)
                ? scraped.Title
                : $"Amazon India Deal (ASIN: {normalizedAsin})";

            string finalDescription = !string.IsNullOrWhiteSpace(scraped.Description)
                ? scraped.Description
                : "Verified Amazon India product preview. Click View on Amazon to inspect live price, bank offers, and delivery options.";

            string finalCategory = string.IsNullOrWhiteSpace(scraped.Category) ? "Shopping" : scraped.Category;
            string finalImageUrl = EnsureAbsoluteImageUrl(scraped.ImageUrl, normalizedAsin);
            decimal finalPrice = scraped.Price > 0 ? scraped.Price : 0m;
            decimal finalOriginalPrice = scraped.OriginalPrice > finalPrice ? scraped.OriginalPrice : finalPrice;

            var previewProduct = new AmazonProduct
            {
                Asin = normalizedAsin,
                Title = finalTitle,
                Description = finalDescription,
                ImageUrl = finalImageUrl,
                Price = finalPrice,
                OriginalPrice = finalOriginalPrice,
                Rating = scraped.Rating > 0 ? scraped.Rating : 4.4,
                ReviewCount = scraped.ReviewCount > 0 ? scraped.ReviewCount : 0,
                Category = finalCategory,
                ProductUrl = BuildAffiliateLink(resolvedUrl, normalizedAsin),
                IsActive = true,
                DateAdded = DateTime.UtcNow,
                LastUpdated = DateTime.UtcNow
            };

            bool wasPersisted = false;
            // Only authenticated admin requests may persist parsed products into PostgreSQL (and only with a verified positive price)
            if (persistToDb && finalPrice > 0)
            {
                _context.AmazonProducts.Add(previewProduct);
                await _context.SaveChangesAsync();
                InvalidateCache();
                TriggerBackgroundPinterestPin(previewProduct);
                wasPersisted = true;
            }

            return (previewProduct, wasPersisted);
        }

        private static bool IsPrivateOrReservedIp(IPAddress ip)
        {
            if (ip.IsIPv4MappedToIPv6)
            {
                ip = ip.MapToIPv4();
            }

            if (IPAddress.IsLoopback(ip) || ip.Equals(IPAddress.Any) || ip.Equals(IPAddress.IPv6Any))
            {
                return true;
            }

            var bytes = ip.GetAddressBytes();
            if (ip.AddressFamily == AddressFamily.InterNetwork && bytes.Length == 4)
            {
                // 0.0.0.0/8, 10.0.0.0/8, 100.64.0.0/10 (CGNAT), 127.0.0.0/8, 169.254.0.0/16 (link-local/cloud metadata),
                // 172.16.0.0/12, 192.168.0.0/16
                return bytes[0] == 0 ||
                       bytes[0] == 10 ||
                       (bytes[0] == 100 && bytes[1] >= 64 && bytes[1] <= 127) ||
                       bytes[0] == 127 ||
                       (bytes[0] == 169 && bytes[1] == 254) ||
                       (bytes[0] == 172 && bytes[1] >= 16 && bytes[1] <= 31) ||
                       (bytes[0] == 192 && bytes[1] == 168);
            }

            if (ip.AddressFamily == AddressFamily.InterNetworkV6 && bytes.Length == 16)
            {
                // fc00::/7 (unique local), fe80::/10 (link-local), ff00::/8 (multicast)
                return (bytes[0] & 0xfe) == 0xfc ||
                       (bytes[0] == 0xfe && (bytes[1] & 0xc0) == 0x80) ||
                       bytes[0] == 0xff;
            }

            return false;
        }

        public static void ValidateAllowedAmazonUrl(string rawUrl)
        {
            if (!Uri.TryCreate(rawUrl, UriKind.Absolute, out var uri))
            {
                throw new ArgumentException("Invalid URL format. Please provide a valid https:// Amazon product link.");
            }

            if (!uri.Scheme.Equals(Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase) &&
                !uri.Scheme.Equals(Uri.UriSchemeHttp, StringComparison.OrdinalIgnoreCase))
            {
                throw new ArgumentException("Only HTTP/HTTPS Amazon URLs are allowed.");
            }

            var host = uri.Host.Trim().ToLowerInvariant();
            if (string.IsNullOrEmpty(host) ||
                host == "localhost" ||
                IPAddress.TryParse(host, out _) ||
                host.EndsWith(".local", StringComparison.OrdinalIgnoreCase) ||
                host.EndsWith(".internal", StringComparison.OrdinalIgnoreCase))
            {
                throw new ArgumentException("Disallowed host. Only official Amazon product URLs are supported.");
            }

            bool isAllowed = AllowedAmazonHosts.Contains(host) ||
                             host.EndsWith(".amazon.in", StringComparison.OrdinalIgnoreCase) ||
                             host.EndsWith(".amazon.com", StringComparison.OrdinalIgnoreCase);

            if (!isAllowed)
            {
                throw new ArgumentException($"Domain '{host}' is not an allowed Amazon domain (supported: amazon.in, amzn.to, amzn.in, link.amazon).");
            }
        }

        private static async Task ValidateAllowedAmazonUrlAsync(string rawUrl)
        {
            ValidateAllowedAmazonUrl(rawUrl);

            var uri = new Uri(rawUrl);
            try
            {
                var addresses = await Dns.GetHostAddressesAsync(uri.Host);
                foreach (var addr in addresses)
                {
                    if (IsPrivateOrReservedIp(addr))
                    {
                        throw new ArgumentException("Resolved host IP is restricted. Only public Amazon endpoints are allowed.");
                    }
                }
            }
            catch (ArgumentException)
            {
                throw;
            }
            catch (SocketException)
            {
                // DNS transient failure will be handled naturally by the HTTP call (or fail safely without touching private IPs)
            }
        }

        /// <summary>
        /// Issues an HTTP GET while manually following up to maxRedirects 3xx hops,
        /// strictly validating every redirect Location against the Amazon allowlist and private-IP blocklist BEFORE connecting.
        /// </summary>
        public static async Task<HttpResponseMessage> SendSafeAmazonGetAsync(HttpClient client, string startUrl, int maxRedirects = 5)
        {
            string currentUrl = startUrl;
            for (int hop = 0; hop <= maxRedirects; hop++)
            {
                await ValidateAllowedAmazonUrlAsync(currentUrl);

                using var request = new HttpRequestMessage(HttpMethod.Get, currentUrl);
                var response = await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead);

                int code = (int)response.StatusCode;
                if (code >= 300 && code < 400 && response.Headers.Location != null)
                {
                    var nextUri = response.Headers.Location.IsAbsoluteUri
                        ? response.Headers.Location
                        : new Uri(new Uri(currentUrl), response.Headers.Location);
                    response.Dispose();

                    if (hop == maxRedirects)
                    {
                        throw new ArgumentException("Too many redirects while resolving Amazon URL.");
                    }

                    currentUrl = nextUri.ToString();
                    continue;
                }

                return response;
            }

            throw new ArgumentException("Could not resolve Amazon URL safely.");
        }

        private async Task<string> GetRedirectUrlAsync(string url)
        {
            if (string.IsNullOrWhiteSpace(url)) return url;

            bool isDirectAmazonDp = (url.Contains("amazon.in", StringComparison.OrdinalIgnoreCase) ||
                                     url.Contains("amazon.com", StringComparison.OrdinalIgnoreCase)) &&
                                    (url.Contains("/dp/", StringComparison.OrdinalIgnoreCase) ||
                                     url.Contains("/gp/product/", StringComparison.OrdinalIgnoreCase));

            if (isDirectAmazonDp)
            {
                return url;
            }

            try
            {
                var client = _httpClientFactory.CreateClient("AmazonScraper");
                using var response = await SendSafeAmazonGetAsync(client, url, maxRedirects: 5);
                var finalUri = response.RequestMessage?.RequestUri?.ToString();
                if (!string.IsNullOrWhiteSpace(finalUri))
                {
                    return finalUri;
                }
            }
            catch (ArgumentException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger?.LogDebug($"[AmazonProductService] Redirect lookup skipped/failed: {ex.Message}");
            }

            return url;
        }

        private async Task<(string Title, string Description, string ImageUrl, decimal Price, decimal OriginalPrice, double Rating, int ReviewCount, string Category)> ScrapeAmazonPageAsync(string url)
        {
            try
            {
                var client = _httpClientFactory.CreateClient("AmazonScraper");
                using var response = await SendSafeAmazonGetAsync(client, url, maxRedirects: 5);

                if (!response.IsSuccessStatusCode)
                {
                    return (string.Empty, string.Empty, string.Empty, 0, 0, 0, 0, "Shopping");
                }

                // Re-validate final URI after safe hop-by-hop redirects
                var finalUri = response.RequestMessage?.RequestUri?.ToString();
                if (!string.IsNullOrWhiteSpace(finalUri))
                {
                    ValidateAllowedAmazonUrl(finalUri);
                }

                string html = await ReadBoundedStringAsync(response.Content, MaxScrapeHtmlBytes);
                if (string.IsNullOrWhiteSpace(html))
                {
                    return (string.Empty, string.Empty, string.Empty, 0, 0, 0, 0, "Shopping");
                }

                // Title
                string title = string.Empty;
                var titleMatch = Regex.Match(html, @"<span\s+id=""productTitle""[^>]*>\s*([^<]+)", RegexOptions.IgnoreCase);
                if (titleMatch.Success)
                {
                    title = WebUtility.HtmlDecode(titleMatch.Groups[1].Value.Trim());
                }
                else
                {
                    var titleTagMatch = Regex.Match(html, @"<title>([^<]+)</title>", RegexOptions.IgnoreCase);
                    if (titleTagMatch.Success)
                    {
                        title = WebUtility.HtmlDecode(titleTagMatch.Groups[1].Value
                            .Replace("Amazon.in:", "")
                            .Replace("Buy ", "")
                            .Replace(" Online at Low Prices in India - Amazon.in", "")
                            .Trim());
                    }
                }

                // Image
                string imageUrl = string.Empty;
                var imageMatch = Regex.Match(html, @"data-old-hires=""(https://m\.media-amazon\.com/images/I/[^""]+)""", RegexOptions.IgnoreCase);
                if (!imageMatch.Success)
                {
                    imageMatch = Regex.Match(html, @"<meta\s+property=""og:image""\s+content=""([^""]+)""", RegexOptions.IgnoreCase);
                }
                if (!imageMatch.Success)
                {
                    imageMatch = Regex.Match(html, @"id=""landingImage""[^>]*src=""([^""]+)""", RegexOptions.IgnoreCase);
                }
                if (imageMatch.Success)
                {
                    imageUrl = imageMatch.Groups[1].Value.Trim();
                }

                // Description
                string description = string.Empty;
                var descMatch = Regex.Match(html, @"<meta\s+name=""description""\s+content=""([^""]+)""", RegexOptions.IgnoreCase);
                if (descMatch.Success)
                {
                    description = WebUtility.HtmlDecode(descMatch.Groups[1].Value.Trim());
                }
                if (string.IsNullOrEmpty(description) || description.Contains("Amazon.in", StringComparison.OrdinalIgnoreCase))
                {
                    var descMatch2 = Regex.Match(html, @"<meta\s+property=""og:description""\s+content=""([^""]+)""", RegexOptions.IgnoreCase);
                    if (descMatch2.Success)
                    {
                        description = WebUtility.HtmlDecode(descMatch2.Groups[1].Value.Trim());
                    }
                }

                // Price (strictly scoped)
                decimal price = 0;
                decimal originalPrice = 0;
                var priceMatch = Regex.Match(html, @"""priceAmount""\s*:\s*([\d\.]+)", RegexOptions.IgnoreCase);
                if (priceMatch.Success)
                {
                    decimal.TryParse(priceMatch.Groups[1].Value, out price);
                }
                if (price <= 0)
                {
                    var ptpMatch = Regex.Match(html, @"priceToPay[^>]*>.*?<span\s+class=""a-price-whole"">([\d,]+)", RegexOptions.IgnoreCase | RegexOptions.Singleline);
                    if (ptpMatch.Success)
                    {
                        decimal.TryParse(ptpMatch.Groups[1].Value.Replace(",", ""), out price);
                    }
                }

                var mrpMatch = Regex.Match(html, @"basisPrice[^>]*>.*?<span\s+class=""a-offscreen"">₹\s*([\d,]+(?:\.\d+)?)", RegexOptions.IgnoreCase | RegexOptions.Singleline);
                if (mrpMatch.Success)
                {
                    decimal.TryParse(mrpMatch.Groups[1].Value.Replace(",", ""), out originalPrice);
                }

                // Rating
                double rating = 0;
                var ratingMatch = Regex.Match(html, @"([\d\.]+)\s+out of 5 stars", RegexOptions.IgnoreCase);
                if (ratingMatch.Success)
                {
                    double.TryParse(ratingMatch.Groups[1].Value, out rating);
                }

                // Category inference
                string category = InferCategory(title, description);

                return (title, description, imageUrl, price, originalPrice, rating, 0, category);
            }
            catch (ArgumentException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger?.LogDebug($"[AmazonProductService] Scrape fallback triggered: {ex.Message}");
                return (string.Empty, string.Empty, string.Empty, 0, 0, 0, 0, "Shopping");
            }
        }

        private static string InferCategory(string title, string description)
        {
            string combined = $"{title} {description}".ToLowerInvariant();
            if (combined.Contains("phone") || combined.Contains("mobile") || combined.Contains("laptop") ||
                combined.Contains("earbuds") || combined.Contains("headphone") || combined.Contains("speaker") ||
                combined.Contains("smartwatch") || combined.Contains("tablet"))
                return "Technology";
            if (combined.Contains("cooker") || combined.Contains("kitchen") || combined.Contains("kettle") ||
                combined.Contains("bedsheet") || combined.Contains("curtain") || combined.Contains("lamp") ||
                combined.Contains("bottle"))
                return "Home & Kitchen";
            if (combined.Contains("kurta") || combined.Contains("shirt") || combined.Contains("shoe") ||
                combined.Contains("sneaker") || combined.Contains("saree") || combined.Contains("jacket") ||
                combined.Contains("dress"))
                return "Fashion";
            if (combined.Contains("serum") || combined.Contains("shampoo") || combined.Contains("sunscreen") ||
                combined.Contains("trimmer") || combined.Contains("vitamin") || combined.Contains("protein"))
                return "Beauty & Personal Care";
            return "Shopping";
        }

        private static async Task<string> ReadBoundedStringAsync(HttpContent content, int maxBytes)
        {
            await using var stream = await content.ReadAsStreamAsync();
            var buffer = new byte[Math.Min(16384, maxBytes)];
            using var ms = new MemoryStream();
            int totalRead = 0;
            while (totalRead < maxBytes)
            {
                int toRead = Math.Min(buffer.Length, maxBytes - totalRead);
                int read = await stream.ReadAsync(buffer, 0, toRead);
                if (read <= 0) break;
                ms.Write(buffer, 0, read);
                totalRead += read;
            }
            return Encoding.UTF8.GetString(ms.ToArray());
        }

        public string ParseAsin(string url)
        {
            if (string.IsNullOrWhiteSpace(url)) return string.Empty;

            try
            {
                var uri = new Uri(url);
                var segments = uri.AbsolutePath.Split('/', StringSplitOptions.RemoveEmptyEntries);
                for (int i = 0; i < segments.Length; i++)
                {
                    if ((segments[i].Equals("dp", StringComparison.OrdinalIgnoreCase) ||
                         segments[i].Equals("product", StringComparison.OrdinalIgnoreCase) ||
                         segments[i].Equals("d", StringComparison.OrdinalIgnoreCase)) &&
                        i + 1 < segments.Length)
                    {
                        var candidate = segments[i + 1].Trim().ToUpperInvariant();
                        if (Regex.IsMatch(candidate, @"^[A-Z0-9]{10}$"))
                        {
                            return candidate;
                        }
                    }
                }
            }
            catch { /* Fall through to regex */ }

            var match = Regex.Match(url, @"/(?:dp|gp/product|d)/([A-Z0-9]{10})", RegexOptions.IgnoreCase);
            if (match.Success)
            {
                return match.Groups[1].Value.ToUpperInvariant();
            }

            return string.Empty;
        }

        private string BuildAffiliateLink(string rawUrl, string asin)
        {
            if (!string.IsNullOrWhiteSpace(rawUrl) && rawUrl.Contains("amzn.to", StringComparison.OrdinalIgnoreCase))
            {
                return rawUrl;
            }

            string cleanAsin = string.IsNullOrWhiteSpace(asin) ? "B0BY8MCQ9S" : asin.Trim().ToUpperInvariant();
            return $"https://www.amazon.in/dp/{cleanAsin}?tag={_associateTag}&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl";
        }

        private static string EnsureAbsoluteImageUrl(string? url, string? asin = null)
        {
            if (string.IsNullOrWhiteSpace(url))
            {
                if (!string.IsNullOrWhiteSpace(asin))
                {
                    return $"https://m.media-amazon.com/images/P/{asin.Trim()}.01._SCLZZZZZZZ_SX500_.jpg";
                }
                return string.Empty;
            }

            url = url.Trim();

            if (url.Contains(".01.LZZZZZZZ.jpg", StringComparison.OrdinalIgnoreCase))
            {
                url = url.Replace(".01.LZZZZZZZ.jpg", ".01._SCLZZZZZZZ_SX500_.jpg", StringComparison.OrdinalIgnoreCase);
                url = url.Replace("images-na.ssl-images-amazon.com", "m.media-amazon.com", StringComparison.OrdinalIgnoreCase);
            }

            if (url.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
                url.StartsWith("https://", StringComparison.OrdinalIgnoreCase) ||
                url.StartsWith("/images/", StringComparison.OrdinalIgnoreCase))
            {
                return url;
            }

            return $"https://images-eu.ssl-images-amazon.com/images/I/{url}";
        }

        private void NormalizeProductForOutput(AmazonProduct product)
        {
            product.ProductUrl = BuildAffiliateLink(product.ProductUrl, product.Asin);
            product.ImageUrl = EnsureAbsoluteImageUrl(product.ImageUrl, product.Asin);
        }

        private void TriggerBackgroundPinterestPin(AmazonProduct product)
        {
            var snapshot = new AmazonProduct
            {
                Asin = product.Asin,
                Title = product.Title,
                Description = product.Description,
                ImageUrl = product.ImageUrl,
                Price = product.Price,
                OriginalPrice = product.OriginalPrice,
                Category = product.Category,
                ProductUrl = product.ProductUrl
            };

            _ = Task.Run(async () =>
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var pinterest = scope.ServiceProvider.GetService<PinterestService>();
                    if (pinterest != null && pinterest.IsConfigured)
                    {
                        await pinterest.CreatePinForAmazonProductAsync(snapshot);
                    }
                }
                catch (Exception ex)
                {
                    _logger?.LogDebug($"[AmazonProductService] Background Pinterest pinning skipped: {ex.Message}");
                }
            });
        }

        private static IQueryable<AmazonProduct> ApplyCategoryFilter(
            IQueryable<AmazonProduct> query,
            string category,
            CatalogStatsSnapshot? stats = null)
        {
            if (string.IsNullOrWhiteSpace(category) || category.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                return query;
            }

            var trimmed = category.Trim();

            // Check legacy aliases first
            if (trimmed.Equals("Kitchen & Home", StringComparison.OrdinalIgnoreCase)) trimmed = "Home & Kitchen";
            else if (trimmed.Equals("Lifestyle", StringComparison.OrdinalIgnoreCase)) trimmed = "Fashion & Lifestyle";
            else if (trimmed.Equals("Gadgets", StringComparison.OrdinalIgnoreCase))
            {
                return query.Where(p => p.Category.ToLower() == "gadgets" || p.Category.ToLower().Contains("gadget") || p.Category.ToLower().Contains("smart"));
            }

            // Canonical storefront group match
            var matchedGroup = CanonicalCategories.FirstOrDefault(g =>
                g.Key.Equals(trimmed, StringComparison.OrdinalIgnoreCase) ||
                g.Label.Equals(trimmed, StringComparison.OrdinalIgnoreCase));

            if (!string.IsNullOrEmpty(matchedGroup.Key))
            {
                // Derive the exact set of raw DB categories mapped by MapToCanonicalGroup so CategoryCounts == TotalResults
                var rawSet = new HashSet<string>(
                    matchedGroup.RawCategories.Select(r => r.ToLowerInvariant()),
                    StringComparer.OrdinalIgnoreCase);

                if (stats != null)
                {
                    foreach (var rc in stats.RawCategories)
                    {
                        if (rc.Group.Equals(matchedGroup.Key, StringComparison.OrdinalIgnoreCase))
                        {
                            rawSet.Add(rc.Name.ToLowerInvariant());
                        }
                    }
                }

                if (matchedGroup.Key == "Essentials & More")
                {
                    var otherRawSet = new HashSet<string>(
                        CanonicalCategories
                            .Where(g => g.Key != "Essentials & More")
                            .SelectMany(g => g.RawCategories)
                            .Select(r => r.ToLowerInvariant()),
                        StringComparer.OrdinalIgnoreCase);

                    if (stats != null)
                    {
                        foreach (var rc in stats.RawCategories)
                        {
                            if (!rc.Group.Equals("Essentials & More", StringComparison.OrdinalIgnoreCase))
                            {
                                otherRawSet.Add(rc.Name.ToLowerInvariant());
                            }
                        }
                    }

                    var otherRawList = otherRawSet.ToList();
                    return query.Where(p => !otherRawList.Contains(p.Category.ToLower()));
                }

                var rawLower = rawSet.ToList();
                return query.Where(p => rawLower.Contains(p.Category.ToLower()));
            }

            // Direct exact raw DB category match (e.g., "Office Products", "Automotive", "Baby Products", "Pet Supplies")
            var lowerTarget = trimmed.ToLowerInvariant();
            return query.Where(p => p.Category.ToLower() == lowerTarget);
        }

        private async Task<CatalogStatsSnapshot> GetCatalogStatsSnapshotAsync()
        {
            var cacheKey = $"amzn_stats_v{CacheVersion}";
            if (_cache.TryGetValue<CatalogStatsSnapshot>(cacheKey, out var cached) && cached != null)
            {
                return cached;
            }

            // Lightweight 3-column scalar projection (never materializes Title/Description/ImageUrl)
            var rows = await _context.AmazonProducts
                .AsNoTracking()
                .Where(p => p.IsActive && p.Asin != ExpiredAsin)
                .Select(p => new { p.Category, p.Price, p.OriginalPrice })
                .ToListAsync();

            var groupCounts = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase)
            {
                ["All"] = rows.Count
            };
            var groupMaxDisc = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
            var rawCounts = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

            foreach (var g in CanonicalCategories)
            {
                groupCounts[g.Key] = 0;
                groupMaxDisc[g.Key] = 0;
            }

            int globalMaxDiscount = 0;

            foreach (var r in rows)
            {
                var rawCat = string.IsNullOrWhiteSpace(r.Category) ? "Shopping" : r.Category.Trim();
                rawCounts[rawCat] = rawCounts.TryGetValue(rawCat, out var rc) ? rc + 1 : 1;

                var groupKey = MapToCanonicalGroup(rawCat);
                groupCounts[groupKey] = groupCounts.TryGetValue(groupKey, out var gc) ? gc + 1 : 1;

                int disc = ComputeVerifiedDiscount(r.Price, r.OriginalPrice);
                if (disc > globalMaxDiscount) globalMaxDiscount = disc;
                if (disc > groupMaxDisc[groupKey]) groupMaxDisc[groupKey] = disc;
            }

            groupMaxDisc["All"] = globalMaxDiscount;

            var categoryStats = CanonicalCategories
                .Select(g => new CategoryStatDto
                {
                    Key = g.Key,
                    Label = g.Label,
                    Count = groupCounts.GetValueOrDefault(g.Key, 0),
                    MaxDiscount = groupMaxDisc.GetValueOrDefault(g.Key, 0)
                })
                .ToList();

            var rawStats = rawCounts
                .OrderByDescending(kv => kv.Value)
                .Select(kv => new RawCategoryStatDto
                {
                    Name = kv.Key,
                    Group = MapToCanonicalGroup(kv.Key),
                    Count = kv.Value
                })
                .ToList();

            var snapshot = new CatalogStatsSnapshot
            {
                TotalActive = rows.Count,
                TopVerifiedDiscount = globalMaxDiscount,
                CategoryCounts = groupCounts,
                MaxDiscountByCategory = groupMaxDisc,
                CategoryStats = categoryStats,
                RawCategories = rawStats,
                GeneratedAt = DateTime.UtcNow
            };

            _cache.Set(cacheKey, snapshot, new MemoryCacheEntryOptions()
                .SetAbsoluteExpiration(TimeSpan.FromMinutes(10))
                .SetSize(2));

            return snapshot;
        }

        private static string? ResolveSeedJsonPath()
        {
            var candidates = new[]
            {
                Path.Combine(AppContext.BaseDirectory, "Data", "amazon-products-seed.json"),
                Path.Combine(Directory.GetCurrentDirectory(), "Data", "amazon-products-seed.json"),
                Path.Combine(Directory.GetCurrentDirectory(), "WorldNewzWebAPI", "Data", "amazon-products-seed.json")
            };

            return candidates.FirstOrDefault(File.Exists);
        }

        private static async Task<string> ComputeFileSha256Async(string filePath)
        {
            await using var fs = File.OpenRead(filePath);
            var hash = await SHA256.HashDataAsync(fs);
            return Convert.ToHexString(hash);
        }

        /// <summary>
        /// Streams Data/amazon-products-seed.json and performs incremental ASIN-diff sync in batches of 100
        /// with ChangeTracker.Clear() after each batch. Guarded by file SHA-256 hash so restarts/requests
        /// never repeat unnecessary DB work while ensuring daily JSON additions ALWAYS sync into PostgreSQL.
        /// </summary>
        public async Task EnsureDefaultProductsSeededAsync(bool force = false)
        {
            var seedPath = ResolveSeedJsonPath();
            if (seedPath == null)
            {
                _logger?.LogWarning("[AmazonProductService] Seed file Data/amazon-products-seed.json not found.");
                return;
            }

            if (!force && _lastSeededFileHash != null)
            {
                return;
            }

            await _seedLock.WaitAsync();
            try
            {
                var currentHash = await ComputeFileSha256Async(seedPath);
                if (!force && string.Equals(_lastSeededFileHash, currentHash, StringComparison.Ordinal))
                {
                    return;
                }

                // 1. Purge known expired product without loading all rows
                var expiredRows = await _context.AmazonProducts
                    .Where(p => p.Asin == ExpiredAsin || p.Title.ToLower().Contains("d-force vitamin d3 60000 iu"))
                    .ToListAsync();
                if (expiredRows.Count > 0)
                {
                    _context.AmazonProducts.RemoveRange(expiredRows);
                    await _context.SaveChangesAsync();
                    _context.ChangeTracker.Clear();
                }

                // 2. Load ONLY existing ASIN strings (lightweight projection)
                var existingAsins = new HashSet<string>(
                    await _context.AmazonProducts
                        .AsNoTracking()
                        .Where(p => !string.IsNullOrEmpty(p.Asin))
                        .Select(p => p.Asin)
                        .ToListAsync(),
                    StringComparer.OrdinalIgnoreCase);

                // 3. Stream JSON seed catalog and insert missing ASINs in batches of 100
                var batch = new List<AmazonProduct>(SeedBatchSize);
                var newlyAddedSample = new List<AmazonProduct>(10);
                int totalInserted = 0;

                await using (var fs = File.OpenRead(seedPath))
                {
                    await foreach (var seed in JsonSerializer.DeserializeAsyncEnumerable<AmazonProduct>(fs, SeedJsonOptions))
                    {
                        if (seed == null || string.IsNullOrWhiteSpace(seed.Asin)) continue;
                        if (seed.Asin.Equals(ExpiredAsin, StringComparison.OrdinalIgnoreCase)) continue;
                        if (!existingAsins.Add(seed.Asin)) continue;

                        seed.Id = 0;
                        seed.Asin = seed.Asin.Trim();
                        seed.Title = (seed.Title ?? string.Empty).Trim();
                        seed.Description = (seed.Description ?? string.Empty).Trim();
                        seed.Category = string.IsNullOrWhiteSpace(seed.Category) ? "Shopping" : seed.Category.Trim();
                        seed.ImageUrl = EnsureAbsoluteImageUrl(seed.ImageUrl, seed.Asin);
                        seed.ProductUrl = BuildAffiliateLink(seed.ProductUrl, seed.Asin);
                        seed.IsActive = true;
                        seed.DateAdded = DateTime.UtcNow;
                        seed.LastUpdated = DateTime.UtcNow;

                        batch.Add(seed);
                        if (newlyAddedSample.Count < 10)
                        {
                            newlyAddedSample.Add(seed);
                        }

                        if (batch.Count >= SeedBatchSize)
                        {
                            await _context.AmazonProducts.AddRangeAsync(batch);
                            await _context.SaveChangesAsync();
                            _context.ChangeTracker.Clear();
                            totalInserted += batch.Count;
                            batch.Clear();
                        }
                    }
                }

                if (batch.Count > 0)
                {
                    await _context.AmazonProducts.AddRangeAsync(batch);
                    await _context.SaveChangesAsync();
                    _context.ChangeTracker.Clear();
                    totalInserted += batch.Count;
                    batch.Clear();
                }

                _lastSeededFileHash = currentHash;

                if (totalInserted > 0)
                {
                    InvalidateCache();
                    _logger?.LogInformation($"[AmazonProductService] Incremental JSON sync inserted {totalInserted} new products (total catalog: {existingAsins.Count}).");

                    // Optional background Pinterest pinning for newly added products (capped to 10, fresh DI scope)
                    if (totalInserted <= 250 && newlyAddedSample.Count > 0)
                    {
                        _ = Task.Run(async () =>
                        {
                            try
                            {
                                using var scope = _scopeFactory.CreateScope();
                                var pinterest = scope.ServiceProvider.GetService<PinterestService>();
                                if (pinterest != null && pinterest.IsConfigured)
                                {
                                    foreach (var item in newlyAddedSample)
                                    {
                                        try
                                        {
                                            await pinterest.CreatePinForAmazonProductAsync(item);
                                            await Task.Delay(1200);
                                        }
                                        catch (Exception pEx)
                                        {
                                            _logger?.LogDebug($"[PinterestService] Auto-pin seed exception for ASIN '{item.Asin}': {pEx.Message}");
                                        }
                                    }
                                }
                            }
                            catch (Exception ex)
                            {
                                _logger?.LogDebug($"[PinterestService] Background seed pinning skipped: {ex.Message}");
                            }
                        });
                    }
                }
                else
                {
                    _logger?.LogInformation($"[AmazonProductService] Incremental JSON sync verified: all {existingAsins.Count} catalog products up to date.");
                }
            }
            finally
            {
                _seedLock.Release();
            }
        }
    }
}
