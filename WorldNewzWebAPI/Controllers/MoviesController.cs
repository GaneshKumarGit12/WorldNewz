using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using WorldNewzWebAPI.Services;

namespace WorldNewzWebAPI.Controllers
{
    [ApiController]
    [Route("api/movies")]
    public class MoviesController : ControllerBase
    {
        private readonly IMovieDbService _movieDbService;

        public MoviesController(IMovieDbService movieDbService)
        {
            _movieDbService = movieDbService;
        }

        [HttpGet("browse")]
        public async Task<IActionResult> BrowseMovies(
            [FromQuery] string? type,
            [FromQuery] int page = 1,
            [FromQuery] int? genre = null)
        {
            var listType = type ?? "trending";
            var movies = await _movieDbService.GetMoviesAsync(listType, page, genre);
            return Ok(movies);
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchMovies(
            [FromQuery] string query,
            [FromQuery] int page = 1)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return BadRequest(new { error = "Search query is required." });
            }

            var movies = await _movieDbService.SearchMoviesAsync(query, page);
            return Ok(movies);
        }

        [HttpGet("movie/{id}")]
        public async Task<IActionResult> GetMovieDetails(int id)
        {
            var movie = await _movieDbService.GetMovieDetailsAsync(id);
            if (movie == null)
            {
                return NotFound(new { error = $"Movie with ID {id} not found." });
            }
            return Ok(movie);
        }

        [HttpGet("config")]
        public async Task<IActionResult> GetConfiguration()
        {
            var config = await _movieDbService.GetConfigurationAsync();
            return Ok(config);
        }
    }
}
