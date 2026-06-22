using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using WorldNewzWebAPI.Data;
using WorldNewzWebAPI.Models;

namespace WorldNewzWebAPI.Services
{
    public class SeoKeywordService
    {
        private readonly HttpClient _http;
        private readonly IConfiguration _cfg;
        private readonly WorldNewsDbContext _db;
        private readonly ILogger<SeoKeywordService> _log;

        private static readonly string[] CATEGORIES =
        {
            "sports", "business", "technology", "health", "world", "entertainment", "science", 
            "services", "gaming", "cartoons", "stocks", "polls", "polls-history", "badge-quiz", "quiz-history",
            "politics", "science-health", "local-news", "weather", "shopping", "travel", "food", 
            "lifestyle", "education", "opinion", "trending", "podcasts-videos", "movies"
        };

        public SeoKeywordService(IHttpClientFactory factory, IConfiguration cfg,
            WorldNewsDbContext db, ILogger<SeoKeywordService> log)
        {
            _http = factory.CreateClient();
            _cfg = cfg;
            _db = db;
            _log = log;
        }

        // Called by background job daily
        public async Task RefreshAllKeywordsAsync()
        {
            var today = DateTime.UtcNow.Date;
            foreach (var category in CATEGORIES)
            {
                try
                {
                    // Performance optimization: check if already exists before calling Gemini
                    var existing = await _db.SeoKeywords
                        .AnyAsync(k => k.Category == category && k.Date == today);
                    
                    if (existing)
                    {
                        continue; // Skip instantly with zero delay
                    }

                    await GenerateKeywordsAsync(category);
                    await Task.Delay(4500); // Proactively avoid 15 RPM rate limit (60s / 15 = 4s)
                }
                catch (Exception ex)
                {
                    _log.LogError(ex, "Failed keyword generation for {Category}", category);
                }
            }
            _log.LogInformation("Daily keyword refresh complete for {Count} categories", CATEGORIES.Length);
        }

        public async Task<SeoKeyword> GenerateKeywordsAsync(string category)
        {
            var today = DateTime.UtcNow.Date;

            // Skip if already generated today
            var existing = await _db.SeoKeywords
                .FirstOrDefaultAsync(k => k.Category == category && k.Date == today);
            if (existing != null) return existing;

            var apiKey = _cfg["GEMINI_API_KEY"] ?? Environment.GetEnvironmentVariable("GEMINI_API_KEY");
            if (string.IsNullOrEmpty(apiKey))
            {
                _log.LogWarning("GEMINI_API_KEY is not configured. Falling back to default keywords for '{Category}'.", category);
                var fallback = GetFallbackKeywords(category, today);
                _db.SeoKeywords.Add(fallback);
                await _db.SaveChangesAsync();
                return fallback;
            }

            var endpoint = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={apiKey}";

            var systemPrompt = "You are an expert SEO specialist for a news aggregator website. Always respond ONLY with valid JSON.";
            
            var userPrompt = $@"
Generate daily SEO keywords for the WorldNewzs news website (worldnewzs.in)
for the '{category}' news category. Today is {DateTime.UtcNow:yyyy-MM-dd}.

Return a JSON object with exactly this structure:
{{
  ""primary"":   [""keyword1"", ""keyword2"", ""keyword3"", ""keyword4"", ""keyword5""],
  ""longtail"":  [""long tail phrase 1"", ""long tail phrase 2"", ""long tail phrase 3""],
  ""trending"":  [""trending topic 1"", ""trending topic 2"", ""trending topic 3""],
  ""metaDesc"":  ""A compelling 150-160 character meta description for the {category} news category page on WorldNewzs, including the most important primary keyword naturally.""
}}

Rules:
- Primary: 5 high-volume, commercially relevant keywords for {category} news
- Long-tail: 3 specific phrases (4-6 words) with clear search intent
- Trending: 3 currently newsworthy topics in {category} (infer from today's date)
- Meta desc: 150-160 chars, include WorldNewzs brand, action-oriented
- Keywords must be varied, not repetitive
";

            var payload = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new[]
                        {
                            new { text = systemPrompt + "\n\n" + userPrompt }
                        }
                    }
                },
                generationConfig = new
                {
                    responseMimeType = "application/json"
                }
            };

