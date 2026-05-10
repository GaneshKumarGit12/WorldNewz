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
            { "sports", "business", "technology", "health", "world", "entertainment", "science" };

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
            foreach (var category in CATEGORIES)
            {
                try
                {
                    await GenerateKeywordsAsync(category);
                    await Task.Delay(1000); // Rate limit courtesy
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
                throw new InvalidOperationException("GEMINI_API_KEY is not configured.");
            }

            var endpoint = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={apiKey}";

            var systemPrompt = "You are an expert SEO specialist for a news aggregator website. Always respond ONLY with valid JSON.";
            
            var userPrompt = $@"
Generate daily SEO keywords for the WorldNewz news website (world-newz.vercel.app)
for the '{category}' news category. Today is {DateTime.UtcNow:yyyy-MM-dd}.

Return a JSON object with exactly this structure:
{{
  ""primary"":   [""keyword1"", ""keyword2"", ""keyword3"", ""keyword4"", ""keyword5""],
  ""longtail"":  [""long tail phrase 1"", ""long tail phrase 2"", ""long tail phrase 3""],
  ""trending"":  [""trending topic 1"", ""trending topic 2"", ""trending topic 3""],
  ""metaDesc"":  ""A compelling 150-160 character meta description for the {category} news category page on WorldNewz, including the most important primary keyword naturally.""
}}

Rules:
- Primary: 5 high-volume, commercially relevant keywords for {category} news
- Long-tail: 3 specific phrases (4-6 words) with clear search intent
- Trending: 3 currently newsworthy topics in {category} (infer from today's date)
- Meta desc: 150-160 chars, include WorldNewz brand, action-oriented
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

            var response = await _http.PostAsJsonAsync(endpoint, payload);
            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                _log.LogError("Gemini API call failed: {StatusCode} - {Error}", response.StatusCode, error);
                throw new HttpRequestException($"Gemini API call failed with status code {response.StatusCode}");
            }

            var geminiResponse = await response.Content.ReadFromJsonAsync<JsonElement>();
            
            // Extract the text content from Gemini response
            // Structure: candidates[0].content.parts[0].text
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
    }
}
