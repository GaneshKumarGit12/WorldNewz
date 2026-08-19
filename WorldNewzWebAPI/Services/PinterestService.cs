using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using WorldNewzWebAPI.Models;

namespace WorldNewzWebAPI.Services
{
    public class PinterestService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _config;
        private readonly ILogger<PinterestService>? _logger;

        private static string? _overrideAccessToken;
        private static string? _overrideRefreshToken;
        private static string? _overrideBoardId;

        public PinterestService(HttpClient httpClient, IConfiguration config, ILogger<PinterestService>? logger = null)
        {
            _httpClient = httpClient;
            _config = config;
            _logger = logger;
        }

        public string GetAppId()
        {
            return Environment.GetEnvironmentVariable("PINTEREST_APP_ID")
                   ?? _config["PINTEREST_APP_ID"]
                   ?? _config["Pinterest:AppId"]
                   ?? "1598567";
        }

        public string GetAppSecret()
        {
            return Environment.GetEnvironmentVariable("PINTEREST_APP_SECRET")
                   ?? _config["PINTEREST_APP_SECRET"]
                   ?? _config["Pinterest:AppSecret"]
                   ?? string.Empty;
        }

        public string GetAccessToken()
        {
            if (!string.IsNullOrWhiteSpace(_overrideAccessToken))
            {
                return _overrideAccessToken;
            }

            return Environment.GetEnvironmentVariable("PINTEREST_ACCESS_TOKEN")
                   ?? _config["PINTEREST_ACCESS_TOKEN"]
                   ?? _config["Pinterest:AccessToken"]
                   ?? string.Empty;
        }

        public string GetRefreshToken()
        {
            if (!string.IsNullOrWhiteSpace(_overrideRefreshToken))
            {
                return _overrideRefreshToken;
            }

            return Environment.GetEnvironmentVariable("PINTEREST_REFRESH_TOKEN")
                   ?? _config["PINTEREST_REFRESH_TOKEN"]
                   ?? _config["Pinterest:RefreshToken"]
                   ?? string.Empty;
        }

        public string GetDefaultBoardId()
        {
            if (!string.IsNullOrWhiteSpace(_overrideBoardId))
            {
                return _overrideBoardId;
            }

            return Environment.GetEnvironmentVariable("PINTEREST_DEFAULT_BOARD_ID")
                   ?? _config["PINTEREST_DEFAULT_BOARD_ID"]
                   ?? _config["Pinterest:DefaultBoardId"]
                   ?? string.Empty;
        }

        public bool IsConfigured => !string.IsNullOrWhiteSpace(GetAccessToken());

        public void UpdateActiveCredentials(string? accessToken, string? refreshToken = null, string? boardId = null)
        {
            if (!string.IsNullOrWhiteSpace(accessToken))
            {
                _overrideAccessToken = accessToken.Trim();
            }
            if (!string.IsNullOrWhiteSpace(refreshToken))
            {
                _overrideRefreshToken = refreshToken.Trim();
            }
            if (!string.IsNullOrWhiteSpace(boardId))
            {
                _overrideBoardId = boardId.Trim();
            }
        }

        /// <summary>
        /// Generates the official Pinterest OAuth2 Authorization URL.
        /// </summary>
        public string GetAuthorizationUrl(string redirectUri, string state = "worldnewzs_auth")
        {
            var appId = GetAppId();
            var scope = Uri.EscapeDataString("boards:read,boards:write,pins:read,pins:write,user_accounts:read");
            var encodedRedirect = Uri.EscapeDataString(redirectUri);
            return $"https://www.pinterest.com/oauth/?client_id={appId}&redirect_uri={encodedRedirect}&response_type=code&scope={scope}&state={state}";
        }

