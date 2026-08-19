using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WorldNewzWebAPI.Data;
using WorldNewzWebAPI.Services;

namespace WorldNewzWebAPI.Controllers
{
    public class ExchangePinterestTokenRequest
    {
        public string Code { get; set; } = string.Empty;
        public string RedirectUri { get; set; } = string.Empty;
    }

    public class RefreshPinterestTokenRequest
    {
        public string? RefreshToken { get; set; }
    }

    public class SetPinterestTokenRequest
    {
        public string AccessToken { get; set; } = string.Empty;
        public string? RefreshToken { get; set; }
        public string? BoardId { get; set; }
    }

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
        /// Get current Pinterest Access Token status, live account connectivity, and expiration info.
        /// </summary>
        [HttpGet("status")]
        public async Task<IActionResult> GetStatus()
        {
            var (isValid, statusMessage, daysRemaining) = _pinterestService.CheckTokenExpiryStatus();
            var accountInfo = await _pinterestService.GetAccountInfoAsync();

            return Ok(new
            {
                isValid,
                statusMessage,
                daysRemaining,
                isConfigured = _pinterestService.IsConfigured,
                appId = _pinterestService.GetAppId(),
                account = accountInfo,
                reminderMessage = daysRemaining <= 5 
                    ? "⚠️ ACTION REQUIRED: Pinterest Token expires soon! Refresh access token via /api/pinterest/refresh-token or OAuth."
                    : "Token active."
            });
        }

        /// <summary>
        /// Generates the Pinterest OAuth2 Authorization URL to initiate user login and token generation.
        /// </summary>
        [HttpGet("auth-url")]
        public IActionResult GetAuthUrl([FromQuery] string? redirectUri = null)
        {
            var targetRedirect = !string.IsNullOrWhiteSpace(redirectUri) 
                ? redirectUri 
                : "https://worldnewzs.in/admin";

            var url = _pinterestService.GetAuthorizationUrl(targetRedirect);
            return Ok(new
            {
                authorizationUrl = url,
                appId = _pinterestService.GetAppId(),
                redirectUri = targetRedirect
            });
        }

        /// <summary>
        /// Exchanges an OAuth authorization code for an Access Token &amp; Refresh Token.
        /// </summary>
        [HttpPost("exchange-token")]
        public async Task<IActionResult> ExchangeToken([FromBody] ExchangePinterestTokenRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Code))
            {
                return BadRequest(new { error = "Authorization code is required." });
            }

            var redirectUri = !string.IsNullOrWhiteSpace(request.RedirectUri) 
                ? request.RedirectUri 
                : "https://worldnewzs.in/admin";

            var result = await _pinterestService.ExchangeCodeForTokensAsync(request.Code, redirectUri);
            if (result.Success)
            {
                return Ok(new
                {
                    status = "success",
                    message = "Pinterest tokens generated and activated successfully!",
                    result
                });
            }

            return BadRequest(new
            {
                status = "error",
                error = result.ErrorMessage
            });
        }

        /// <summary>
        /// Refreshes the Pinterest Access Token using the OAuth2 refresh token.
        /// </summary>
        [HttpPost("refresh-token")]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshPinterestTokenRequest? request = null)
        {
            var result = await _pinterestService.RefreshTokenAsync(request?.RefreshToken);
            if (result.Success)
            {
                return Ok(new
                {
                    status = "success",
                    message = "Pinterest access token renewed successfully!",
                    result
                });
            }

            return BadRequest(new
            {
                status = "error",
                error = result.ErrorMessage
            });
        }

        /// <summary>
        /// Dynamically updates the active Pinterest access token or board ID in-memory.
        /// </summary>
        [HttpPost("set-token")]
        public IActionResult SetToken([FromBody] SetPinterestTokenRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.AccessToken))
            {
                return BadRequest(new { error = "AccessToken is required." });
            }

            _pinterestService.UpdateActiveCredentials(request.AccessToken, request.RefreshToken, request.BoardId);

            return Ok(new
            {
                status = "success",
                message = "Pinterest credentials updated for active runtime session."
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
                return BadRequest(new { error = "ASIN is required." });
            }

            var product = await _context.AmazonProducts.FirstOrDefaultAsync(p => p.Asin == asin);
            if (product == null)
            {
                return NotFound(new { error = $"Product with ASIN '{asin}' not found in database." });
            }

            var result = await _pinterestService.CreatePinForAmazonProductAsync(product, boardId);
            if (result.Success)
            {
                return Ok(result);
            }

            return Ok(new
            {
                status = "skipped_or_failed",
                message = result.Message,
                result
            });
        }
    }
}
