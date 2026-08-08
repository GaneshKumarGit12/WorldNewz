using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace WorldNewzWebAPI.Services
{
    public class AmazonCreatorItemDto
    {
        public string Asin { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public decimal OriginalPrice { get; set; }
        public double Rating { get; set; }
        public int ReviewCount { get; set; }
        public string Category { get; set; } = "Shopping";
        public string ProductUrl { get; set; } = string.Empty;
    }

    public class AmazonCreatorApiService
    {
        private readonly HttpClient _httpClient;
        private readonly IMemoryCache _cache;
        private readonly ILogger<AmazonCreatorApiService> _logger;
        private readonly IConfiguration _config;
        private static readonly SemaphoreSlim _tokenSemaphore = new SemaphoreSlim(1, 1);

        private const string TokenCacheKey = "AmazonCreatorApi_OAuthToken";
        private const string LastGoodTokenCacheKey = "AmazonCreatorApi_LastGoodOAuthToken";

        private readonly string _clientId;
        private readonly string _clientSecret;
        private readonly string _associateTag;
        private readonly string _tokenEndpoint;
        private readonly string _marketplaceHost;

        public AmazonCreatorApiService(
            HttpClient httpClient,
            IMemoryCache cache,
            ILogger<AmazonCreatorApiService> logger,
            IConfiguration config)
        {
            _httpClient = httpClient;
            _cache = cache;
            _logger = logger;
            _config = config;

            _clientId = Environment.GetEnvironmentVariable("AMAZON_CLIENT_ID")
                        ?? config["AmazonCreatorApi:ClientId"]
                        ?? string.Empty;

            _clientSecret = Environment.GetEnvironmentVariable("AMAZON_CLIENT_SECRET")
                            ?? config["AmazonCreatorApi:ClientSecret"]
                            ?? string.Empty;

            _associateTag = Environment.GetEnvironmentVariable("AMAZON_ASSOCIATE_TAG")
                             ?? config["AmazonCreatorApi:AssociateTag"]
                             ?? "ganeshd12-21";

            _tokenEndpoint = config["AmazonCreatorApi:TokenEndpoint"]
                            ?? "https://api.amazon.com/auth/o2/token";

            _marketplaceHost = config["AmazonCreatorApi:MarketplaceHost"]
                               ?? "www.amazon.in";
        }

        /// <summary>
        /// Retrieves a valid OAuth access token using IMemoryCache and 90% TTL buffer.
        /// Uses SemaphoreSlim double-checked locking to avoid thundering-herd token refresh requests.
        /// </summary>
        public async Task<string> GetAccessTokenAsync()
        {
            if (_cache.TryGetValue<string>(TokenCacheKey, out var cachedToken) && !string.IsNullOrWhiteSpace(cachedToken))
            {
                return cachedToken;
            }

            await _tokenSemaphore.WaitAsync();
            try
            {
                // Double-check cache after lock acquisition
                if (_cache.TryGetValue<string>(TokenCacheKey, out cachedToken) && !string.IsNullOrWhiteSpace(cachedToken))
                {
                    return cachedToken;
                }

                _logger.LogInformation("[AmazonCreatorApiService] Requesting fresh OAuth2 token from Amazon...");

                var requestBody = new FormUrlEncodedContent(new[]
                {
                    new KeyValuePair<string, string>("grant_type", "client_credentials"),
                    new KeyValuePair<string, string>("client_id", _clientId),
                    new KeyValuePair<string, string>("client_secret", _clientSecret),
                    new KeyValuePair<string, string>("scope", "amazon_creator_api")
                });

                var response = await _httpClient.PostAsync(_tokenEndpoint, requestBody);

                if (!response.IsSuccessStatusCode)
                {
                    var errContent = await response.Content.ReadAsStringAsync();
                    _logger.LogWarning($"[AmazonCreatorApiService] Token fetch failed with HTTP {response.StatusCode}: {errContent}");

                    // Grace period / soft failover: return last known good token if available
                    if (_cache.TryGetValue<string>(LastGoodTokenCacheKey, out var lastGood) && !string.IsNullOrWhiteSpace(lastGood))
                    {
                        _logger.LogInformation("[AmazonCreatorApiService] Returning last known-good OAuth token during grace period.");
                        return lastGood;
                    }

                    throw new HttpRequestException($"Failed to obtain Amazon OAuth token: {response.StatusCode}");
                }

                var json = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;

                string accessToken = root.GetProperty("access_token").GetString() ?? string.Empty;
                int expiresInSeconds = root.TryGetProperty("expires_in", out var expProp) ? expProp.GetInt32() : 3600;

                // Apply 90% TTL safety buffer to guard against clock drift and in-flight request latency
                int effectiveTtlSeconds = Math.Max((int)(expiresInSeconds * 0.90), 60);

                var cacheEntryOptions = new MemoryCacheEntryOptions()
                    .SetAbsoluteExpiration(TimeSpan.FromSeconds(effectiveTtlSeconds));

                _cache.Set(TokenCacheKey, accessToken, cacheEntryOptions);
                _cache.Set(LastGoodTokenCacheKey, accessToken, TimeSpan.FromHours(24)); // Keep fallback token for 24 hours

                _logger.LogInformation($"[AmazonCreatorApiService] Successfully cached Amazon OAuth token. Expires in {effectiveTtlSeconds}s (90% of {expiresInSeconds}s).");
                return accessToken;
            }
            finally
            {
                _tokenSemaphore.Release();
            }
        }

        /// <summary>
        /// Fetches product details for a single ASIN from Amazon Creator API v3.2.
        /// </summary>
        public async Task<AmazonCreatorItemDto?> GetItemDetailsAsync(string asin)
        {
            var results = await BatchGetItemDetailsAsync(new List<string> { asin });
            return results.FirstOrDefault();
        }

        /// <summary>
        /// Batch fetches product details for multiple ASINs from Amazon Creator API v3.2.
        /// </summary>
        public async Task<List<AmazonCreatorItemDto>> BatchGetItemDetailsAsync(List<string> asins)
        {
            if (asins == null || asins.Count == 0) return new List<AmazonCreatorItemDto>();

            var cleanAsins = asins.Where(a => !string.IsNullOrWhiteSpace(a)).Distinct().ToList();
            if (cleanAsins.Count == 0) return new List<AmazonCreatorItemDto>();

            var items = new List<AmazonCreatorItemDto>();

            try
            {
                string token = await GetAccessTokenAsync();

                // Process ASINs in batches of 10 (Amazon API limit)
                for (int i = 0; i < cleanAsins.Count; i += 10)
                {
                    var batch = cleanAsins.Skip(i).Take(10).ToList();
                    var requestPayload = new
                    {
                        ItemIds = batch,
                        PartnerTag = _associateTag,
                        PartnerType = "Associates",
                        Marketplace = _marketplaceHost,
                        Resources = new[]
                        {
                            "ItemInfo.Title",
                            "ItemInfo.ByLineInfo",
                            "ItemInfo.Features",
                            "Images.Primary.Large",
                            "Offers.Listings.Price",
                            "Offers.Listings.SavingBasis",
                            "CustomerReviews.Count",
                            "CustomerReviews.StarRating"
                        }
                    };

                    string jsonBody = JsonSerializer.Serialize(requestPayload);
                    var request = new HttpRequestMessage(HttpMethod.Post, $"https://{_marketplaceHost}/paapi5/getitems")
                    {
                        Content = new StringContent(jsonBody, Encoding.UTF8, "application/json")
                    };

                    request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
                    request.Headers.Add("X-Amz-Target", "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems");

                    var response = await _httpClient.SendAsync(request);

                    if (response.IsSuccessStatusCode)
                    {
                        string respJson = await response.Content.ReadAsStringAsync();
                        var parsed = ParseAmazonApiResponse(respJson);
                        items.AddRange(parsed);
                    }
                    else
                    {
                        string errText = await response.Content.ReadAsStringAsync();
                        _logger.LogWarning($"[AmazonCreatorApiService] BatchGetItemDetails failed (HTTP {(int)response.StatusCode} {response.StatusCode}): {errText}");
                        
                        // Pass HTTP status code back so caller/Polly breaker can inspect throttling (429/503) vs Auth errors (401/403)
                        throw new HttpRequestException($"Amazon API HTTP status {(int)response.StatusCode}", null, response.StatusCode);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"[AmazonCreatorApiService] Error during batch item retrieval for {cleanAsins.Count} ASINs.");
                throw;
            }

            return items;
        }

        private List<AmazonCreatorItemDto> ParseAmazonApiResponse(string json)
        {
            var list = new List<AmazonCreatorItemDto>();
            try
            {
                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;

                if (root.TryGetProperty("ItemsResult", out var itemsResult) &&
                    itemsResult.TryGetProperty("Items", out var itemsArray) &&
                    itemsArray.ValueKind == JsonValueKind.Array)
                {
                    foreach (var item in itemsArray.EnumerateArray())
                    {
                        var dto = new AmazonCreatorItemDto();

                        if (item.TryGetProperty("ASIN", out var asinProp))
                            dto.Asin = asinProp.GetString() ?? string.Empty;

                        if (item.TryGetProperty("DetailPageURL", out var urlProp))
                            dto.ProductUrl = urlProp.GetString() ?? string.Empty;

                        // Title
                        if (item.TryGetProperty("ItemInfo", out var info) &&
                            info.TryGetProperty("Title", out var titleProp) &&
                            titleProp.TryGetProperty("DisplayValue", out var titleVal))
                        {
                            dto.Title = titleVal.GetString() ?? string.Empty;
                        }

                        // Image
                        if (item.TryGetProperty("Images", out var images) &&
                            images.TryGetProperty("Primary", out var primary) &&
                            primary.TryGetProperty("Large", out var large) &&
                            large.TryGetProperty("URL", out var imgUrl))
                        {
                            dto.ImageUrl = imgUrl.GetString() ?? string.Empty;
                        }

                        // Price
                        if (item.TryGetProperty("Offers", out var offers) &&
                            offers.TryGetProperty("Listings", out var listings) &&
                            listings.ValueKind == JsonValueKind.Array &&
                            listings.GetArrayLength() > 0)
                        {
                            var listing = listings[0];
                            if (listing.TryGetProperty("Price", out var priceProp) &&
                                priceProp.TryGetProperty("Amount", out var amountProp))
                            {
                                dto.Price = amountProp.GetDecimal();
                            }
                            if (listing.TryGetProperty("SavingBasis", out var basisProp) &&
                                basisProp.TryGetProperty("Amount", out var basisAmount))
                            {
                                dto.OriginalPrice = basisAmount.GetDecimal();
                            }
                        }

                        if (dto.OriginalPrice < dto.Price || dto.OriginalPrice == 0)
                        {
                            dto.OriginalPrice = Math.Round(dto.Price * 1.15m, 2);
                        }

                        // Reviews
                        if (item.TryGetProperty("CustomerReviews", out var reviews))
                        {
                            if (reviews.TryGetProperty("StarRating", out var ratingProp) &&
                                ratingProp.TryGetProperty("Value", out var rateVal))
                            {
                                dto.Rating = rateVal.GetDouble();
                            }
                            if (reviews.TryGetProperty("Count", out var countProp))
                            {
                                dto.ReviewCount = countProp.GetInt32();
                            }
                        }

                        if (dto.Rating <= 0) dto.Rating = 4.5;
                        if (dto.ReviewCount <= 0) dto.ReviewCount = 120;

                        if (!string.IsNullOrWhiteSpace(dto.Asin))
                        {
                            list.Add(dto);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[AmazonCreatorApiService] Error parsing Amazon API JSON response.");
            }

            return list;
        }
    }
}
