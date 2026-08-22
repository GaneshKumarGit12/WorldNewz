using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using WorldNewzWebAPI.Services;

namespace WorldNewzWebAPI.Controllers
{
    [ApiController]
    [Route("api/podcasts-videos")]
    public class PodcastsVideosController : ControllerBase
    {
        private readonly PodcastVideoService _podcastVideoService;

        public PodcastsVideosController(PodcastVideoService podcastVideoService)
        {
            _podcastVideoService = podcastVideoService;
        }

        [HttpGet("feed")]
        public async Task<IActionResult> GetFeed([FromQuery] string? category)
        {
            try
            {
                var feed = await _podcastVideoService.GetPodcastsVideosFeedAsync(category);
                Response.Headers.CacheControl = "public, max-age=900";
                return Ok(feed);
            }
            catch (Exception)
            {
                return Ok(PodcastVideoService.GetFallbackFeed(category ?? "All"));
            }
        }
    }
}
