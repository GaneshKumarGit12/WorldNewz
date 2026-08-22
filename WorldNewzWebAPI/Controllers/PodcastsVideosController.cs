using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using WorldNewzWebAPI.Services;

namespace WorldNewzWebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Route("api/podcasts-videos")]
    [Route("api/podcastsvideos")]
    [Route("api/news/podcasts-videos")]
    public class PodcastsVideosController : ControllerBase
    {
        private readonly PodcastVideoService _podcastVideoService;

        public PodcastsVideosController(PodcastVideoService podcastVideoService)
        {
            _podcastVideoService = podcastVideoService;
        }

        [HttpGet]
        [HttpGet("feed")]
        [HttpGet("/api/podcasts-videos/feed")]
        [HttpGet("/api/podcastsvideos/feed")]
        [HttpGet("/api/podcasts-videos")]
        [HttpGet("/api/podcastsvideos")]
        public async Task<IActionResult> GetPodcastsVideosFeed([FromQuery] string? category)
        {
            try
            {
                var feed = await _podcastVideoService.GetPodcastsVideosFeedAsync(category);
                Response.Headers.CacheControl = "public, max-age=900";
                return Ok(feed);
            }
            catch (Exception)
            {
                // Fallback guarantee: Never return 500 error, return clean category feed
                var fallback = PodcastVideoService.GetFallbackFeed(category ?? "All");
                return Ok(fallback);
            }
        }
    }
}
