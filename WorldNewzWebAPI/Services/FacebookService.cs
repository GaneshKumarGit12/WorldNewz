using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using WorldNewzWebAPI.Data;
using WorldNewzWebAPI.Models;

namespace WorldNewzWebAPI.Services
{
    public class FacebookService
    {
        private readonly HttpClient _httpClient;
        private readonly WorldNewsDbContext _context;
        private readonly IConfiguration _config;

        public FacebookService(HttpClient httpClient, WorldNewsDbContext context, IConfiguration config)
        {
            _httpClient = httpClient;
            _context = context;
            _config = config;
        }

        public async Task PostSingleArticleAsync(NewsArticle article)
        {
            List<FacebookPageSetting> activePages;
            try
            {
                activePages = await _context.FacebookPageSettings.Where(p => p.IsActive).ToListAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[FacebookService] Error querying Facebook page settings: {ex.Message}");
                activePages = new List<FacebookPageSetting>();
            }

            // Fallback to .env settings if database is empty
            if (activePages.Count == 0)
            {
                var envPageId = _config["FACEBOOK_PAGE_ID"];
                var envToken = _config["FACEBOOK_ACCESS_TOKEN"];

                if (!string.IsNullOrEmpty(envPageId) && !string.IsNullOrEmpty(envToken))
                {
                    Console.WriteLine("[FacebookService] No active pages in database. Using fallback from config.");
                    activePages.Add(new FacebookPageSetting
                    {
                        PageId = envPageId,
                        PageName = "Fallback Page",
                        AccessToken = envToken,
                        IsActive = true
                    });
                }
            }

            if (activePages.Count == 0)
            {
                Console.WriteLine("[FacebookService] No active Facebook pages configured. Skipping post.");
                return;
            }

            foreach (var page in activePages)
            {
                try
                {
                    var message = $"{article.Title}\n\n{article.Description ?? ""}";
                    var linkUrl = "https://worldnewzs.in";

                    var postData = new
                    {
                        message = message,
                        link = linkUrl,
                        access_token = page.AccessToken
                    };

                    var content = new StringContent(JsonSerializer.Serialize(postData), Encoding.UTF8, "application/json");
                    var response = await _httpClient.PostAsync($"https://graph.facebook.com/v20.0/{page.PageId}/feed", content);

                    if (response.IsSuccessStatusCode)
                    {
                        Console.WriteLine($"[FacebookService] Successfully posted to page '{page.PageName}' ({page.PageId}): {article.Title}");
                        
                        // Update LastPostTime in DB for non-fallback pages
                        if (page.PageId != _config["FACEBOOK_PAGE_ID"])
                        {
                            var dbPageSetting = await _context.FacebookPageSettings.FindAsync(page.PageId);
                            if (dbPageSetting != null)
                            {
                                dbPageSetting.LastPostTime = DateTime.Now;
                                await _context.SaveChangesAsync();
                            }
                        }
                    }
                    else
                    {
                        var error = await response.Content.ReadAsStringAsync();
                        Console.WriteLine($"[FacebookService] Failed to post to page '{page.PageName}'. Status: {response.StatusCode}. Error: {error}");
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[FacebookService] Exception while posting to page '{page.PageName}': {ex.Message}");
                }
            }
        }
    }
}
