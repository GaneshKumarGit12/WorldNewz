using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WorldNewzWebAPI.Data;
using WorldNewzWebAPI.Models;

namespace WorldNewzWebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FacebookSettingsController : ControllerBase
    {
        private readonly WorldNewsDbContext _context;
        private readonly HttpClient _httpClient;

        public FacebookSettingsController(WorldNewsDbContext context, HttpClient httpClient)
        {
            _context = context;
            _httpClient = httpClient;
        }

        // DTO to avoid exposing raw tokens in GET responses
        public class FacebookPageSettingDto
        {
            public string PageId { get; set; } = string.Empty;
            public string PageName { get; set; } = string.Empty;
            public string MaskedToken { get; set; } = string.Empty;
            public bool IsActive { get; set; }
            public DateTime? LastPostTime { get; set; }
        }

        public class FetchPagesRequest
        {
            public string UserAccessToken { get; set; } = string.Empty;
        }

        public class SavePageSettingsRequest
        {
            public string PageId { get; set; } = string.Empty;
            public string PageName { get; set; } = string.Empty;
            public string AccessToken { get; set; } = string.Empty;
            public bool IsActive { get; set; }
        }

        private static string MaskToken(string token)
        {
            if (string.IsNullOrEmpty(token)) return string.Empty;
            if (token.Length <= 8) return "********";
            return $"{token.Substring(0, 6)}...{token.Substring(token.Length - 5)}";
        }

        private static bool IsMasked(string token)
        {
            return !string.IsNullOrEmpty(token) && token.Contains("...");
        }

        [HttpGet]
        public async Task<IActionResult> GetSettings()
        {
            try
            {
                var settings = await _context.FacebookPageSettings.ToListAsync();
                var dtos = settings.Select(s => new FacebookPageSettingDto
                {
                    PageId = s.PageId,
                    PageName = s.PageName,
                    MaskedToken = MaskToken(s.AccessToken),
                    IsActive = s.IsActive,
                    LastPostTime = s.LastPostTime
                }).ToList();

                return Ok(dtos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to retrieve settings", details = ex.Message });
            }
        }

        [HttpPost("fetch-pages")]
        public async Task<IActionResult> FetchPages([FromBody] FetchPagesRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.UserAccessToken))
            {
                return BadRequest(new { error = "User Access Token is required" });
            }

            try
            {
                var url = $"https://graph.facebook.com/v20.0/me/accounts?access_token={request.UserAccessToken}&limit=100";
                var response = await _httpClient.GetAsync(url);
                var content = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    return BadRequest(new { error = "Facebook API returned an error", details = content });
                }

                using var doc = JsonDocument.Parse(content);
                var root = doc.RootElement;
                var pagesList = new List<object>();

                if (root.TryGetProperty("data", out var dataProp) && dataProp.ValueKind == JsonValueKind.Array)
                {
                    foreach (var element in dataProp.EnumerateArray())
                    {
                        var id = element.GetProperty("id").GetString() ?? "";
                        var name = element.GetProperty("name").GetString() ?? "";
                        var token = element.GetProperty("access_token").GetString() ?? "";
                        var category = element.TryGetProperty("category", out var catProp) ? catProp.GetString() : "";

                        pagesList.Add(new
                        {
                            pageId = id,
                            pageName = name,
                            accessToken = token,
                            maskedToken = MaskToken(token),
                            category = category
                        });
                    }
                }

                return Ok(pagesList);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to fetch pages from Facebook", details = ex.Message });
            }
        }

        [HttpPost("save")]
        public async Task<IActionResult> SaveSettings([FromBody] List<SavePageSettingsRequest> request)
        {
            if (request == null)
            {
                return BadRequest(new { error = "Invalid request payload" });
            }

            try
            {
                foreach (var item in request)
                {
                    if (string.IsNullOrWhiteSpace(item.PageId)) continue;

                    // Ensure PageId is strictly numeric (defense-in-depth)
                    if (!System.Text.RegularExpressions.Regex.IsMatch(item.PageId, @"^\d+$"))
                    {
                        return BadRequest(new { error = $"Invalid Facebook Page ID '{item.PageId}'. It must be numeric." });
                    }

                    // Sanitize PageName by stripping out any HTML tags
                    var sanitizedPageName = System.Text.RegularExpressions.Regex.Replace(item.PageName ?? "", @"<[^>]*>", "").Trim();

                    var existing = await _context.FacebookPageSettings.FindAsync(item.PageId);
                    var tokenToSave = item.AccessToken;

                    if (existing != null)
                    {
                        // If token is masked, retain the existing one
                        if (IsMasked(tokenToSave))
                        {
                            tokenToSave = existing.AccessToken;
                        }

                        existing.PageName = sanitizedPageName;
                        existing.AccessToken = tokenToSave;
                        existing.IsActive = item.IsActive;
                        _context.FacebookPageSettings.Update(existing);
                    }
                    else
                    {
                        // If it's a new page and the token is masked, that shouldn't happen unless they re-saved loaded data.
                        // But if they are importing, we expect the raw token from the fetch-pages result.
                        if (IsMasked(tokenToSave))
                        {
                            return BadRequest(new { error = $"Cannot save new page '{sanitizedPageName}' with a masked token. Please re-authenticate." });
                        }

                        var newSetting = new FacebookPageSetting
                        {
                            PageId = item.PageId,
                            PageName = sanitizedPageName,
                            AccessToken = tokenToSave,
                            IsActive = item.IsActive
                        };
                        await _context.FacebookPageSettings.AddAsync(newSetting);
                    }
                }

                await _context.SaveChangesAsync();
                return Ok(new { message = "Settings saved successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to save settings", details = ex.Message });
            }
        }

        [HttpPost("toggle/{pageId}")]
        public async Task<IActionResult> TogglePage(string pageId)
        {
            try
            {
                var page = await _context.FacebookPageSettings.FindAsync(pageId);
                if (page == null)
                {
                    return NotFound(new { error = "Page setting not found" });
                }

                page.IsActive = !page.IsActive;
                _context.FacebookPageSettings.Update(page);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Status toggled successfully", isActive = page.IsActive });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to toggle page status", details = ex.Message });
            }
        }

        [HttpDelete("{pageId}")]
        public async Task<IActionResult> DeletePage(string pageId)
        {
            try
            {
                var page = await _context.FacebookPageSettings.FindAsync(pageId);
                if (page == null)
                {
                    return NotFound(new { error = "Page setting not found" });
                }

                _context.FacebookPageSettings.Remove(page);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Page configuration deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to delete configuration", details = ex.Message });
            }
        }

        [HttpPost("test/{pageId}")]
        public async Task<IActionResult> TestPost(string pageId)
        {
            try
            {
                var page = await _context.FacebookPageSettings.FindAsync(pageId);
                if (page == null)
                {
                    return NotFound(new { error = "Page setting not found" });
                }

                var testArticle = new NewsArticle
                {
                    Title = "Test Integration Post from WorldNewz Dashboard",
                    Description = $"This is a verification post triggered from the admin dashboard on {DateTime.Now:yyyy-MM-dd HH:mm:ss} to confirm the dynamic posting workflow.",
                    Url = "https://worldnewzs.in"
                };

                // Perform direct API call to post just this test message to the page
                var message = $"{testArticle.Title}\n\n{testArticle.Description}";
                var postData = new
                {
                    message = message,
                    link = testArticle.Url,
                    access_token = page.AccessToken
                };

                var content = new StringContent(JsonSerializer.Serialize(postData), Encoding.UTF8, "application/json");
                var response = await _httpClient.PostAsync($"https://graph.facebook.com/v20.0/{page.PageId}/feed", content);
                var result = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    page.LastPostTime = DateTime.Now;
                    _context.FacebookPageSettings.Update(page);
                    await _context.SaveChangesAsync();

                    return Ok(new { message = "Test post successful! Check your Facebook Page timeline." });
                }
                else
                {
                    return BadRequest(new { error = "Failed to post to Facebook Page", details = result });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Exception during test post", details = ex.Message });
            }
        }
    }
}
