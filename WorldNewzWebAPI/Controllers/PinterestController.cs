using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WorldNewzWebAPI.Data;
using WorldNewzWebAPI.Services;

namespace WorldNewzWebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PinterestController : ControllerBase
    {
        private readonly PinterestService _pinterestService;
        private readonly WorldNewsDbContext _context;

        public PinterestController(PinterestService pinterestService, WorldNewsDbContext context)
        {
            _pinterestService = pinterestService;
            _context = context;
        }

        /// <summary>
        /// Get current Pinterest Access Token status, token age, and 30-day expiration reminder info.
        /// </summary>
        [HttpGet("status")]
        public IActionResult GetStatus()
        {
            var (isValid, statusMessage, daysRemaining) = _pinterestService.CheckTokenExpiryStatus();
            return Ok(new
            {
                isValid,
                statusMessage,
                daysRemaining,
                reminderMessage = daysRemaining <= 5 
                    ? "⚠️ ACTION REQUIRED: Pinterest Token expires soon! Refresh access token in Pinterest Developer Portal."
                    : "Token active."
            });
        }

        /// <summary>
        /// Fetch list of available Pinterest boards for the authenticated account.
        /// </summary>
        [HttpGet("boards")]
        public async Task<IActionResult> GetBoards()
        {
            var boards = await _pinterestService.GetUserBoardsAsync();
            return Ok(boards);
        }

        /// <summary>
        /// Manually pin an existing Amazon product by ASIN.
        /// </summary>
        [HttpPost("pin/{asin}")]
        public async Task<IActionResult> PinProductByAsin(string asin, [FromQuery] string? boardId = null)
        {
            if (string.IsNullOrWhiteSpace(asin))
            {
                return BadRequest("ASIN is required.");
            }

            var product = await _context.AmazonProducts.FirstOrDefaultAsync(p => p.Asin == asin);
            if (product == null)
            {
                return NotFound($"Product with ASIN '{asin}' not found in database.");
            }

            var result = await _pinterestService.CreatePinForAmazonProductAsync(product, boardId);
            if (result.Success)
            {
                return Ok(result);
            }

            return StatusCode(500, result);
        }
    }
}
