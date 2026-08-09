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

        public PinterestService(HttpClient httpClient, IConfiguration config, ILogger<PinterestService>? logger = null)
        {
            _httpClient = httpClient;
            _config = config;
            _logger = logger;
        }

        private string GetAccessToken()
        {
            return Environment.GetEnvironmentVariable("PINTEREST_ACCESS_TOKEN")
                   ?? _config["PINTEREST_ACCESS_TOKEN"]
                   ?? _config["Pinterest:AccessToken"]
                   ?? string.Empty;
        }

        private string GetDefaultBoardId()
        {
            return Environment.GetEnvironmentVariable("PINTEREST_DEFAULT_BOARD_ID")
                   ?? _config["PINTEREST_DEFAULT_BOARD_ID"]
                   ?? _config["Pinterest:DefaultBoardId"]
                   ?? string.Empty;
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
                                 ?? "2026-08-09";

            if (DateTime.TryParse(createdDateStr, out DateTime createdDate))
            {
                var daysElapsed = (DateTime.UtcNow - createdDate).Days;
                var daysRemaining = 30 - daysElapsed;

                if (daysRemaining <= 0)
                {
                    var warning = "⚠️ Pinterest Access Token HAS EXPIRED! Please refresh the token in Pinterest Developer Portal and update .env";
                    _logger?.LogWarning(warning);
                    return (false, warning, 0);
                }
                else if (daysRemaining <= 5)
                {
                    var warning = $"⚠️ REMINDER: Pinterest Access Token expires in {daysRemaining} days! Please prepare to refresh it.";
                    _logger?.LogWarning(warning);
                    return (true, warning, daysRemaining);
                }
                else
                {
                    return (true, $"Pinterest Access Token is active. ~{daysRemaining} days remaining before 30-day refresh.", daysRemaining);
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
                _logger?.LogWarning("[PinterestService] Cannot fetch boards: No access token provided.");
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
                                Description = item.TryGetProperty("description", out var desc) ? desc.GetString() : ""
                            });
                        }
                    }
                    return boards;
                }
                else
                {
                    _logger?.LogError($"[PinterestService] Failed to fetch boards: {response.StatusCode} - {content}");
                    return new List<PinterestBoardDto>();
                }
            }
            catch (Exception ex)
            {
                _logger?.LogError($"[PinterestService] Exception fetching boards: {ex.Message}");
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
                    Message = "Pinterest Access Token missing. Add PINTEREST_ACCESS_TOKEN to .env"
                };
            }

            // Fallback: If no board ID is provided, fetch user's first available board
            if (string.IsNullOrWhiteSpace(boardId))
            {
                _logger?.LogInformation("[PinterestService] No board_id specified. Querying default user board...");
                var boards = await GetUserBoardsAsync();
                var firstBoard = boards.FirstOrDefault();

                if (firstBoard != null && !string.IsNullOrWhiteSpace(firstBoard.Id))
                {
                    boardId = firstBoard.Id;
                    _logger?.LogInformation($"[PinterestService] Auto-selected Pinterest Board '{firstBoard.Name}' ({boardId})");
                }
                else
                {
                    return new PinterestPinResult
                    {
                        Success = false,
                        Message = "No Pinterest board found. Please create a board or set PINTEREST_DEFAULT_BOARD_ID in .env"
                    };
                }
            }

            // Check token expiration status
            var (isValid, statusMsg, _) = CheckTokenExpiryStatus();
            if (!isValid)
            {
                _logger?.LogWarning($"[PinterestService] Token warning: {statusMsg}");
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
                    _logger?.LogError($"[PinterestService] Pinterest API error (ASIN: {product.Asin}): {response.StatusCode} - {responseContent}");
                    return new PinterestPinResult
                    {
                        Success = false,
                        Message = $"Pinterest API error ({response.StatusCode}): {responseContent}"
                    };
                }
            }
            catch (Exception ex)
            {
                _logger?.LogError($"[PinterestService] Exception creating Pin for ASIN '{product.Asin}': {ex.Message}");
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
}
