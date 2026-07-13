using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using WorldNewzWebAPI.Models;

namespace WorldNewzWebAPI.Services
{
    public interface ISpoonacularService
    {
        Task<SpoonacularSearchResponse> SearchRecipesAsync(string? query, string? diet, string? type, int page = 1, int number = 10);
        Task<SpoonacularRecipeDetails?> GetRecipeDetailsAsync(int id);
        Task<SpoonacularRandomResponse> GetRandomRecipesAsync(int number = 10);
    }

    public class SpoonacularService : ISpoonacularService
    {
        private readonly HttpClient _httpClient;
        private readonly IMemoryCache _cache;
        private readonly ILogger<SpoonacularService> _logger;
        private readonly string? _apiKey;

        public SpoonacularService(HttpClient httpClient, IMemoryCache cache, IConfiguration config, ILogger<SpoonacularService> logger)
        {
            _httpClient = httpClient;
            _cache = cache;
            _logger = logger;
            _apiKey = config["SPOONACULAR_API_KEY"];

            _httpClient.BaseAddress = new Uri("https://api.spoonacular.com/");
            _httpClient.DefaultRequestHeaders.Accept.Clear();
            _httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        }

        private string BuildUrl(string path, Dictionary<string, string>? queryParams = null)
        {
            queryParams ??= new Dictionary<string, string>();
            if (!string.IsNullOrEmpty(_apiKey))
            {
                queryParams.Add("apiKey", _apiKey);
            }
            var querySegments = queryParams.Select(kv => $"{kv.Key}={Uri.EscapeDataString(kv.Value)}");
            return $"{path}?{string.Join("&", querySegments)}";
        }

        public async Task<SpoonacularSearchResponse> SearchRecipesAsync(string? query, string? diet, string? type, int page = 1, int number = 10)
        {
            int offset = (page - 1) * number;
            var cacheKey = $"spoonacular_search_{query ?? ""}_{diet ?? ""}_{type ?? ""}_{offset}_{number}";
            if (_cache.TryGetValue(cacheKey, out SpoonacularSearchResponse? cachedResponse) && cachedResponse != null)
            {
                return cachedResponse;
            }

            try
            {
                var queryParams = new Dictionary<string, string>
                {
                    { "offset", offset.ToString() },
                    { "number", number.ToString() },
                    { "addRecipeInformation", "true" }
                };

                if (!string.IsNullOrWhiteSpace(query))
                {
                    queryParams.Add("query", query);
                }
                if (!string.IsNullOrWhiteSpace(diet))
                {
                    queryParams.Add("diet", diet);
                }
                if (!string.IsNullOrWhiteSpace(type))
                {
                    queryParams.Add("type", type);
                }

                var url = BuildUrl("recipes/complexSearch", queryParams);
                _logger.LogInformation("Fetching Spoonacular recipes from: {Url}", url);

                var response = await _httpClient.GetAsync(url);
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var searchResponse = JsonSerializer.Deserialize<SpoonacularSearchResponse>(content);
                    if (searchResponse != null)
                    {
                        _cache.Set(cacheKey, searchResponse, TimeSpan.FromMinutes(30));
                        return searchResponse;
                    }
                }
                else
                {
                    _logger.LogWarning("Spoonacular complexSearch API returned non-success code: {StatusCode}", response.StatusCode);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling Spoonacular complexSearch API");
            }

            return new SpoonacularSearchResponse();
        }

        public async Task<SpoonacularRecipeDetails?> GetRecipeDetailsAsync(int id)
        {
            var cacheKey = $"spoonacular_details_{id}";
            if (_cache.TryGetValue(cacheKey, out SpoonacularRecipeDetails? cachedDetails) && cachedDetails != null)
            {
                return cachedDetails;
            }

            try
            {
                var queryParams = new Dictionary<string, string>
                {
                    { "includeNutrition", "true" }
                };

                var url = BuildUrl($"recipes/{id}/information", queryParams);
                _logger.LogInformation("Fetching Spoonacular details for ID {Id} from: {Url}", id, url);

                var response = await _httpClient.GetAsync(url);
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var detailsResponse = JsonSerializer.Deserialize<SpoonacularRecipeDetails>(content);
                    if (detailsResponse != null)
                    {
                        _cache.Set(cacheKey, detailsResponse, TimeSpan.FromHours(1));
                        return detailsResponse;
                    }
                }
                else
                {
                    _logger.LogWarning("Spoonacular information API returned non-success code: {StatusCode} for ID {Id}", response.StatusCode, id);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling Spoonacular information API for ID {Id}", id);
            }

            return null;
        }

        public async Task<SpoonacularRandomResponse> GetRandomRecipesAsync(int number = 10)
        {
            var cacheKey = $"spoonacular_random_{number}";
            if (_cache.TryGetValue(cacheKey, out SpoonacularRandomResponse? cachedResponse) && cachedResponse != null)
            {
                return cachedResponse;
            }

            try
            {
                var queryParams = new Dictionary<string, string>
                {
                    { "number", number.ToString() }
                };

                var url = BuildUrl("recipes/random", queryParams);
                _logger.LogInformation("Fetching Spoonacular random recipes from: {Url}", url);

                var response = await _httpClient.GetAsync(url);
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var randomResponse = JsonSerializer.Deserialize<SpoonacularRandomResponse>(content);
                    if (randomResponse != null)
                    {
                        _cache.Set(cacheKey, randomResponse, TimeSpan.FromMinutes(30));
                        return randomResponse;
                    }
                }
                else
                {
                    _logger.LogWarning("Spoonacular random API returned non-success code: {StatusCode}", response.StatusCode);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling Spoonacular random recipes API");
            }

            return new SpoonacularRandomResponse();
        }
    }
}
