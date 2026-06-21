using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using WorldNewzWebAPI.Models;

namespace WorldNewzWebAPI.Services
{
    public interface IFreeToGameService
    {
        Task<IEnumerable<FreeToGameItem>> GetGamesAsync(string? platform, string? category, string? sortBy);
        Task<FreeToGameDetails?> GetGameDetailsAsync(int id);
        Task<IEnumerable<FreeToGameItem>> FilterGamesAsync(string tag, string? platform, string? sort);
    }

    public class FreeToGameService : IFreeToGameService
    {
        private readonly HttpClient _httpClient;
        private readonly IMemoryCache _cache;
        private readonly ILogger<FreeToGameService> _logger;

        public FreeToGameService(HttpClient httpClient, IMemoryCache cache, ILogger<FreeToGameService> logger)
        {
            _httpClient = httpClient;
            _cache = cache;
            _logger = logger;
        }

        public async Task<IEnumerable<FreeToGameItem>> GetGamesAsync(string? platform, string? category, string? sortBy)
        {
            var cacheKey = $"freetogame_games_{platform ?? "all"}_{category ?? "all"}_{sortBy ?? "default"}";

            if (_cache.TryGetValue(cacheKey, out IEnumerable<FreeToGameItem>? cachedGames) && cachedGames != null)
            {
                _logger.LogInformation("Returning cached FreeToGame games list for key {CacheKey}", cacheKey);
                return cachedGames;
            }

            try
            {
                var queryParams = new List<string>();
                if (!string.IsNullOrWhiteSpace(platform))
                {
                    queryParams.Add($"platform={Uri.EscapeDataString(platform)}");
                }
                if (!string.IsNullOrWhiteSpace(category))
                {
                    queryParams.Add($"category={Uri.EscapeDataString(category)}");
                }
                if (!string.IsNullOrWhiteSpace(sortBy))
                {
                    queryParams.Add($"sort-by={Uri.EscapeDataString(sortBy)}");
                }

                var queryString = queryParams.Any() ? "?" + string.Join("&", queryParams) : "";
                var requestUrl = $"games{queryString}";

                _logger.LogInformation("Fetching FreeToGame list from: {Url}", _httpClient.BaseAddress + requestUrl);

                var response = await _httpClient.GetAsync(requestUrl);
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("FreeToGame API returned status code {StatusCode}", response.StatusCode);
                    return Enumerable.Empty<FreeToGameItem>();
                }

                var content = await response.Content.ReadAsStringAsync();
                var games = JsonSerializer.Deserialize<List<FreeToGameItem>>(content);

                if (games != null)
                {
                    _cache.Set(cacheKey, games, TimeSpan.FromMinutes(15));
                    return games;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching games from FreeToGame API");
            }

            return Enumerable.Empty<FreeToGameItem>();
        }

        public async Task<FreeToGameDetails?> GetGameDetailsAsync(int id)
        {
            var cacheKey = $"freetogame_game_details_{id}";

            if (_cache.TryGetValue(cacheKey, out FreeToGameDetails? cachedDetails) && cachedDetails != null)
            {
                _logger.LogInformation("Returning cached FreeToGame details for game {GameId}", id);
                return cachedDetails;
            }

            try
            {
                var requestUrl = $"game?id={id}";
                _logger.LogInformation("Fetching FreeToGame details from: {Url}", _httpClient.BaseAddress + requestUrl);

                var response = await _httpClient.GetAsync(requestUrl);
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("FreeToGame API returned status code {StatusCode} for game id {GameId}", response.StatusCode, id);
                    return null;
                }

                var content = await response.Content.ReadAsStringAsync();
                var details = JsonSerializer.Deserialize<FreeToGameDetails>(content);

                if (details != null)
                {
                    _cache.Set(cacheKey, details, TimeSpan.FromMinutes(30));
                    return details;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching game details for id {GameId} from FreeToGame API", id);
            }

            return null;
        }

        public async Task<IEnumerable<FreeToGameItem>> FilterGamesAsync(string tag, string? platform, string? sort)
        {
            var cacheKey = $"freetogame_filter_{tag}_{platform ?? "all"}_{sort ?? "default"}";

            if (_cache.TryGetValue(cacheKey, out IEnumerable<FreeToGameItem>? cachedGames) && cachedGames != null)
            {
                _logger.LogInformation("Returning cached FreeToGame filtered games list for key {CacheKey}", cacheKey);
                return cachedGames;
            }

            try
            {
                var queryParams = new List<string> { $"tag={Uri.EscapeDataString(tag)}" };
                if (!string.IsNullOrWhiteSpace(platform))
                {
                    queryParams.Add($"platform={Uri.EscapeDataString(platform)}");
                }
                if (!string.IsNullOrWhiteSpace(sort))
                {
                    queryParams.Add($"sort={Uri.EscapeDataString(sort)}");
                }

                var queryString = "?" + string.Join("&", queryParams);
                var requestUrl = $"filter{queryString}";

                _logger.LogInformation("Fetching FreeToGame filtered list from: {Url}", _httpClient.BaseAddress + requestUrl);

                var response = await _httpClient.GetAsync(requestUrl);
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("FreeToGame API filter endpoint returned status code {StatusCode}", response.StatusCode);
                    return Enumerable.Empty<FreeToGameItem>();
                }

                var content = await response.Content.ReadAsStringAsync();
                var games = JsonSerializer.Deserialize<List<FreeToGameItem>>(content);

                if (games != null)
                {
                    _cache.Set(cacheKey, games, TimeSpan.FromMinutes(15));
                    return games;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error filtering games from FreeToGame API");
            }

            return Enumerable.Empty<FreeToGameItem>();
        }
    }
}
