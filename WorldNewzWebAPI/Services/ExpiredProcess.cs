using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using WorldNewzWebAPI.Data;
using WorldNewzWebAPI.Models;

namespace WorldNewzWebAPI.Services
{
    /// <summary>
    /// ExpiredProcess - Automated verification and purge service for expired or non-functioning Amazon products.
    /// Detects 'not a functioning page on our site' 404/dog pages and immediately removes them from the database
    /// so they are never displayed on the website application.
    /// </summary>
    public class ExpiredProcess
    {
        private readonly WorldNewsDbContext _context;
        private readonly ILogger<ExpiredProcess>? _logger;
        private static readonly HttpClient _httpClient = new HttpClient(new HttpClientHandler
        {
            AllowAutoRedirect = true,
            AutomaticDecompression = System.Net.DecompressionMethods.GZip | System.Net.DecompressionMethods.Deflate
        })
        {
            Timeout = TimeSpan.FromSeconds(15)
        };

        private static readonly string[] ExpiredSignatures = new[]
        {
            "not a functioning page on our site",
            "We're sorry. The Web address you entered is not a functioning page",
            "Looking for something? We're sorry",
            "Page Not Found",
            "The page you are looking for doesn't exist",
            "Currently unavailable"
        };

        static ExpiredProcess()
        {
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");
            _httpClient.DefaultRequestHeaders.Add("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8");
            _httpClient.DefaultRequestHeaders.Add("Accept-Language", "en-US,en;q=0.9");
        }

        public ExpiredProcess(WorldNewsDbContext context, ILogger<ExpiredProcess>? logger = null)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Scans all Amazon products in the database table and purges any expired or non-functioning listings.
        /// </summary>
        public async Task<int> VerifyAndPurgeExpiredProductsAsync()
        {
            _logger?.LogInformation("[ExpiredProcess] Starting verification of Amazon products in database...");

            var products = await _context.AmazonProducts.ToListAsync();
            if (products.Count == 0)
            {
                _logger?.LogInformation("[ExpiredProcess] No products found in database.");
                return 0;
            }

            var expiredProducts = new List<AmazonProduct>();

            foreach (var product in products)
            {
                bool isExpired = await CheckIfProductIsExpiredAsync(product);
                if (isExpired)
                {
                    _logger?.LogWarning($"[ExpiredProcess] Product '{product.Title}' (ASIN: {product.Asin}) is EXPIRED. Marking for deletion.");
                    expiredProducts.Add(product);
                }
            }

            if (expiredProducts.Count > 0)
            {
                _context.AmazonProducts.RemoveRange(expiredProducts);
                await _context.SaveChangesAsync();
                _logger?.LogInformation($"[ExpiredProcess] Successfully purged {expiredProducts.Count} expired products from database.");
            }
            else
            {
                _logger?.LogInformation("[ExpiredProcess] All products verified active and functioning.");
            }

            return expiredProducts.Count;
        }

        /// <summary>
        /// Checks a single product URL or ASIN against Amazon web endpoints to determine if the page is expired or non-functioning.
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
                using var request = new HttpRequestMessage(HttpMethod.Get, testUrl);
                using var response = await _httpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead);

                if (!response.IsSuccessStatusCode)
                {
                    if (response.StatusCode == System.Net.HttpStatusCode.NotFound) // 404
                    {
                        return true;
                    }
                }

                var html = await response.Content.ReadAsStringAsync();
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
    }
}
