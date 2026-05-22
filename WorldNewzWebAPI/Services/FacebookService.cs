using System.Net.Http;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using WorldNewzWebAPI.Models;

namespace WorldNewzWebAPI.Services
{
    public class FacebookService
    {
        private readonly HttpClient _httpClient;
        private readonly string _pageId;
        private readonly string _accessToken;

        public FacebookService(HttpClient httpClient, IConfiguration config)
        {
            _httpClient = httpClient;
            // Read from env vars (DotNetEnv loads .env into config)
            _pageId = config["FACEBOOK_PAGE_ID"] ?? "";
            _accessToken = config["FACEBOOK_ACCESS_TOKEN"] ?? "";
        }

        public async Task PostSingleArticleAsync(NewsArticle article)
        {
            if (string.IsNullOrEmpty(_pageId) || string.IsNullOrEmpty(_accessToken))
            {
                Console.WriteLine("[FacebookService] Missing configuration. Skipping post.");
                return;
            }

            try
            {
                var message = $"{article.Title}\n\n{article.Description ?? ""}";
                
                // Optional: URL encode the article title or URL for the link query
                var linkUrl = "http://worldnewzs.in";

                var postData = new
                {
                    message = message,
                    link = linkUrl,
                    access_token = _accessToken
                };

                var content = new StringContent(JsonSerializer.Serialize(postData), Encoding.UTF8, "application/json");
                var response = await _httpClient.PostAsync($"https://graph.facebook.com/v20.0/{_pageId}/feed", content);

                if (response.IsSuccessStatusCode)
                {
                    Console.WriteLine($"[FacebookService] Successfully posted to Facebook: {article.Title}");
                }
                else
                {
                    var error = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"[FacebookService] Failed to post to Facebook. Status: {response.StatusCode}. Error: {error}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[FacebookService] Exception while posting: {ex.Message}");
            }
        }
    }
}
