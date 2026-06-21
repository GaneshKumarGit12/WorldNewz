using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using WorldNewzWebAPI.Services;

namespace WorldNewzWebAPI.Controllers
{
    [ApiController]
    [Route("api/gaming")]
    public class GamingController : ControllerBase
    {
        private readonly IFreeToGameService _freeToGameService;

        public GamingController(IFreeToGameService freeToGameService)
        {
            _freeToGameService = freeToGameService;
        }

        [HttpGet("games")]
        public async Task<IActionResult> GetGames(
            [FromQuery] string? platform,
            [FromQuery] string? category,
            [FromQuery(Name = "sort-by")] string? sortBy)
        {
            var games = await _freeToGameService.GetGamesAsync(platform, category, sortBy);
            return Ok(games);
        }

        [HttpGet("game")]
        public async Task<IActionResult> GetGameDetails([FromQuery] int id)
        {
            var game = await _freeToGameService.GetGameDetailsAsync(id);
            if (game == null)
            {
                return NotFound(new { error = $"Game with ID {id} not found" });
            }
            return Ok(game);
        }

        [HttpGet("filter")]
        public async Task<IActionResult> FilterGames(
            [FromQuery] string tag,
            [FromQuery] string? platform,
            [FromQuery] string? sort)
        {
            if (string.IsNullOrWhiteSpace(tag))
            {
                return BadRequest(new { error = "The 'tag' parameter is required for filtering." });
            }

            var games = await _freeToGameService.FilterGamesAsync(tag, platform, sort);
            return Ok(games);
        }
    }
}
