using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using WorldNewzWebAPI.Data;
using WorldNewzWebAPI.Models;

namespace WorldNewzWebAPI.Services
{
    /// <summary>
    /// ExpiredProcess - Automated verification and purge service for expired or non-functioning Amazon products.
    /// Processes products in memory-bounded paginated batches (50 rows at a time) using IHttpClientFactory
    /// and capped HTML reads to remain safe under Render.com's 512 MB RAM ceiling.
    /// </summary>
    public class ExpiredProcess
    {
        private readonly WorldNewsDbContext _context;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<ExpiredProcess>? _logger;
        private const int BatchSize = 50;
        private const int MaxHtmlBytes = 256 * 1024;

        private static readonly string[] ExpiredSignatures = new[]
        {
            "not a functioning page on our site",
            "We're sorry. The Web address you entered is not a functioning page",
            "Looking for something? We're sorry",
            "Page Not Found",
            "The page you are looking for doesn't exist",
            "Currently unavailable"
        };

        public ExpiredProcess(
            WorldNewsDbContext context,
            IHttpClientFactory httpClientFactory,
            ILogger<ExpiredProcess>? logger = null)
        {
            _context = context;
            _httpClientFactory = httpClientFactory;
            _logger = logger;
        }

        /// <summary>
        /// Scans Amazon products in paginated AsNoTracking batches and purges expired listings cleanly.
        /// </summary>
        public async Task<int> VerifyAndPurgeExpiredProductsAsync()
        {
            _logger?.LogInformation("[ExpiredProcess] Starting batched verification of Amazon products in database...");

            int totalPurged = 0;
            int lastId = 0;

            while (true)
            {
                var batch = await _context.AmazonProducts
                    .AsNoTracking()
                    .Where(p => p.Id > lastId)
                    .OrderBy(p => p.Id)
                    .Take(BatchSize)
                    .ToListAsync();

                if (batch.Count == 0)
                {
                    break;
                }

                lastId = batch[^1].Id;
                var expiredIds = new List<int>();

                foreach (var product in batch)
                {
                    bool isExpired = await CheckIfProductIsExpiredAsync(product);
                    if (isExpired)
                    {
                        _logger?.LogWarning($"[ExpiredProcess] Product '{product.Title}' (ASIN: {product.Asin}) is EXPIRED. Marking for deletion.");
                        expiredIds.Add(product.Id);
                    }
                }

                if (expiredIds.Count > 0)
                {
                    var toDelete = await _context.AmazonProducts
                        .Where(p => expiredIds.Contains(p.Id))
                        .ToListAsync();

                    if (toDelete.Count > 0)
                    {
                        _context.AmazonProducts.RemoveRange(toDelete);
                        await _context.SaveChangesAsync();
                        totalPurged += toDelete.Count;
                    }
                    _context.ChangeTracker.Clear();
                }
            }

            _logger?.LogInformation($"[ExpiredProcess] Completed verification. Purged {totalPurged} expired products.");
            return totalPurged;
        }

        /// <summary>
        /// Checks a single product URL or ASIN against Amazon web endpoints with a bounded response read.
        /// </summary>
        public async Task<bool> CheckIfProductIsExpiredAsync(AmazonProduct product)
        {
            if (string.IsNullOrWhiteSpace(product.Asin) && string.IsNullOrWhiteSpace(product.ProductUrl))
            {
                return true;
            }

            string testUrl = !string.IsNullOrWhiteSpace(product.Asin) && product.Asin.Length == 10
                ? $"https://www.amazon.in/dp/{product.Asin}"
                : product.ProductUrl;

            try
            {
                var client = _httpClientFactory.CreateClient("AmazonScraper");
                using var response = await AmazonProductService.SendSafeAmazonGetAsync(client, testUrl, maxRedirects: 5);

                if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    return true;
                }

                var html = await ReadBoundedStringAsync(response.Content, MaxHtmlBytes);
                if (string.IsNullOrWhiteSpace(html))
                {
                    return false;
                }

                foreach (var signature in ExpiredSignatures)
                {
                    if (html.IndexOf(signature, StringComparison.OrdinalIgnoreCase) >= 0)
                    {
                        return true;
                    }
                }

                return false;
            }
            catch (HttpRequestException ex)
            {
                _logger?.LogWarning($"[ExpiredProcess] HTTP error checking ASIN {product.Asin}: {ex.Message}");
                return false;
            }
            catch (Exception ex)
            {
                _logger?.LogError($"[ExpiredProcess] Unexpected error checking ASIN {product.Asin}: {ex.Message}");
                return false;
            }
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
    }
}
