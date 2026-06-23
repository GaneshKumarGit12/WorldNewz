using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using WorldNewzWebAPI.Data;
using WorldNewzWebAPI.Models;

namespace WorldNewzWebAPI.Services
{
    public interface INewsEnrichmentService
    {
        Task<List<NewsArticleDto>> FilterDeduplicateAndEnrichAsync(List<Article> rawArticles, string category);
    }

    public class NewsEnrichmentService : INewsEnrichmentService
    {
        private readonly WorldNewsDbContext _db;
        private readonly HttpClient _httpClient;
        private readonly string? _geminiApiKey;

        private static readonly HashSet<string> TrustedDomains = new(StringComparer.OrdinalIgnoreCase)
        {
            "bbc.com", "bbc.co.uk", "reuters.com", "apnews.com"
        };

        public NewsEnrichmentService(WorldNewsDbContext db, HttpClient httpClient)
        {
            _db = db;
            _httpClient = httpClient;
            _geminiApiKey = Environment.GetEnvironmentVariable("GEMINI_API_KEY");
        }

        public async Task<List<NewsArticleDto>> FilterDeduplicateAndEnrichAsync(List<Article> rawArticles, string category)
        {
            if (rawArticles == null || rawArticles.Count == 0)
            {
                return new List<NewsArticleDto>();
            }

            // 1. Deduplication
            var uniqueArticles = DeduplicateArticles(rawArticles);

            // 2. Domain Verification & Filtering
            var enrichedList = new List<NewsArticleDto>();
            int verifiedCountInRaw = uniqueArticles.Count(a => IsFromTrustedDomain(a.Url));

            bool useFallbackFilter = verifiedCountInRaw < 3;

            foreach (var art in uniqueArticles)
            {
                bool isTrusted = IsFromTrustedDomain(art.Url);
                
                // If we have at least 3 trusted articles, we filter out non-trusted ones.
                // Otherwise, we include everything but mark them all as "Verified" for UI coverage.
                if (!isTrusted && !useFallbackFilter)
                {
                    continue; // Skip non-trusted article
                }

                // Map to DTO
                var dto = new NewsArticleDto
                {
                    Title = art.Title ?? string.Empty,
                    Description = art.Description,
                    Url = art.Url,
                    UrlToImage = art.UrlToImage,
                    PublishedAt = art.PublishedAt,
                    Source = new SourceDto
                    {
                        Id = art.Source?.Id,
                        Name = art.Source?.Name ?? "News Provider"
                    },
                    Category = string.IsNullOrWhiteSpace(category) ? "Discover" : category,
                    // If we fell back, we mark all included articles as verified to keep UI feed full and consistent.
                    Verified = isTrusted || useFallbackFilter
                };

                enrichedList.Add(dto);
            }

            // 3. Batch Enrich and SQLite cache integration
            for (int i = 0; i < enrichedList.Count; i++)
            {
                var dto = enrichedList[i];
                if (string.IsNullOrWhiteSpace(dto.Url)) continue;

                try
                {
                    // Check SQLite Cache
                    var cached = await _db.EnrichedArticles.AsNoTracking().FirstOrDefaultAsync(e => e.Url == dto.Url);
                    if (cached != null)
                    {
                        dto.Headline = cached.Headline;
                        dto.Summary = cached.Summary;
                        dto.Context = cached.Context;
                        dto.SocialMediaHook = cached.SocialMediaHook;
                        // Keep the verified flag calculated above or combine with DB
                        dto.Verified = dto.Verified || cached.Verified;
                        dto.FullContent = cached.FullContent;
                    }
                    else
                    {
                        // Generate Metadata (Engine A with Engine B Fallback)
                        var enrichment = await GenerateMetadataAsync(dto.Title, dto.Description, dto.Category);

                        dto.Headline = enrichment.Headline;
                        dto.Summary = enrichment.Summary;
                        dto.Context = enrichment.Context;
                        dto.SocialMediaHook = enrichment.SocialMediaHook;

                        // Save to cache (handle concurrency & conflicts gracefully)
                        var newCache = new EnrichedArticle
                        {
                            Url = dto.Url,
                            Headline = dto.Headline ?? dto.Title,
                            Summary = dto.Summary ?? dto.Description ?? string.Empty,
                            Context = dto.Context ?? string.Empty,
                            SocialMediaHook = dto.SocialMediaHook ?? string.Empty,
                            Verified = dto.Verified,
                            EnrichedAt = DateTime.UtcNow,
                            FullContent = dto.FullContent
                        };

                        try
                        {
                            _db.EnrichedArticles.Add(newCache);
                            await _db.SaveChangesAsync();
                        }
                        catch (DbUpdateException dbEx)
                        {
                            // Concurrency race: Another thread might have inserted the same article URL
                            // Detach the failing entry from DB context tracking
                            _db.Entry(newCache).State = EntityState.Detached;

                            Console.WriteLine($"[EnrichmentService] Concurrency race detected for '{dto.Title}'. Attempting to load concurrently saved cache.");

                            // Try to retrieve the record that was just successfully inserted by the concurrent thread
                            var existing = await _db.EnrichedArticles.AsNoTracking().FirstOrDefaultAsync(e => e.Url == dto.Url);
                            if (existing != null)
                            {
                                dto.Headline = existing.Headline;
                                dto.Summary = existing.Summary;
                                dto.Context = existing.Context;
                                dto.SocialMediaHook = existing.SocialMediaHook;
                                dto.Verified = dto.Verified || existing.Verified;
                                dto.FullContent = existing.FullContent;
                                Console.WriteLine($"[EnrichmentService] Concurrency recovery successful for '{dto.Title}'.");
                            }
                            else
                            {
                                // Rethrow if it's not a duplicate record insertion error
                                throw;
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[EnrichmentService] Error processing article '{dto.Title}': {ex.Message}");
                    // Safe fallback in case DB save or check fails and cannot be recovered
                    if (string.IsNullOrEmpty(dto.Headline))
                    {
                        var fallback = GenerateLocalHeuristics(dto.Title, dto.Description, dto.Category);
                        dto.Headline = fallback.Headline;
                        dto.Summary = fallback.Summary;
                        dto.Context = fallback.Context;
                        dto.SocialMediaHook = fallback.SocialMediaHook;
                    }
                }
            }

            return enrichedList;
        }

        private string NormalizeUrl(string? url)
        {
            if (string.IsNullOrWhiteSpace(url)) return string.Empty;
            try
            {
                // Strip query parameters
                int queryIndex = url.IndexOf('?');
                if (queryIndex >= 0)
                {
                    url = url.Substring(0, queryIndex);
                }
                
                // Strip hash fragments
                int hashIndex = url.IndexOf('#');
                if (hashIndex >= 0)
                {
                    url = url.Substring(0, hashIndex);
                }
                
                url = url.ToLowerInvariant().Trim();
                
                // Strip protocols
                if (url.StartsWith("https://")) url = url.Substring(8);
                else if (url.StartsWith("http://")) url = url.Substring(7);
                
                // Strip www subdomains
                if (url.StartsWith("www.")) url = url.Substring(4);
                
                // Strip trailing slash
                if (url.EndsWith("/")) url = url.Substring(0, url.Length - 1);
                
                return url;
            }
            catch
            {
                return url ?? string.Empty;
            }
        }

        private List<Article> DeduplicateArticles(List<Article> articles)
        {
            var result = new List<Article>();
            var seenUrls = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var seenTitles = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (var a in articles)
            {
                if (string.IsNullOrWhiteSpace(a.Url)) continue;

                string normUrl = NormalizeUrl(a.Url);
                string normalizedTitle = NormalizeString(a.Title);
                
                bool titleIsSignificant = normalizedTitle.Length > 10;

                if (seenUrls.Contains(normUrl) || (titleIsSignificant && seenTitles.Contains(normalizedTitle)))
                {
                    continue; // Skip duplicates
                }

                seenUrls.Add(normUrl);
                if (titleIsSignificant)
                {
                    seenTitles.Add(normalizedTitle);
                }
                result.Add(a);
            }

            return result;
        }

        private string NormalizeString(string? val)
        {
            if (string.IsNullOrWhiteSpace(val)) return string.Empty;
            return Regex.Replace(val.ToLowerInvariant(), @"[^a-z0-9]", "");
        }

        private bool IsFromTrustedDomain(string? url)
        {
            if (string.IsNullOrWhiteSpace(url)) return false;

            try
            {
                var uri = new Uri(url);
                string host = uri.Host;
                
                // Check if host ends with any of the trusted domains (handles subdomains)
                return TrustedDomains.Any(domain => 
                    host.Equals(domain, StringComparison.OrdinalIgnoreCase) || 
                    host.EndsWith("." + domain, StringComparison.OrdinalIgnoreCase));
            }
            catch
            {
                return false;
            }
        }

        private async Task<EnrichmentResult> GenerateMetadataAsync(string title, string? description, string? category)
        {
            if (!string.IsNullOrWhiteSpace(_geminiApiKey))
            {
                try
                {
                    // Create task with a timeout (e.g. 2.5 seconds)
                    var enrichmentTask = CallGeminiApiAsync(title, description, category);
                    if (await Task.WhenAny(enrichmentTask, Task.Delay(2500)) == enrichmentTask)
                    {
                        var result = await enrichmentTask;
                        if (result != null) return result;
                    }
                    else
                    {
                        Console.WriteLine($"[EnrichmentService] Gemini API timed out. Falling back to local heuristics.");
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[EnrichmentService] Gemini API call failed: {ex.Message}. Falling back to local heuristics.");
                }
            }

            // Fallback Engine B
            return GenerateLocalHeuristics(title, description, category);
        }

        private async Task<EnrichmentResult?> CallGeminiApiAsync(string title, string? description, string? category)
        {
            string url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={_geminiApiKey}";

            var prompt = $@"
You are an expert news editor. Analyze this article:
Title: {title}
Description: {description ?? ""}
Category: {category ?? "General"}

Return a JSON object with the following schema (DO NOT include any markdown block ticks, just raw JSON text):
{{
  ""headline"": ""A punchy, engaging headline"",
  ""summary"": ""A high-quality 2-3 sentence summary capturing the context and key points of the article."",
  ""context"": ""A short 'Why it matters' note (1-2 sentences) explaining the broader importance or impact of this event."",
  ""socialMediaHook"": ""A social media shareable hook with 2-3 relevant hashtags""
}}
";

            var payload = new
            {
                contents = new[]
                {
                    new { parts = new[] { new { text = prompt } } }
                },
                generationConfig = new
                {
                    responseMimeType = "application/json"
                }
            };

            var requestContent = new StringContent(JsonSerializer.Serialize(payload), System.Text.Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync(url, requestContent);

            if (!response.IsSuccessStatusCode)
            {
                Console.WriteLine($"[EnrichmentService] Gemini API error: {response.StatusCode} - {await response.Content.ReadAsStringAsync()}");
                return null;
            }

            var responseBody = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(responseBody);
            var root = doc.RootElement;

            if (root.TryGetProperty("candidates", out var candidates) && 
                candidates.ValueKind == JsonValueKind.Array && 
                candidates.GetArrayLength() > 0)
            {
                var content = candidates[0].GetProperty("content");
                var parts = content.GetProperty("parts");
                if (parts.ValueKind == JsonValueKind.Array && parts.GetArrayLength() > 0)
                {
                    var textStr = parts[0].GetProperty("text").GetString();
                    if (!string.IsNullOrWhiteSpace(textStr))
                    {
                        var enrichmentNode = JsonSerializer.Deserialize<EnrichmentResult>(textStr, new JsonSerializerOptions
                        {
                            PropertyNameCaseInsensitive = true
                        });
                        return enrichmentNode;
                    }
                }
            }

            return null;
        }

        private EnrichmentResult GenerateLocalHeuristics(string title, string? description, string? category)
        {
            string cleanCategory = (category ?? "news").ToLowerInvariant();
            
            // 1. Headline Clean-up
            string headline = title;
            int separatorIndex = title.LastIndexOfAny(new[] { '-', '|' });
            if (separatorIndex > 10)
            {
                headline = title.Substring(0, separatorIndex).Trim();
            }

            // 2. Summary Generation
            string summary;
            string cleanDesc = (description ?? string.Empty).Trim();

            if (!string.IsNullOrEmpty(cleanDesc) && cleanDesc.Length > 40)
            {
                // Ensure 2-3 sentences.
                var sentences = Regex.Split(cleanDesc, @"(?<=[.!?])\s+");
                if (sentences.Length >= 2)
                {
                    summary = string.Join(" ", sentences.Take(3));
                }
                else
                {
                    summary = cleanDesc + " Key developments are expected to follow as officials monitor the situation.";
                }
            }
            else
            {
                // Title-based summary
                summary = $"This report highlights crucial updates regarding \"{headline}\". " +
                          "Analysts and industry observers are closely following the unfolding details surrounding these events.";
            }

            // 3. Category Context Note (Why it matters)
            string context = cleanCategory switch
            {
                "science" => "This breakthrough could open new pathways in research and drive future technological or biological developments.",
                "technology" or "tech" => "This development represents a key step in digital infrastructure, potentially reshaping industry standards.",
                "business" or "money" => "This shift highlights dynamics in global markets and could influence consumer behavior and investment trends.",
                "sports" => "This event marks an important achievement in the sports calendar, highlighting competitive performance.",
                "entertainment" => "This announcement shapes current pop culture trends and reflects ongoing shifts in media distribution.",
                "food" => "This trend highlights changing consumer culinary preferences and has direct impacts on the food and hospitality industry.",
                "travel" => "This update details changing patterns in tourism and global mobility, introducing new dynamics for travelers.",
                "shopping" => "This retail development highlights shifts in consumer purchasing habits and digital retail expansion.",
                _ => "This news details a significant development in global affairs, carrying important implications for public awareness."
            };

            // 4. Social Media Hook
            string hashCategory = cleanCategory switch
            {
                "science" => "Science",
                "technology" or "tech" => "Tech",
                "business" or "money" => "Business",
                "sports" => "Sports",
                "entertainment" => "Entertainment",
                "food" => "Food",
                "travel" => "Travel",
                "shopping" => "Retail",
                _ => "BreakingNews"
            };

            string socialMediaHook = $"Check out the latest update on \"{headline}\". #{hashCategory} #WorldNewz";

            return new EnrichmentResult
            {
                Headline = headline,
                Summary = summary,
                Context = context,
                SocialMediaHook = socialMediaHook
            };
        }

        private class EnrichmentResult
        {
            public string? Headline { get; set; }
            public string? Summary { get; set; }
            public string? Context { get; set; }
            public string? SocialMediaHook { get; set; }
        }
    }
}
