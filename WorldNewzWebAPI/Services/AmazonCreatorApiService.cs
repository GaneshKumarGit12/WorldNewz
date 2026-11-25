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
        private readonly string _scope;

        /// <summary>
        /// Indicates whether real Amazon Creator API credentials are provided.
        /// </summary>
        public bool IsConfigured =>
            !string.IsNullOrWhiteSpace(_clientId) &&
            !_clientId.StartsWith("YOUR_", StringComparison.OrdinalIgnoreCase) &&
            !string.IsNullOrWhiteSpace(_clientSecret) &&
            !_clientSecret.StartsWith("YOUR_", StringComparison.OrdinalIgnoreCase);

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

            _tokenEndpoint = Environment.GetEnvironmentVariable("AMAZON_TOKEN_ENDPOINT")
                            ?? config["AmazonCreatorApi:TokenEndpoint"]
                            ?? "https://api.amazon.com/auth/o2/token";

            var rawMarketplaceHost = Environment.GetEnvironmentVariable("AMAZON_MARKETPLACE_HOST")
                                     ?? config["AmazonCreatorApi:MarketplaceHost"]
                                     ?? "creatorsapi.amazon";

            if (string.IsNullOrWhiteSpace(rawMarketplaceHost) || 
                rawMarketplaceHost.Equals("webservices.amazon.in", StringComparison.OrdinalIgnoreCase) ||
                rawMarketplaceHost.Equals("webservices.amazon.com", StringComparison.OrdinalIgnoreCase) ||
                rawMarketplaceHost.Equals("www.amazon.in", StringComparison.OrdinalIgnoreCase) ||
                rawMarketplaceHost.Equals("amazon.in", StringComparison.OrdinalIgnoreCase))
            {
                _marketplaceHost = "creatorsapi.amazon";
            }
            else
            {
                _marketplaceHost = rawMarketplaceHost.Trim();
            }

            var rawScope = Environment.GetEnvironmentVariable("AMAZON_SCOPE")
                           ?? config["AmazonCreatorApi:Scope"]
                           ?? "creatorsapi::default";

            // Auto-sanitize legacy or invalid scope values (e.g. creators::api) to creatorsapi::default
            if (string.IsNullOrWhiteSpace(rawScope) || rawScope.Equals("creators::api", StringComparison.OrdinalIgnoreCase))
            {
                _scope = "creatorsapi::default";
            }
            else
            {
                _scope = rawScope.Trim();
            }
        }

        /// <summary>
        /// Proactively checks API credentials and connection health.
        /// </summary>
        public async Task<(bool IsHealthy, string Message)> CheckApiHealthAsync()
        {
            if (!IsConfigured)
            {
                return (false, "Amazon Creator API credentials are not configured. Running in offline PostgreSQL seed mode.");
            }

            try
            {
                var token = await GetAccessTokenAsync();
                if (!string.IsNullOrWhiteSpace(token))
                {
                    return (true, "Amazon OAuth2 authentication active.");
                }
                return (false, "Could not acquire Amazon OAuth2 token (check client credentials and permissions).");
            }
            catch (Exception ex)
            {
                return (false, $"Amazon OAuth2 error: {ex.Message}");
            }
        }

        /// <summary>
        /// Retrieves a valid OAuth access token using IMemoryCache and 90% TTL buffer.
        /// Uses SemaphoreSlim double-checked locking to avoid thundering-herd token refresh requests.
        /// </summary>
        public async Task<string> GetAccessTokenAsync()
        {
            if (!IsConfigured)
            {
                _logger.LogDebug("[AmazonCreatorApiService] Amazon Creator API credentials are not configured. Using offline seed catalog.");
                return string.Empty;
            }

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

                var scopeToUse = !string.IsNullOrWhiteSpace(_scope) ? _scope : "creatorsapi::default";
                var formParams = new List<KeyValuePair<string, string>>
                {
                    new KeyValuePair<string, string>("grant_type", "client_credentials"),
                    new KeyValuePair<string, string>("client_id", _clientId),
                    new KeyValuePair<string, string>("client_secret", _clientSecret),
                    new KeyValuePair<string, string>("scope", scopeToUse)
                };

                using var requestBody = new FormUrlEncodedContent(formParams);

                using var response = await _httpClient.PostAsync(_tokenEndpoint, requestBody);

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

                    // Return empty string gracefully so caller falls back to offline catalog without unhandled crash
                    return string.Empty;
                }

                var json = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;

                string accessToken = root.GetProperty("access_token").GetString() ?? string.Empty;
                int expiresInSeconds = root.TryGetProperty("expires_in", out var expProp) ? expProp.GetInt32() : 3600;

                // Apply 90% TTL safety buffer to guard against clock drift and in-flight request latency
                int effectiveTtlSeconds = Math.Max((int)(expiresInSeconds * 0.90), 60);

                var cacheEntryOptions = new MemoryCacheEntryOptions()
                    .SetAbsoluteExpiration(TimeSpan.FromSeconds(effectiveTtlSeconds))
                    .SetSize(1);

                var lastGoodOptions = new MemoryCacheEntryOptions()
                    .SetAbsoluteExpiration(TimeSpan.FromHours(24))
                    .SetSize(1);

                _cache.Set(TokenCacheKey, accessToken, cacheEntryOptions);
                _cache.Set(LastGoodTokenCacheKey, accessToken, lastGoodOptions); // Keep fallback token for 24 hours

                _logger.LogInformation($"[AmazonCreatorApiService] Successfully cached Amazon OAuth token. Expires in {effectiveTtlSeconds}s (90% of {expiresInSeconds}s).");
                return accessToken;
            }
            catch (Exception ex)
            {
                _logger.LogWarning($"[AmazonCreatorApiService] Exception during token acquisition: {ex.Message}");
                if (_cache.TryGetValue<string>(LastGoodTokenCacheKey, out var lastGood) && !string.IsNullOrWhiteSpace(lastGood))
                {
                    return lastGood;
                }
                return string.Empty;
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
            if (!IsConfigured || asins == null || asins.Count == 0) return new List<AmazonCreatorItemDto>();

            var cleanAsins = asins.Where(a => !string.IsNullOrWhiteSpace(a)).Distinct().ToList();
            if (cleanAsins.Count == 0) return new List<AmazonCreatorItemDto>();

            var items = new List<AmazonCreatorItemDto>();

            try
            {
                string token = await GetAccessTokenAsync();
                if (string.IsNullOrWhiteSpace(token)) return items;

                string targetEndpoint = _marketplaceHost.Contains("creatorsapi", StringComparison.OrdinalIgnoreCase)
                    ? $"https://{_marketplaceHost}/catalog/v1/getItems"
                    : $"https://{_marketplaceHost}/paapi5/getitems";

                // Process ASINs in batches of 10 (Amazon API limit)
                for (int i = 0; i < cleanAsins.Count; i += 10)
                {
                    var batch = cleanAsins.Skip(i).Take(10).ToList();
                    var requestPayload = new
                    {
                        itemIds = batch,
                        itemIdType = "ASIN",
                        partnerTag = _associateTag,
                        partnerType = "Associates",
                        marketplace = "www.amazon.in",
                        resources = new[]
                        {
                            "itemInfo.title",
                            "itemInfo.byLineInfo",
                            "itemInfo.features",
                            "images.primary.large",
                            "offersV2.listings.price",
                            "customerReviews.count",
                            "customerReviews.starRating"
                        }
                    };

                    string jsonBody = JsonSerializer.Serialize(requestPayload);
                    using var request = new HttpRequestMessage(HttpMethod.Post, targetEndpoint)
                    {
                        Content = new StringContent(jsonBody, Encoding.UTF8, "application/json")
                    };

                    request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
                    request.Headers.Add("x-marketplace", "www.amazon.in");

                    if (!targetEndpoint.Contains("catalog/v1/getItems"))
                    {
                        request.Headers.Add("X-Amz-Target", "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems");
                    }

                    using var response = await _httpClient.SendAsync(request);

                    if (response.IsSuccessStatusCode)
                    {
                        string respJson = await response.Content.ReadAsStringAsync();
                        var parsed = ParseAmazonApiResponse(respJson);
                        items.AddRange(parsed);
                    }
                    else
                    {
                        string errText = await response.Content.ReadAsStringAsync();
                        _logger.LogWarning($"[AmazonCreatorApiService] BatchGetItemDetails (HTTP {(int)response.StatusCode} {response.StatusCode}): {errText}");
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning($"[AmazonCreatorApiService] API call issue for {cleanAsins.Count} ASINs: {ex.Message}");
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

                JsonElement itemsArray = default;
                if (TryGetPropertyCaseInsensitive(root, "itemsResult", out var itemsResult) &&
                    TryGetPropertyCaseInsensitive(itemsResult, "items", out var foundArray))
                {
                    itemsArray = foundArray;
                }
                else if (TryGetPropertyCaseInsensitive(root, "items", out var directArray))
                {
                    itemsArray = directArray;
                }

                if (itemsArray.ValueKind == JsonValueKind.Array)
                {
                    foreach (var item in itemsArray.EnumerateArray())
                    {
                        var dto = new AmazonCreatorItemDto();

                        if (TryGetPropertyCaseInsensitive(item, "asin", out var asinProp))
                            dto.Asin = asinProp.GetString() ?? string.Empty;

                        if (TryGetPropertyCaseInsensitive(item, "detailPageUrl", out var urlProp) ||
                            TryGetPropertyCaseInsensitive(item, "detailPageURL", out urlProp))
                        {
                            dto.ProductUrl = urlProp.GetString() ?? string.Empty;
                        }

                        // Title
                        if (TryGetPropertyCaseInsensitive(item, "itemInfo", out var info) &&
                            TryGetPropertyCaseInsensitive(info, "title", out var titleProp) &&
                            TryGetPropertyCaseInsensitive(titleProp, "displayValue", out var titleVal))
                        {
                            dto.Title = titleVal.GetString() ?? string.Empty;
                        }

                        // Image
                        if (TryGetPropertyCaseInsensitive(item, "images", out var images) &&
                            TryGetPropertyCaseInsensitive(images, "primary", out var primary) &&
                            TryGetPropertyCaseInsensitive(primary, "large", out var large) &&
                            TryGetPropertyCaseInsensitive(large, "url", out var imgUrl))
                        {
                            dto.ImageUrl = imgUrl.GetString() ?? string.Empty;
                        }

                        // Price (Offers or OffersV2)
                        JsonElement offers = default;
                        if (TryGetPropertyCaseInsensitive(item, "offersV2", out var offV2))
                            offers = offV2;
                        else if (TryGetPropertyCaseInsensitive(item, "offers", out var off))
                            offers = off;

                        if (offers.ValueKind == JsonValueKind.Object &&
                            TryGetPropertyCaseInsensitive(offers, "listings", out var listings) &&
                            listings.ValueKind == JsonValueKind.Array &&
                            listings.GetArrayLength() > 0)
                        {
                            var listing = listings[0];
                            if (TryGetPropertyCaseInsensitive(listing, "price", out var priceProp))
                            {
                                if (TryGetPropertyCaseInsensitive(priceProp, "amount", out var amountProp))
                                {
                                    if (amountProp.ValueKind == JsonValueKind.Number)
                                        dto.Price = amountProp.GetDecimal();
                                    else if (amountProp.ValueKind == JsonValueKind.String && decimal.TryParse(amountProp.GetString(), out var dPrice))
                                        dto.Price = dPrice;
                                }
                            }
                            if (TryGetPropertyCaseInsensitive(listing, "savingBasis", out var basisProp))
                            {
                                if (TryGetPropertyCaseInsensitive(basisProp, "amount", out var basisAmount))
                                {
                                    if (basisAmount.ValueKind == JsonValueKind.Number)
                                        dto.OriginalPrice = basisAmount.GetDecimal();
                                    else if (basisAmount.ValueKind == JsonValueKind.String && decimal.TryParse(basisAmount.GetString(), out var dBasis))
                                        dto.OriginalPrice = dBasis;
                                }
                            }
                        }

                        if (dto.OriginalPrice < dto.Price || dto.OriginalPrice == 0)
                        {
                            // Zero Synthetic Pricing: never fabricate an artificial MRP when savingBasis is absent
                            dto.OriginalPrice = dto.Price;
                        }

                        // Reviews
                        if (TryGetPropertyCaseInsensitive(item, "customerReviews", out var reviews))
                        {
                            if (TryGetPropertyCaseInsensitive(reviews, "starRating", out var ratingProp) &&
                                TryGetPropertyCaseInsensitive(ratingProp, "value", out var rateVal))
                            {
                                if (rateVal.ValueKind == JsonValueKind.Number)
                                    dto.Rating = rateVal.GetDouble();
                                else if (rateVal.ValueKind == JsonValueKind.String && double.TryParse(rateVal.GetString(), out var dRate))
                                    dto.Rating = dRate;
                            }
                            if (TryGetPropertyCaseInsensitive(reviews, "count", out var countProp))
                            {
                                if (countProp.ValueKind == JsonValueKind.Number)
                                    dto.ReviewCount = countProp.GetInt32();
                                else if (countProp.ValueKind == JsonValueKind.String && int.TryParse(countProp.GetString(), out var dCount))
                                    dto.ReviewCount = dCount;
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

        private static bool TryGetPropertyCaseInsensitive(JsonElement element, string propertyName, out JsonElement value)
        {
            if (element.ValueKind == JsonValueKind.Object)
            {
                foreach (var prop in element.EnumerateObject())
                {
                    if (prop.Name.Equals(propertyName, StringComparison.OrdinalIgnoreCase))
                    {
                        value = prop.Value;
                        return true;
                    }
                }
            }
            value = default;
            return false;
        }
    }
}
