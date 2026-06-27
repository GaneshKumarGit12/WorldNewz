using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using WorldNewzWebAPI.Data;
using WorldNewzWebAPI.Hubs;
using WorldNewzWebAPI.Models;

namespace WorldNewzWebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GameController : ControllerBase
    {
        private readonly UserPollsDbContext _userDb;
        private readonly IMemoryCache _cache;
        private readonly IHubContext<LeaderboardHub> _hubContext;
        private const string LeaderboardCacheKey = "leaderboard_top";

        public GameController(
            UserPollsDbContext userDb,
            IMemoryCache cache,
            IHubContext<LeaderboardHub> hubContext)
        {
            _userDb = userDb;
            _cache = cache;
            _hubContext = hubContext;
        }

        // POST /api/game/score
        [HttpPost("score")]
        public async Task<IActionResult> SubmitScore([FromBody] ScoreSubmissionDto request)
        {
            if (request == null)
            {
                return BadRequest(new { error = "Invalid score payload." });
            }

            var username = (request.Username ?? "").Trim();
            if (string.IsNullOrEmpty(username))
            {
                return BadRequest(new { error = "Username is required." });
            }

            if (username.Length > 50)
            {
                username = username.Substring(0, 50);
            }

            if (request.Points < 0)
            {
                return BadRequest(new { error = "Points cannot be negative." });
            }

            var score = new Score
            {
                Username = username,
                Points = request.Points,
                CreatedAt = DateTime.UtcNow
            };

            _userDb.Scores.Add(score);
            await _userDb.SaveChangesAsync();

            // Invalidate leaderboard cache keys
            for (int limit = 5; limit <= 50; limit += 5)
            {
                _cache.Remove($"{LeaderboardCacheKey}_{limit}");
            }
            _cache.Remove($"{LeaderboardCacheKey}_10");

            // Broadcast real-time leaderboard update notification to all clients
            try
            {
                await _hubContext.Clients.All.SendAsync("UpdateLeaderboard");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️ Failed to broadcast SignalR leaderboard update: {ex.Message}");
            }

            return Ok(new { success = true, score });
        }

        // GET /api/game/leaderboard
        [HttpGet("leaderboard")]
        public async Task<IActionResult> GetLeaderboard([FromQuery] int limit = 10)
        {
            if (limit <= 0 || limit > 100) limit = 10;

            var cacheKey = $"{LeaderboardCacheKey}_{limit}";
            if (!_cache.TryGetValue(cacheKey, out List<object>? leaderboard))
            {
                var topScores = await _userDb.Scores
                    .OrderByDescending(s => s.Points)
                    .ThenByDescending(s => s.CreatedAt)
                    .Take(limit)
                    .Select(s => new
                    {
                        id = s.Id,
                        username = s.Username,
                        points = s.Points,
                        createdAt = s.CreatedAt
                    })
                    .Cast<object>()
                    .ToListAsync();

                var cacheEntryOptions = new MemoryCacheEntryOptions()
                    .SetAbsoluteExpiration(TimeSpan.FromSeconds(15)); // Cache for 15 seconds

                _cache.Set(cacheKey, topScores, cacheEntryOptions);
                leaderboard = topScores;
            }

            return Ok(leaderboard);
        }
    }

    public class ScoreSubmissionDto
    {
        public string Username { get; set; } = string.Empty;
        public int Points { get; set; }
    }
}
