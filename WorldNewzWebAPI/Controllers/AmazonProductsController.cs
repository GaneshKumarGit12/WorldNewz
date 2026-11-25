using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using WorldNewzWebAPI.Models;
using WorldNewzWebAPI.Services;

namespace WorldNewzWebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AmazonProductsController : ControllerBase
    {
        private readonly AmazonProductService _productService;
        private const string PublicCacheControl = "public, max-age=120, s-maxage=300, stale-while-revalidate=60";
        private const string NoStoreCacheControl = "no-cache, no-store, must-revalidate";

        public AmazonProductsController(AmazonProductService productService)
        {
            _productService = productService;
        }

        /// <summary>
        /// Supports paginated/filtered queries when any filter/pagination query parameter is passed,
        /// while preserving backward-compatible full-list response when called with no parameters.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetProducts(
            [FromQuery] int? page = null,
            [FromQuery] int? pageSize = null,
            [FromQuery] string? category = null,
            [FromQuery] string? search = null,
            [FromQuery] string? sort = null,
            [FromQuery] int? minDiscount = null,
            [FromQuery] decimal? maxPrice = null,
            [FromQuery] double? minRating = null,
            [FromQuery] string? excludeAsins = null)
        {
            try
            {
                await _productService.EnsureDefaultProductsSeededAsync(force: false);

                bool isPaginatedRequest = page.HasValue || pageSize.HasValue ||
                                          !string.IsNullOrWhiteSpace(category) ||
                                          !string.IsNullOrWhiteSpace(search) ||
                                          !string.IsNullOrWhiteSpace(sort) ||
                                          minDiscount.HasValue ||
                                          maxPrice.HasValue ||
                                          minRating.HasValue ||
                                          !string.IsNullOrWhiteSpace(excludeAsins);

                if (isPaginatedRequest)
                {
                    var etag = BuildWeakETag($"cat:{page}:{pageSize}:{category}:{search}:{sort}:{minDiscount}:{maxPrice}:{minRating}:{excludeAsins}");
                    Response.Headers.CacheControl = PublicCacheControl;
                    Response.Headers.ETag = etag;
                    if (IsETagMatch(etag))
                    {
                        return StatusCode(304);
                    }

                    var excluded = string.IsNullOrWhiteSpace(excludeAsins)
                        ? null
                        : excludeAsins.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList();

                    var result = await _productService.GetCatalogPageAsync(new AmazonCatalogQuery
                    {
                        Page = page ?? 1,
                        PageSize = pageSize ?? 24,
                        Category = category,
                        Search = search,
                        Sort = sort ?? "newest",
                        MinDiscount = minDiscount,
                        MaxPrice = maxPrice,
                        MinRating = minRating,
                        ExcludeAsins = excluded
                    });

                    return Ok(result);
                }

                // Legacy backward-compatible path for external callers (e.g. copylinkagent)
                var legacyEtag = BuildWeakETag("legacy-all");
                Response.Headers.CacheControl = PublicCacheControl;
                Response.Headers.ETag = legacyEtag;
                if (IsETagMatch(legacyEtag))
                {
                    return StatusCode(304);
                }

                var products = await _productService.GetAffiliateProductsAsync();
                return Ok(new
                {
                    status = "success",
                    totalResults = products.Count,
                    products = products
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Failed to retrieve products: {ex.Message}" });
            }
        }

        [HttpGet("highlights")]
        public async Task<IActionResult> GetHighlights()
        {
            try
            {
                await _productService.EnsureDefaultProductsSeededAsync(force: false);
                var istDay = DateTime.UtcNow.AddHours(5.5).ToString("yyyy-MM-dd");
                var etag = BuildWeakETag($"highlights:{istDay}");
                Response.Headers.CacheControl = PublicCacheControl;
                Response.Headers.ETag = etag;
                if (IsETagMatch(etag))
                {
                    return StatusCode(304);
                }

                var result = await _productService.GetHighlightsAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Failed to retrieve highlights: {ex.Message}" });
            }
        }

        [HttpGet("widgets")]
        public async Task<IActionResult> GetWidgetDeals(
            [FromQuery] string? category = null,
            [FromQuery] int limit = 8,
            [FromQuery] int? fourHourBlock = null)
        {
            try
            {
                await _productService.EnsureDefaultProductsSeededAsync(force: false);
                int block = fourHourBlock ?? (int)(DateTimeOffset.UtcNow.ToUnixTimeSeconds() / (4 * 3600));
                var etag = BuildWeakETag($"widgets:{category}:{limit}:{block}");
                Response.Headers.CacheControl = PublicCacheControl;
                Response.Headers.ETag = etag;
                if (IsETagMatch(etag))
                {
                    return StatusCode(304);
                }

                var result = await _productService.GetWidgetDealsAsync(category, limit, block);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Failed to retrieve widget deals: {ex.Message}" });
            }
        }

        [HttpGet("asins")]
        public async Task<IActionResult> GetActiveAsins()
        {
            try
            {
                await _productService.EnsureDefaultProductsSeededAsync(force: false);
                var etag = BuildWeakETag("asins");
                Response.Headers.CacheControl = PublicCacheControl;
                Response.Headers.ETag = etag;
                if (IsETagMatch(etag))
                {
                    return StatusCode(304);
                }

                var asins = await _productService.GetActiveAsinsAsync();
                return Ok(new
                {
                    status = "success",
                    totalResults = asins.Count,
                    asins
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Failed to retrieve ASINs: {ex.Message}" });
            }
        }

        [HttpGet("health")]
        public IActionResult GetHealth([FromServices] AmazonCreatorApiService? creatorApiService = null)
        {
            Response.Headers.CacheControl = NoStoreCacheControl;
            var isConfigured = creatorApiService?.IsConfigured ?? false;
            return Ok(new
            {
                status = "operational",
                creatorApiConfigured = isConfigured,
                mode = isConfigured ? "Live Amazon Creator API" : "PostgreSQL Seed Catalog (Resilient Fallback)",
                associateTag = Environment.GetEnvironmentVariable("AMAZON_ASSOCIATE_TAG") ?? "ganeshd12-21",
                timestamp = DateTime.UtcNow
            });
        }

        [HttpPost("admin")]
        public async Task<IActionResult> AddOrUpdateProduct([FromBody] AmazonProduct productDto)
        {
            Response.Headers.CacheControl = NoStoreCacheControl;
            if (!IsAuthorized())
            {
                return Unauthorized(new { error = "Invalid credentials or unauthorized request." });
            }

            if (productDto == null)
            {
                return BadRequest(new { error = "Invalid product data." });
            }

            try
            {
                var saved = await _productService.SaveProductAsync(productDto);
                return Ok(new { status = "success", product = saved });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("admin/refresh")]
        public async Task<IActionResult> ForceRefreshDeals()
        {
            Response.Headers.CacheControl = NoStoreCacheControl;
            if (!IsAuthorized())
            {
                return Unauthorized(new { error = "Invalid credentials or unauthorized request." });
            }

            try
            {
                await _productService.RefreshDailyDealsAsync();
                return Ok(new { status = "success", message = "Daily deals refreshed successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Failed to refresh deals: {ex.Message}" });
            }
        }

        [HttpPost("admin/purge-expired")]
        public async Task<IActionResult> PurgeExpiredProducts([FromServices] ExpiredProcess expiredProcess)
        {
            Response.Headers.CacheControl = NoStoreCacheControl;
            if (!IsAuthorized())
            {
                return Unauthorized(new { error = "Invalid credentials or unauthorized request." });
            }

            try
            {
                int purgedCount = await expiredProcess.VerifyAndPurgeExpiredProductsAsync();
                AmazonProductService.InvalidateCache();
                return Ok(new { status = "success", purgedCount = purgedCount, message = $"Purged {purgedCount} expired products from the database." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Failed to purge expired products: {ex.Message}" });
            }
        }

        /// <summary>
        /// Public callers get a read-only Amazon-domain-allowlisted deal preview and affiliate link converter.
        /// Authenticated admin requests can optionally persist the parsed product to PostgreSQL.
        /// </summary>
        [HttpGet("parse-url")]
        public async Task<IActionResult> ParseUrl([FromQuery] string url, [FromQuery] bool persist = false)
        {
            Response.Headers.CacheControl = NoStoreCacheControl;
            if (string.IsNullOrWhiteSpace(url))
            {
                return BadRequest(new { error = "Url parameter is required." });
            }

            try
            {
                bool allowPersist = persist && IsAuthorized();
                var (resolvedProduct, wasPersisted) = await _productService.ParseProductUrlAsync(url, persistToDb: allowPersist);
                return Ok(new
                {
                    status = "success",
                    persisted = wasPersisted,
                    product = resolvedProduct
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = $"Could not preview Amazon URL: {ex.Message}" });
            }
        }

        private string BuildWeakETag(string key)
        {
            var raw = $"v{_productService.CacheVersion}:{key}";
            var hash = SHA256.HashData(Encoding.UTF8.GetBytes(raw));
            return $"W/\"{Convert.ToHexString(hash, 0, 8)}\"";
        }

        private bool IsETagMatch(string etag)
        {
            if (Request.Headers.TryGetValue("If-None-Match", out var headerValues))
            {
                foreach (var val in headerValues)
                {
                    if (string.IsNullOrWhiteSpace(val)) continue;
                    foreach (var candidate in val.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
                    {
                        if (candidate == "*" || string.Equals(candidate, etag, StringComparison.Ordinal))
                        {
                            return true;
                        }
                    }
                }
            }
            return false;
        }

        /// <summary>
        /// Basic Auth helper that fails closed when ADMIN_USERNAME or ADMIN_PASSWORD environment variables are unset.
        /// Uses constant-time comparison to prevent timing side channels.
        /// </summary>
        private bool IsAuthorized()
        {
            var adminUser = Environment.GetEnvironmentVariable("ADMIN_USERNAME");
            var adminPass = Environment.GetEnvironmentVariable("ADMIN_PASSWORD");
            if (string.IsNullOrWhiteSpace(adminUser) || string.IsNullOrWhiteSpace(adminPass))
            {
                return false;
            }

            var authHeader = Request.Headers["Authorization"].ToString();
            if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Basic ", StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }

            try
            {
                var base64Credentials = authHeader.Substring(6).Trim();
                var decoded = Encoding.UTF8.GetString(Convert.FromBase64String(base64Credentials));
                var sepIdx = decoded.IndexOf(':');
                if (sepIdx <= 0) return false;

                var providedUser = decoded.Substring(0, sepIdx);
                var providedPass = decoded.Substring(sepIdx + 1);

                var userBytes = Encoding.UTF8.GetBytes(providedUser);
                var expectedUserBytes = Encoding.UTF8.GetBytes(adminUser);
                var passBytes = Encoding.UTF8.GetBytes(providedPass);
                var expectedPassBytes = Encoding.UTF8.GetBytes(adminPass);

                bool userMatch = userBytes.Length == expectedUserBytes.Length &&
                                 CryptographicOperations.FixedTimeEquals(userBytes, expectedUserBytes);
                bool passMatch = passBytes.Length == expectedPassBytes.Length &&
                                 CryptographicOperations.FixedTimeEquals(passBytes, expectedPassBytes);

                return userMatch && passMatch;
            }
            catch
            {
                return false;
            }
        }
    }
}
