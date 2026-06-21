using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using WorldNewzWebAPI.Models;

namespace WorldNewzWebAPI.Services
{
    public interface IMovieDbService
    {
        Task<MovieDbListResponse> GetMoviesAsync(string listType, int page = 1, int? genreId = null);
        Task<MovieDbListResponse> SearchMoviesAsync(string query, int page = 1);
        Task<MovieDbDetails?> GetMovieDetailsAsync(int id);
        Task<MovieDbConfiguration?> GetConfigurationAsync();
    }

    public class MovieDbService : IMovieDbService
    {
        private readonly HttpClient _httpClient;
        private readonly IMemoryCache _cache;
        private readonly ILogger<MovieDbService> _logger;
        private readonly string? _apiKey;
        private readonly string? _accessToken;

        public MovieDbService(HttpClient httpClient, IMemoryCache cache, ILogger<MovieDbService> logger)
        {
            _httpClient = httpClient;
            _cache = cache;
            _logger = logger;
            _apiKey = Environment.GetEnvironmentVariable("MOVIEDB_API_KEY");
            _accessToken = Environment.GetEnvironmentVariable("MOVIEDB_ACCESS_TOKEN");

            // Setup HttpClient headers
            _httpClient.BaseAddress = new Uri("https://api.themoviedb.org/3/");
            _httpClient.DefaultRequestHeaders.Accept.Clear();
            _httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            
            if (!string.IsNullOrWhiteSpace(_accessToken))
            {
                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _accessToken);
            }
        }

        private string BuildUrl(string path, Dictionary<string, string>? queryParams = null)
        {
            queryParams ??= new Dictionary<string, string>();
            
            // Add include_adult=false to ensure Google AdSense policy compliance
            if (!queryParams.ContainsKey("include_adult"))
            {
                queryParams.Add("include_adult", "false");
            }

            // Append api_key query param if Authorization header is not set
            if (string.IsNullOrWhiteSpace(_accessToken) && !string.IsNullOrWhiteSpace(_apiKey))
            {
                queryParams.Add("api_key", _apiKey);
            }

            var querySegments = queryParams.Select(kv => $"{kv.Key}={Uri.EscapeDataString(kv.Value)}");
            return $"{path}?{string.Join("&", querySegments)}";
        }

        public async Task<MovieDbConfiguration?> GetConfigurationAsync()
        {
            var cacheKey = "moviedb_config";
            if (_cache.TryGetValue(cacheKey, out MovieDbConfiguration? config) && config != null)
            {
                return config;
            }

            try
            {
                var url = BuildUrl("configuration");
                var response = await _httpClient.GetAsync(url);
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var fetchedConfig = JsonSerializer.Deserialize<MovieDbConfiguration>(content);
                    if (fetchedConfig != null)
                    {
                        _cache.Set(cacheKey, fetchedConfig, TimeSpan.FromDays(7));
                        return fetchedConfig;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting MovieDB Configuration");
            }

            return new MovieDbConfiguration();
        }

        public async Task<MovieDbListResponse> GetMoviesAsync(string listType, int page = 1, int? genreId = null)
        {
            var cacheKey = $"moviedb_movies_{listType}_{page}_{genreId ?? 0}";
            if (_cache.TryGetValue(cacheKey, out MovieDbListResponse? cachedResponse) && cachedResponse != null)
            {
                return cachedResponse;
            }

            try
            {
                string path = "movie/popular";
                var queryParams = new Dictionary<string, string> { { "page", page.ToString() } };

                if (genreId.HasValue)
                {
                    path = "discover/movie";
                    queryParams.Add("with_genres", genreId.Value.ToString());
                }
                else
                {
                    path = listType.ToLower() switch
                    {
                        "popular" => "movie/popular",
                        "top_rated" => "movie/top_rated",
                        "upcoming" => "movie/upcoming",
                        "now_playing" => "movie/now_playing",
                        "trending" => "trending/movie/week",
                        _ => "movie/popular"
                    };
                }

                var url = BuildUrl(path, queryParams);
                _logger.LogInformation("Fetching movies list from: {Url}", url);

                var response = await _httpClient.GetAsync(url);
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var listResponse = JsonSerializer.Deserialize<MovieDbListResponse>(content);
                    if (listResponse != null)
                    {
                        _cache.Set(cacheKey, listResponse, TimeSpan.FromMinutes(30));
                        return listResponse;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting MovieDB movies list");
            }

            return new MovieDbListResponse();
        }

        public async Task<MovieDbListResponse> SearchMoviesAsync(string query, int page = 1)
        {
            var cacheKey = $"moviedb_search_{query}_{page}";
            if (_cache.TryGetValue(cacheKey, out MovieDbListResponse? cachedResponse) && cachedResponse != null)
            {
                return cachedResponse;
            }

            try
            {
                var queryParams = new Dictionary<string, string>
                {
                    { "query", query },
                    { "page", page.ToString() }
                };

                var url = BuildUrl("search/movie", queryParams);
                _logger.LogInformation("Searching movies from: {Url}", url);

                var response = await _httpClient.GetAsync(url);
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var listResponse = JsonSerializer.Deserialize<MovieDbListResponse>(content);
                    if (listResponse != null)
                    {
                        _cache.Set(cacheKey, listResponse, TimeSpan.FromMinutes(15));
                        return listResponse;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching movies in MovieDB");
            }

            return new MovieDbListResponse();
        }

        public async Task<MovieDbDetails?> GetMovieDetailsAsync(int id)
        {
            var cacheKey = $"moviedb_details_{id}";
            if (_cache.TryGetValue(cacheKey, out MovieDbDetails? cachedDetails) && cachedDetails != null)
            {
                return cachedDetails;
            }

            try
            {
                // Fetch basic details
                var detailsUrl = BuildUrl($"movie/{id}");
                var response = await _httpClient.GetAsync(detailsUrl);
                if (!response.IsSuccessStatusCode)
                {
                    return null;
                }

                var content = await response.Content.ReadAsStringAsync();
                var details = JsonSerializer.Deserialize<MovieDbDetails>(content);

                if (details != null)
                {
                    // Fetch Credits, Videos, and Recommendations concurrently
                    var creditsTask = FetchAsync<MovieDbCredits>($"movie/{id}/credits");
                    var videosTask = FetchAsync<MovieDbVideosResponse>($"movie/{id}/videos");
                    var recommendationsTask = FetchAsync<MovieDbListResponse>($"movie/{id}/recommendations");

                    await Task.WhenAll(creditsTask, videosTask, recommendationsTask);

                    details.Credits = creditsTask.Result;
                    details.Videos = videosTask.Result;
                    details.Recommendations = recommendationsTask.Result?.Results ?? new List<MovieDbItem>();

                    _cache.Set(cacheKey, details, TimeSpan.FromHours(1));
                    return details;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting MovieDB details for movie {MovieId}", id);
            }

            return null;
        }

        private async Task<T?> FetchAsync<T>(string path) where T : class
        {
            try
            {
                var url = BuildUrl(path);
                var response = await _httpClient.GetAsync(url);
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    return JsonSerializer.Deserialize<T>(content);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed fetching sub-resource {Path} in MovieDB", path);
            }
            return null;
        }
    }
}
