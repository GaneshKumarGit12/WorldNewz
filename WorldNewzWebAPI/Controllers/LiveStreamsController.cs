using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using WorldNewzWebAPI.Services;

namespace WorldNewzWebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LiveStreamsController : ControllerBase
    {
        private readonly LiveStreamService _liveStreamService;

        public LiveStreamsController(LiveStreamService liveStreamService)
        {
            _liveStreamService = liveStreamService;
        }

        [HttpGet]
        public async Task<IActionResult> GetLiveStream([FromQuery] string? category)
        {
            var stream = await _liveStreamService.GetLiveStreamAsync(category);
            return Ok(new
            {
                status = "success",
                data = stream
            });
        }
    }
}
