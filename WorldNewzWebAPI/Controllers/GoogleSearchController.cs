using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using WorldNewzWebAPI.Services;

namespace WorldNewzWebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GoogleSearchController : ControllerBase
    {
        private readonly IGoogleSearchService _googleSearchService;

        public GoogleSearchController(IGoogleSearchService googleSearchService)
        {
            _googleSearchService = googleSearchService;
        }

        [HttpGet]
        public async Task<IActionResult> Search([FromQuery] string? q)
        {
            if (string.IsNullOrWhiteSpace(q))
            {
                return BadRequest(new { error = "Search query is required." });
            }

            try
            {
                var results = await _googleSearchService.SearchAsync(q);
                return Ok(results);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[GoogleSearchController] Error: {ex.Message}");
                return StatusCode(500, new { error = "An error occurred during search execution.", details = ex.Message });
            }
        }
    }
}
