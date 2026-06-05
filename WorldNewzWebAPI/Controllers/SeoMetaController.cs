using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using WorldNewzWebAPI.Data;
using WorldNewzWebAPI.Models;
using WorldNewzWebAPI.Services;

namespace WorldNewzWebAPI.Controllers
{
    [ApiController]
    [Route("api/seo")]
    public class SeoMetaController : ControllerBase
    {
        private readonly WorldNewsDbContext _db;
        private readonly SeoKeywordService _keywords;
        private readonly IMemoryCache _cache;
        private readonly ILogger<SeoMetaController> _log;

        public SeoMetaController(WorldNewsDbContext db, SeoKeywordService kw, IMemoryCache cache, ILogger<SeoMetaController> log)
        {
            _db = db;
            _keywords = kw;
            _cache = cache;
            _log = log;
        }

        [HttpGet("keywords/{category}")]
        [ResponseCache(Duration = 3600)]
        public async Task<IActionResult> GetKeywords(string category)
        {
            var key = $"keywords_{category}";
            if (_cache.TryGetValue(key, out var cached)) return Ok(cached);

            var today = DateTime.UtcNow.Date;
            var keywords = await _db.SeoKeywords
                .Where(k => k.Category == category.ToLower() && k.Date == today)
                .FirstOrDefaultAsync();

            if (keywords == null)
            {
                _log.LogInformation("Keywords not found for {Category} on {Date}. Triggering generation.", category, today);
                try
                {
                    keywords = await _keywords.GenerateKeywordsAsync(category.ToLower());
                }
                catch (Exception ex)
                {
                    _log.LogError(ex, "Failed to generate keywords on demand for {Category}", category);
                    return StatusCode(500, new { error = "Failed to generate keywords", details = ex.Message });
                }
            }

            _cache.Set(key, keywords, TimeSpan.FromHours(1));
            Response.Headers.CacheControl = "public, max-age=3600";
            return Ok(keywords);
        }

        [HttpGet("keywords/all")]
        [ResponseCache(Duration = 3600)]
        public async Task<IActionResult> GetAllKeywords()
        {
            var today = DateTime.UtcNow.Date;
            var all = await _db.SeoKeywords
                .Where(k => k.Date == today)
                .ToListAsync();
            Response.Headers.CacheControl = "public, max-age=3600";
            return Ok(all);
        }
    }
}
