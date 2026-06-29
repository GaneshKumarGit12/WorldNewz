using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace WorldNewzWebAPI.Services
{
    /// <summary>
    /// Model representing a structured Google Search Result.
    /// </summary>
    public class GoogleSearchResult
    {
        public string Title { get; set; } = string.Empty;
        public string Link { get; set; } = string.Empty;
        public string Snippet { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
    }

    public interface IGoogleSearchService
    {
        Task<List<GoogleSearchResult>> SearchAsync(string query);
    }

    public class GoogleSearchService : IGoogleSearchService
    {
        private readonly HttpClient _httpClient;
        private readonly string? _serviceAccountEmail;
        private readonly string? _privateKeyPem;
        private readonly string? _searchEngineId;
        private string? _cachedToken;
        private DateTime _tokenExpiry = DateTime.MinValue;

        public GoogleSearchService(HttpClient httpClient)
        {
            _httpClient = httpClient;
            _serviceAccountEmail = Environment.GetEnvironmentVariable("GOOGLE_SERVICE_ACCOUNT_EMAIL");
            _privateKeyPem = Environment.GetEnvironmentVariable("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY");
            _searchEngineId = Environment.GetEnvironmentVariable("GOOGLE_SEARCH_CX");
        }

        private async Task<string?> GetAccessTokenAsync()
        {
            if (string.IsNullOrEmpty(_serviceAccountEmail) || string.IsNullOrEmpty(_privateKeyPem))
            {
                Console.WriteLine("[GoogleSearchService] Missing service account email or private key in environment.");
                return null;
            }

            if (!string.IsNullOrEmpty(_cachedToken) && DateTime.UtcNow < _tokenExpiry)
            {
                return _cachedToken;
            }

            try
            {
                // Clean the private key PEM string to extract base64 bytes
                var cleanKey = _privateKeyPem
                    .Replace("-----BEGIN PRIVATE KEY-----", "")
                    .Replace("-----END PRIVATE KEY-----", "")
                    .Replace("\\n", "")
                    .Replace("\n", "")
                    .Replace("\r", "")
                    .Replace("\"", "")
                    .Replace(" ", "")
                    .Trim();

                using var rsa = RSA.Create();
                var keyBytes = Convert.FromBase64String(cleanKey);
                rsa.ImportPkcs8PrivateKey(keyBytes, out _);

                var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
                var expiry = now + 3600;

                var header = new { alg = "RS256", typ = "JWT" };
                var payload = new
                {
                    iss = _serviceAccountEmail,
                    scope = "https://www.googleapis.com/auth/cse",
                    aud = "https://oauth2.googleapis.com/token",
                    exp = expiry,
                    iat = now
                };

                var headerJson = JsonSerializer.Serialize(header);
                var payloadJson = JsonSerializer.Serialize(payload);

                var base64Header = Base64UrlEncode(Encoding.UTF8.GetBytes(headerJson));
                var base64Payload = Base64UrlEncode(Encoding.UTF8.GetBytes(payloadJson));

                var dataToSign = $"{base64Header}.{base64Payload}";
                var signature = rsa.SignData(Encoding.UTF8.GetBytes(dataToSign), HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1);
                var base64Signature = Base64UrlEncode(signature);

                var assertion = $"{dataToSign}.{base64Signature}";

                var requestContent = new FormUrlEncodedContent(new Dictionary<string, string>
                {
                    { "grant_type", "urn:ietf:params:oauth:grant-type:jwt-bearer" },
                    { "assertion", assertion }
                });

                var tokenResponse = await _httpClient.PostAsync("https://oauth2.googleapis.com/token", requestContent);
                if (!tokenResponse.IsSuccessStatusCode)
                {
                    var errBody = await tokenResponse.Content.ReadAsStringAsync();
                    Console.WriteLine($"[GoogleSearchService] Token exchange failed: {tokenResponse.StatusCode} - {errBody}");
                    return null;
                }

                var tokenJson = await tokenResponse.Content.ReadAsStringAsync();
                using var tokenDoc = JsonDocument.Parse(tokenJson);
                var tokenRoot = tokenDoc.RootElement;
                _cachedToken = tokenRoot.GetProperty("access_token").GetString();
                var expiresIn = tokenRoot.GetProperty("expires_in").GetInt32();

                _tokenExpiry = DateTime.UtcNow.AddSeconds(expiresIn - 60); // 1 minute safety buffer
                return _cachedToken;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[GoogleSearchService] Error creating access token: {ex.Message}");
                return null;
            }
        }

        private static string Base64UrlEncode(byte[] input)
        {
            return Convert.ToBase64String(input)
                .Replace("=", "")
                .Replace("+", "-")
                .Replace("/", "_");
        }

        public async Task<List<GoogleSearchResult>> SearchAsync(string query)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return new List<GoogleSearchResult>();
            }

            var token = await GetAccessTokenAsync();
            if (string.IsNullOrEmpty(token))
            {
                Console.WriteLine("[GoogleSearchService] Service account authentication failed.");
                return new List<GoogleSearchResult>();
            }

            if (string.IsNullOrEmpty(_searchEngineId))
            {
                Console.WriteLine("[GoogleSearchService] GOOGLE_SEARCH_CX is not configured.");
                return new List<GoogleSearchResult>();
            }

            var escapedQuery = Uri.EscapeDataString(query);
            var url = $"https://www.googleapis.com/customsearch/v1?cx={_searchEngineId}&q={escapedQuery}";

            using var request = new HttpRequestMessage(HttpMethod.Get, url);
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

            var response = await _httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                var errBody = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"[GoogleSearchService] Search API returned error: {response.StatusCode} - {errBody}");
                return new List<GoogleSearchResult>();
            }

            var body = await response.Content.ReadAsStringAsync();
            var results = new List<GoogleSearchResult>();

            try
            {
                using var doc = JsonDocument.Parse(body);
                if (doc.RootElement.TryGetProperty("items", out var items) && items.ValueKind == JsonValueKind.Array)
                {
                    foreach (var item in items.EnumerateArray())
                    {
                        var title = item.TryGetProperty("title", out var titleEl) ? titleEl.GetString() ?? "" : "";
                        var link = item.TryGetProperty("link", out var linkEl) ? linkEl.GetString() ?? "" : "";
                        var snippet = item.TryGetProperty("snippet", out var snippetEl) ? snippetEl.GetString() ?? "" : "";
                        
                        string? imageUrl = null;
                        if (item.TryGetProperty("pagemap", out var pagemap) && pagemap.ValueKind == JsonValueKind.Object)
                        {
                            if (pagemap.TryGetProperty("cse_image", out var cseImage) && cseImage.ValueKind == JsonValueKind.Array && cseImage.GetArrayLength() > 0)
                            {
                                imageUrl = cseImage[0].TryGetProperty("src", out var srcEl) ? srcEl.GetString() : null;
                            }
                        }

                        results.Add(new GoogleSearchResult
                        {
                            Title = title,
                            Link = link,
                            Snippet = snippet,
                            ImageUrl = imageUrl
                        });
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[GoogleSearchService] Error parsing search response: {ex.Message}");
            }

            return results;
        }
    }
}