            HttpResponseMessage? response = null;
            int maxRetries = 4;
            int delaySeconds = 6;

            try
            {
                for (int attempt = 1; attempt <= maxRetries; attempt++)
                {
                    response = await _http.PostAsJsonAsync(endpoint, payload);
                    if (response.IsSuccessStatusCode)
                    {
                        break;
                    }

                    if (response.StatusCode == System.Net.HttpStatusCode.TooManyRequests) // 429
                    {
                        _log.LogWarning("Gemini API rate limit hit (429) on attempt {Attempt} for category '{Category}'. Retrying in {Delay}s...", attempt, category, delaySeconds);
                        await Task.Delay(TimeSpan.FromSeconds(delaySeconds));
                        delaySeconds *= 2; // Exponential backoff
                    }
                    else
                    {
                        var error = await response.Content.ReadAsStringAsync();
                        _log.LogError("Gemini API call failed: {StatusCode} - {Error}", response.StatusCode, error);
                        throw new HttpRequestException($"Gemini API call failed with status code {response.StatusCode}");
                    }
                }

                if (response == null || !response.IsSuccessStatusCode)
                {
                    var error = response != null ? await response.Content.ReadAsStringAsync() : "No response";
                    _log.LogError("Gemini API call failed after retries: {Error}", error);
                    throw new HttpRequestException($"Gemini API call failed after max retries.");
                }

                var geminiResponse = await response.Content.ReadFromJsonAsync<JsonElement>();
                
                // Extract the text content from Gemini response
                var candidates = geminiResponse.GetProperty("candidates");
                var content = candidates[0].GetProperty("content");
                var parts = content.GetProperty("parts");
                var rawJson = parts[0].GetProperty("text").GetString();

                if (string.IsNullOrEmpty(rawJson))
                {
                    throw new InvalidOperationException("Gemini returned empty response.");
                }

                var parsed = JsonDocument.Parse(rawJson).RootElement;

                var record = new SeoKeyword
                {
                    Category = category,
                    Date = today,
                    Primary = parsed.GetProperty("primary").GetRawText(),
                    Longtail = parsed.GetProperty("longtail").GetRawText(),
                    Trending = parsed.GetProperty("trending").GetRawText(),
                    MetaDesc = parsed.GetProperty("metaDesc").GetString() ?? string.Empty
                };

                _db.SeoKeywords.Add(record);
                await _db.SaveChangesAsync();

                _log.LogInformation("Keywords generated for {Category} on {Date}", category, today);
                return record;
            }
            catch (Exception ex)
            {
                _log.LogError(ex, "Failed to call Gemini API for keywords. Using fallback keywords for category '{Category}'.", category);
                var fallback = GetFallbackKeywords(category, today);
                
                // Cache the fallback so we don't hammer the failing API
                _db.SeoKeywords.Add(fallback);
                await _db.SaveChangesAsync();
                
                return fallback;
            }
        }

        private SeoKeyword GetFallbackKeywords(string category, DateTime today)
        {
            var p = new[] { $"{category} news", $"{category} updates", $"latest {category}", $"trending {category}", $"{category} articles" };
            var l = new[] { $"best online {category} updates today", $"read latest {category} reviews", $"trending global {category} reports" };
            var t = new[] { $"recent {category} changes", $"{category} hot topics", $"new {category} releases" };
            var desc = $"Stay updated with the latest {category} news, reviews, and trending stories from around the globe on WorldNewzs.";

            if (category.ToLower() == "shopping")
            {
                p = new[] { "online shopping deals", "amazon discount offers", "best shopping sales", "india deals of the day", "e-commerce coupons" };
                l = new[] { "best online shopping deals in india", "amazon india lightning discount offers", "trending coupons and cashbacks today" };
                t = new[] { "amazon sale promotions", "smartwatch lightning discounts", "budget smartphone deals" };
                desc = "Shop the best deals and daily discounts online. Save money on electronics, fashion, smartwatches, and home appliances on WorldNewzs.";
            }

            return new SeoKeyword
            {
                Category = category,
                Date = today,
                Primary = JsonSerializer.Serialize(p),
                Longtail = JsonSerializer.Serialize(l),
                Trending = JsonSerializer.Serialize(t),
                MetaDesc = desc
            };
        }
    }
}