        /// <summary>
        /// Exchanges an OAuth authorization code for Access &amp; Refresh tokens.
        /// </summary>
        public async Task<PinterestTokenResponse> ExchangeCodeForTokensAsync(string code, string redirectUri)
        {
            var appId = GetAppId();
            var appSecret = GetAppSecret();

            if (string.IsNullOrWhiteSpace(appId))
            {
                return new PinterestTokenResponse { Success = false, ErrorMessage = "Pinterest App ID is missing." };
            }

            try
            {
                var request = new HttpRequestMessage(HttpMethod.Post, "https://api.pinterest.com/v5/oauth/token");

                if (!string.IsNullOrWhiteSpace(appSecret))
                {
                    var authBytes = Encoding.UTF8.GetBytes($"{appId}:{appSecret}");
                    request.Headers.Authorization = new AuthenticationHeaderValue("Basic", Convert.ToBase64String(authBytes));
                }

                var formParams = new Dictionary<string, string>
                {
                    { "grant_type", "authorization_code" },
                    { "code", code },
                    { "redirect_uri", redirectUri }
                };

                if (string.IsNullOrWhiteSpace(appSecret))
                {
                    formParams.Add("client_id", appId);
                }

                request.Content = new FormUrlEncodedContent(formParams);

                var response = await _httpClient.SendAsync(request);
                var content = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    using var doc = JsonDocument.Parse(content);
                    var root = doc.RootElement;

                    var tokenRes = new PinterestTokenResponse
                    {
                        Success = true,
                        AccessToken = root.TryGetProperty("access_token", out var at) ? at.GetString() ?? "" : "",
                        RefreshToken = root.TryGetProperty("refresh_token", out var rt) ? rt.GetString() ?? "" : "",
                        TokenType = root.TryGetProperty("token_type", out var tt) ? tt.GetString() ?? "bearer" : "bearer",
                        ExpiresIn = root.TryGetProperty("expires_in", out var exp) ? exp.GetInt32() : 2592000,
                        Scope = root.TryGetProperty("scope", out var sc) ? sc.GetString() ?? "" : ""
                    };

                    if (!string.IsNullOrWhiteSpace(tokenRes.AccessToken))
                    {
                        UpdateActiveCredentials(tokenRes.AccessToken, tokenRes.RefreshToken);
                    }

                    return tokenRes;
                }
                else
                {
                    _logger?.LogError($"[PinterestService] Token exchange failed: {response.StatusCode} - {content}");
                    return new PinterestTokenResponse
                    {
                        Success = false,
                        ErrorMessage = $"HTTP {response.StatusCode}: {content}"
                    };
                }
            }
            catch (Exception ex)
            {
                _logger?.LogError(ex, $"[PinterestService] Exception during token exchange: {ex.Message}");
                return new PinterestTokenResponse { Success = false, ErrorMessage = ex.Message };
            }
        }

        /// <summary>
        /// Renews access token using the OAuth2 refresh_token grant.
        /// </summary>
        public async Task<PinterestTokenResponse> RefreshTokenAsync(string? customRefreshToken = null)
        {
            var appId = GetAppId();
            var appSecret = GetAppSecret();
            var refreshToken = !string.IsNullOrWhiteSpace(customRefreshToken) ? customRefreshToken : GetRefreshToken();

            if (string.IsNullOrWhiteSpace(refreshToken))
            {
                return new PinterestTokenResponse { Success = false, ErrorMessage = "No refresh token available. Re-authenticate via Pinterest OAuth." };
            }

            try
            {
                var request = new HttpRequestMessage(HttpMethod.Post, "https://api.pinterest.com/v5/oauth/token");

                if (!string.IsNullOrWhiteSpace(appId) && !string.IsNullOrWhiteSpace(appSecret))
                {
                    var authBytes = Encoding.UTF8.GetBytes($"{appId}:{appSecret}");
                    request.Headers.Authorization = new AuthenticationHeaderValue("Basic", Convert.ToBase64String(authBytes));
                }

                var formParams = new Dictionary<string, string>
                {
                    { "grant_type", "refresh_token" },
                    { "refresh_token", refreshToken }
                };

                request.Content = new FormUrlEncodedContent(formParams);

                var response = await _httpClient.SendAsync(request);
                var content = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    using var doc = JsonDocument.Parse(content);
                    var root = doc.RootElement;

                    var tokenRes = new PinterestTokenResponse
                    {
                        Success = true,
                        AccessToken = root.TryGetProperty("access_token", out var at) ? at.GetString() ?? "" : "",
                        RefreshToken = root.TryGetProperty("refresh_token", out var rt) ? rt.GetString() ?? refreshToken : refreshToken,
                        ExpiresIn = root.TryGetProperty("expires_in", out var exp) ? exp.GetInt32() : 2592000,
                        Scope = root.TryGetProperty("scope", out var sc) ? sc.GetString() ?? "" : ""
                    };

                    if (!string.IsNullOrWhiteSpace(tokenRes.AccessToken))
                    {
                        UpdateActiveCredentials(tokenRes.AccessToken, tokenRes.RefreshToken);
                    }

                    _logger?.LogInformation("[PinterestService] Successfully refreshed Pinterest access token.");
                    return tokenRes;
                }
                else
                {
                    _logger?.LogWarning($"[PinterestService] Token refresh failed: {response.StatusCode} - {content}");
                    return new PinterestTokenResponse
                    {
                        Success = false,
                        ErrorMessage = $"HTTP {response.StatusCode}: {content}"
                    };
                }
            }
            catch (Exception ex)
            {
                _logger?.LogError(ex, $"[PinterestService] Exception refreshing token: {ex.Message}");
                return new PinterestTokenResponse { Success = false, ErrorMessage = ex.Message };
            }
        }

        /// <summary>
        /// Retrieves authenticated Pinterest account details and validates token.
        /// </summary>
        public async Task<PinterestAccountDto> GetAccountInfoAsync()
        {
            var token = GetAccessToken();
            if (string.IsNullOrWhiteSpace(token))
            {
                return new PinterestAccountDto { IsAuthenticated = false, Message = "No Pinterest access token configured." };
            }

            try
            {
                var request = new HttpRequestMessage(HttpMethod.Get, "https://api.pinterest.com/v5/user_account");
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

                var response = await _httpClient.SendAsync(request);
                var content = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    using var doc = JsonDocument.Parse(content);
                    var root = doc.RootElement;

                    return new PinterestAccountDto
                    {
                        IsAuthenticated = true,
                        Username = root.TryGetProperty("username", out var u) ? u.GetString() ?? "" : "",
                        AccountType = root.TryGetProperty("account_type", out var at) ? at.GetString() ?? "" : "",
                        ProfileImage = root.TryGetProperty("profile_image", out var pi) ? pi.GetString() ?? "" : "",
                        WebsiteUrl = root.TryGetProperty("website_url", out var w) ? w.GetString() ?? "" : "",
                        Message = "Connected to Pinterest account."
                    };
                }
                else
                {
                    return new PinterestAccountDto
                    {
                        IsAuthenticated = false,
                        Message = $"Pinterest API response ({response.StatusCode}): {content}"
                    };
                }
            }
            catch (Exception ex)
            {
                return new PinterestAccountDto
                {
                    IsAuthenticated = false,
                    Message = $"Exception validating account: {ex.Message}"
                };
            }
        }

        /// <summary>
        /// Checks the token creation date and returns token status and expiry reminder info.
        /// </summary>
        public (bool IsValid, string StatusMessage, int DaysRemaining) CheckTokenExpiryStatus()
        {
            var token = GetAccessToken();
            if (string.IsNullOrWhiteSpace(token))
            {
                return (false, "No Pinterest Access Token configured in .env or appsettings.json.", 0);
            }

            var createdDateStr = Environment.GetEnvironmentVariable("PINTEREST_TOKEN_CREATED_DATE")
                                 ?? _config["PINTEREST_TOKEN_CREATED_DATE"]
                                 ?? DateTime.UtcNow.ToString("yyyy-MM-dd");

            if (DateTime.TryParse(createdDateStr, out DateTime createdDate))
            {
                var daysElapsed = (DateTime.UtcNow - createdDate).Days;
                var daysRemaining = Math.Max(0, 30 - daysElapsed);

                if (daysElapsed >= 30)
                {
                    var warning = "⚠️ Pinterest Access Token has exceeded the 30-day lifetime. Please refresh or re-authorize.";
                    return (false, warning, 0);
                }
                else if (daysRemaining <= 5)
                {
                    var warning = $"⚠️ REMINDER: Pinterest Access Token expires in ~{daysRemaining} days.";
                    return (true, warning, daysRemaining);
                }
                else
                {
                    return (true, $"Pinterest Access Token configured (~{daysRemaining} days remaining before 30-day renewal).", daysRemaining);
                }
            }

            return (true, "Pinterest Access Token present.", 30);
        }

        /// <summary>
        /// Fetches user's Pinterest boards to help identify available Board IDs.
        /// </summary>
        public async Task<List<PinterestBoardDto>> GetUserBoardsAsync()
        {
            var token = GetAccessToken();
            if (string.IsNullOrWhiteSpace(token))
            {
                _logger?.LogDebug("[PinterestService] Cannot fetch boards: No access token provided.");
                return new List<PinterestBoardDto>();
            }

            try
            {
                var request = new HttpRequestMessage(HttpMethod.Get, "https://api.pinterest.com/v5/boards");
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

                var response = await _httpClient.SendAsync(request);
                var content = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    using var doc = JsonDocument.Parse(content);
                    var boards = new List<PinterestBoardDto>();

                    if (doc.RootElement.TryGetProperty("items", out var items) && items.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var item in items.EnumerateArray())
                        {
                            boards.Add(new PinterestBoardDto
                            {
                                Id = item.GetProperty("id").GetString() ?? "",
                                Name = item.GetProperty("name").GetString() ?? "",
                                Description = item.TryGetProperty("description", out var desc) ? desc.GetString() ?? "" : ""
                            });
                        }
                    }
                    return boards;
                }
                else
                {
                    _logger?.LogWarning($"[PinterestService] Fetch boards response: {response.StatusCode} - {content}");
                    return new List<PinterestBoardDto>();
                }
            }
            catch (Exception ex)
            {
                _logger?.LogWarning($"[PinterestService] Exception fetching boards: {ex.Message}");
                return new List<PinterestBoardDto>();
            }
        }

        /// <summary>
        /// Automatically creates a Pin on Pinterest for an Amazon Product.
        /// </summary>
        public async Task<PinterestPinResult> CreatePinForAmazonProductAsync(AmazonProduct product, string? customBoardId = null)
        {
            var token = GetAccessToken();
            var boardId = !string.IsNullOrWhiteSpace(customBoardId) ? customBoardId : GetDefaultBoardId();

            if (string.IsNullOrWhiteSpace(token))
            {
                return new PinterestPinResult
                {
                    Success = false,
                    Message = "Pinterest Access Token missing. Configure PINTEREST_ACCESS_TOKEN in .env"
                };
            }

            // Fallback: If no board ID is provided, query user's boards
            if (string.IsNullOrWhiteSpace(boardId))
            {
                var boards = await GetUserBoardsAsync();
                var firstBoard = boards.FirstOrDefault();

                if (firstBoard != null && !string.IsNullOrWhiteSpace(firstBoard.Id))
                {
                    boardId = firstBoard.Id;
                    _overrideBoardId = boardId;
                    _logger?.LogInformation($"[PinterestService] Auto-selected Pinterest Board '{firstBoard.Name}' ({boardId})");
                }
                else
                {
                    return new PinterestPinResult
                    {
                        Success = false,
                        Message = "No Pinterest board found or board access restricted. Set PINTEREST_DEFAULT_BOARD_ID or verify app access level."
                    };
                }
            }

            try
            {
                // Format title (Pinterest max length 100)
                var title = product.Title ?? "Featured Amazon Product";
                if (title.Length > 100)
                {
                    title = title.Substring(0, 97) + "...";
                }

                // Format description (Pinterest max length 800)
                var description = $"{product.Title}\n\nPrice: ₹{product.Price:N2}\n{(string.IsNullOrWhiteSpace(product.Description) ? "" : product.Description)}\n\nAvailable now on Amazon!";
                if (description.Length > 800)
                {
                    description = description.Substring(0, 797) + "...";
                }

                // Ensure image URL is absolute
                var imageUrl = product.ImageUrl;
                if (!string.IsNullOrWhiteSpace(imageUrl) && !imageUrl.StartsWith("http", StringComparison.OrdinalIgnoreCase))
                {
                    imageUrl = $"https://worldnewzs.in{imageUrl}";
                }

                // Ensure link is direct Amazon Affiliate URL
                var productUrl = product.ProductUrl;
                if (string.IsNullOrWhiteSpace(productUrl))
                {
                    var tag = Environment.GetEnvironmentVariable("AMAZON_ASSOCIATE_TAG") ?? "ganeshd12-21";
                    productUrl = $"https://www.amazon.in/dp/{product.Asin}?tag={tag}";
                }

                // Construct Pinterest API v5 Payload
                var payload = new
                {
                    board_id = boardId,
                    title = title,
                    description = description,
                    link = productUrl,
                    media_source = new
                    {
                        source_type = "image_url",
                        url = imageUrl
                    }
                };

                var jsonPayload = JsonSerializer.Serialize(payload);
                var request = new HttpRequestMessage(HttpMethod.Post, "https://api.pinterest.com/v5/pins");
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
                request.Content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

                _logger?.LogInformation($"[PinterestService] Sending Pin request for ASIN '{product.Asin}' to board '{boardId}'...");

                var response = await _httpClient.SendAsync(request);
                var responseContent = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    using var doc = JsonDocument.Parse(responseContent);
                    var pinId = doc.RootElement.TryGetProperty("id", out var idProp) ? idProp.GetString() : null;

                    _logger?.LogInformation($"[PinterestService] Successfully created Pin (ID: {pinId}) for ASIN '{product.Asin}'!");

                    return new PinterestPinResult
                    {
                        Success = true,
                        PinId = pinId,
                        PinUrl = $"https://www.pinterest.com/pin/{pinId}/",
                        Message = "Pin created successfully on Pinterest!"
                    };
                }
                else
                {
                    _logger?.LogWarning($"[PinterestService] Pinterest API response for ASIN '{product.Asin}': {response.StatusCode} - {responseContent}");
                    return new PinterestPinResult
                    {
                        Success = false,
                        Message = $"Pinterest API ({response.StatusCode}): {responseContent}"
                    };
                }
            }
            catch (Exception ex)
            {
                _logger?.LogWarning($"[PinterestService] Exception creating Pin for ASIN '{product.Asin}': {ex.Message}");
                return new PinterestPinResult
                {
                    Success = false,
                    Message = $"Exception: {ex.Message}"
                };
            }
        }
    }

    public class PinterestBoardDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }

    public class PinterestPinResult
    {
        public bool Success { get; set; }
        public string? PinId { get; set; }
        public string? PinUrl { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    public class PinterestTokenResponse
    {
        public bool Success { get; set; }
        public string AccessToken { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
        public string TokenType { get; set; } = "bearer";
        public int ExpiresIn { get; set; }
        public string Scope { get; set; } = string.Empty;
        public string? ErrorMessage { get; set; }
    }

    public class PinterestAccountDto
    {
        public bool IsAuthenticated { get; set; }
        public string Username { get; set; } = string.Empty;
        public string AccountType { get; set; } = string.Empty;
        public string ProfileImage { get; set; } = string.Empty;
        public string WebsiteUrl { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
    }
}
