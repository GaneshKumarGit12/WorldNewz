using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using WorldNewzWebAPI.Models;
using WorldNewzWebAPI.Services;

namespace WorldNewzWebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PlayGamesController : ControllerBase
    {
        private readonly IPlayGamesService _playGamesService;
        private readonly ILogger<PlayGamesController> _logger;

        public PlayGamesController(IPlayGamesService playGamesService, ILogger<PlayGamesController> logger)
        {
            _playGamesService = playGamesService;
            _logger = logger;
        }

        /// <summary>
        /// Authenticate or register player via Google Sign-In token
        /// </summary>
        [HttpPost("auth/google")]
        public async Task<IActionResult> AuthenticateGoogle([FromBody] GoogleAuthRequest request)
        {
            try
            {
                var player = await _playGamesService.AuthenticateOrRegisterPlayerAsync(request);
                return Ok(new
                {
                    success = true,
                    message = "Google Play Games authentication successful",
                    player
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error authenticating Google Play Games user");
                return StatusCode(500, new { success = false, message = "Authentication failed" });
            }
        }

        /// <summary>
        /// Get player profile details
        /// </summary>
        [HttpGet("profile/{playerId}")]
        public async Task<IActionResult> GetProfile(string playerId)
        {
            var profile = await _playGamesService.GetPlayerProfileAsync(playerId);
            if (profile == null)
            {
                return NotFound(new { success = false, message = "Player profile not found" });
            }
            return Ok(new { success = true, player = profile });
        }

        /// <summary>
        /// Get all leaderboards
        /// </summary>
        [HttpGet("leaderboards")]
        public async Task<IActionResult> GetLeaderboards()
        {
            var leaderboards = await _playGamesService.GetLeaderboardsAsync();
            return Ok(new { success = true, leaderboards });
        }

        /// <summary>
        /// Get top scores for a leaderboard
        /// </summary>
        [HttpGet("leaderboards/{leaderboardId}/scores")]
        public async Task<IActionResult> GetLeaderboardScores(string leaderboardId, [FromQuery] int top = 20)
        {
            var scores = await _playGamesService.GetLeaderboardScoresAsync(leaderboardId, top);
            return Ok(new { success = true, leaderboardId, scores });
        }

        /// <summary>
        /// Submit score to a leaderboard
        /// </summary>
        [HttpPost("leaderboards/{leaderboardId}/scores")]
        public async Task<IActionResult> SubmitScore(string leaderboardId, [FromBody] SubmitScoreRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.PlayerId))
            {
                return BadRequest(new { success = false, message = "Invalid player or score data" });
            }

            var scoreEntry = await _playGamesService.SubmitScoreAsync(leaderboardId, request);
            return Ok(new
            {
                success = true,
                message = "Score successfully submitted to Google Play Games Leaderboard!",
                score = scoreEntry
            });
        }

        /// <summary>
        /// Get all achievements list
        /// </summary>
        [HttpGet("achievements")]
        public async Task<IActionResult> GetAchievements([FromQuery] string? playerId = null)
        {
            var achievements = await _playGamesService.GetAchievementsAsync();
            List<PlayGamesPlayerAchievement>? playerProgress = null;

            if (!string.IsNullOrWhiteSpace(playerId))
            {
                playerProgress = await _playGamesService.GetPlayerAchievementsAsync(playerId);
            }

            return Ok(new { success = true, achievements, playerProgress });
        }

        /// <summary>
        /// Update step progress or unlock achievement
        /// </summary>
        [HttpPost("achievements/{achievementId}/progress")]
        public async Task<IActionResult> UpdateAchievementProgress(string achievementId, [FromBody] AchievementProgressRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.PlayerId))
            {
                return BadRequest(new { success = false, message = "Invalid player or achievement data" });
            }

            try
            {
                var result = await _playGamesService.UpdateAchievementProgressAsync(achievementId, request);
                return Ok(new
                {
                    success = true,
                    message = result.IsUnlocked ? "🎉 Achievement Unlocked!" : "Achievement progress recorded.",
                    achievementProgress = result
                });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Get player cloud saved games
        /// </summary>
        [HttpGet("savedgames/{playerId}")]
        public async Task<IActionResult> GetSavedGames(string playerId)
        {
            var savedGames = await _playGamesService.GetPlayerSavedGamesAsync(playerId);
            return Ok(new { success = true, savedGames });
        }

        /// <summary>
        /// Save or sync game state to cloud
        /// </summary>
        [HttpPost("savedgames")]
        public async Task<IActionResult> SaveGameState([FromBody] SaveGameRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.PlayerId))
            {
                return BadRequest(new { success = false, message = "Invalid player or save game data" });
            }

            var saveGame = await _playGamesService.SaveGameStateAsync(request);
            return Ok(new
            {
                success = true,
                message = "Game state saved to Google Play Games Cloud Storage!",
                saveGame
            });
        }
    }
}
