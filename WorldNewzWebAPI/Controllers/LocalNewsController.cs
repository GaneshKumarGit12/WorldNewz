using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using WorldNewzWebAPI.Services;

namespace WorldNewzWebAPI.Controllers
{
    [ApiController]
    [Route("api/news")]
    public class LocalNewsController : ControllerBase
    {
        private readonly IGNewsService _gnewsService;

        public LocalNewsController(IGNewsService gnewsService)
        {
            _gnewsService = gnewsService;
        }

        [HttpGet("gnews-headlines")]
        public async Task<IActionResult> GetGNewsHeadlines([FromQuery] string country = "in")
        {
            if (string.IsNullOrWhiteSpace(country)) country = "in";
            
            try
            {
                var articles = await _gnewsService.GetTopHeadlinesAsync(country);
                return Ok(new
                {
                    status = "ok",
                    totalResults = articles.Count,
                    articles = articles
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to retrieve top headlines", details = ex.Message });
            }
        }

        [HttpGet("gnews-more")]
        public async Task<IActionResult> GetGNewsMore([FromQuery] string country = "in", [FromQuery] int page = 1)
        {
            if (string.IsNullOrWhiteSpace(country)) country = "in";
            if (page < 1) page = 1;

            try
            {
                var articles = await _gnewsService.GetMoreLocalNewsAsync(country, page);
                return Ok(new
                {
                    status = "ok",
                    totalResults = articles.Count,
                    articles = articles
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to retrieve more local news", details = ex.Message });
            }
        }
    }
}
