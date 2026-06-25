using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using WorldNewzWebAPI.Services;

namespace WorldNewzWebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ShortVideosController : ControllerBase
    {
        private readonly ShortVideoService _shortVideoService;

        public ShortVideosController(ShortVideoService shortVideoService)
        {
            _shortVideoService = shortVideoService;
        }

        [HttpGet]
        public async Task<IActionResult> GetTrendingShortVideos()
        {
            var videos = await _shortVideoService.GetTrendingShortVideosAsync();
            return Ok(new
            {
                status = "success",
                totalResults = videos.Count,
                videos = videos
            });
        }
    }
}
