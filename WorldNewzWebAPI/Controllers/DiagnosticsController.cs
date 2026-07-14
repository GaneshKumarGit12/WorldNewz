using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using WorldNewzWebAPI.Data;

namespace WorldNewzWebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DiagnosticsController : ControllerBase
    {
        private readonly WorldNewsDbContext _db;
        private readonly UserPollsDbContext _userDb;

        public DiagnosticsController(WorldNewsDbContext db, UserPollsDbContext userDb)
        {
            _db = db;
            _userDb = userDb;
        }

        [HttpGet("db")]
        public async Task<IActionResult> GetDbDiagnostics()
        {
            string dbProvider = _db.Database.ProviderName ?? "Unknown";
            string userDbProvider = _userDb.Database.ProviderName ?? "Unknown";

            bool dbConnected = false;
            string dbError = "None";
            try
            {
                dbConnected = await _db.Database.CanConnectAsync();
            }
            catch (Exception ex)
            {
                dbError = ex.Message;
            }

            bool userDbConnected = false;
            string userDbError = "None";
            try
            {
                userDbConnected = await _userDb.Database.CanConnectAsync();
            }
            catch (Exception ex)
            {
                userDbError = ex.Message;
            }

            // Inspect environment variables safely (keys only)
            var envKeys = new List<string>();
            foreach (DictionaryEntry de in Environment.GetEnvironmentVariables())
            {
                envKeys.Add(de.Key.ToString() ?? "");
            }
            envKeys.Sort();

            var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
            var userPollsUrl = Environment.GetEnvironmentVariable("USER_POLLS_DATABASE_URL");
            var renderEnv = Environment.GetEnvironmentVariable("RENDER");

            return Ok(new
            {
                dbProvider,
                dbConnected,
                dbError,
                userDbProvider,
                userDbConnected,
                userDbError,
                environment = new
                {
                    isRender = !string.IsNullOrEmpty(renderEnv),
                    renderValue = renderEnv,
                    hasDatabaseUrl = !string.IsNullOrEmpty(databaseUrl),
                    databaseUrlLength = databaseUrl?.Length ?? 0,
                    hasUserPollsDatabaseUrl = !string.IsNullOrEmpty(userPollsUrl),
                    userPollsDatabaseUrlLength = userPollsUrl?.Length ?? 0,
                    allKeys = envKeys
                },
                timestamp = DateTime.UtcNow
            });
        }

        [HttpGet("playgames")]
        public async Task<IActionResult> TestPlayGames()
        {
            try
            {
                var achievementsCount = await _db.PlayGamesAchievements.CountAsync();
                var firstAchievement = await _db.PlayGamesAchievements.FirstOrDefaultAsync();
                var scoresCount = await _db.PlayGamesScores.CountAsync();
                var playerAchievementsCount = await _db.PlayGamesPlayerAchievements.CountAsync();
                var leaderboardsCount = await _db.PlayGamesLeaderboards.CountAsync();
                var playersCount = await _db.PlayGamesPlayers.CountAsync();
                var savedGamesCount = await _db.PlayGamesSavedGames.CountAsync();

                return Ok(new {
                    success = true,
                    achievementsCount,
                    firstAchievement,
                    scoresCount,
                    playerAchievementsCount,
                    leaderboardsCount,
                    playersCount,
                    savedGamesCount
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new {
                    success = false,
                    error = ex.Message,
                    stackTrace = ex.StackTrace,
                    innerError = ex.InnerException?.Message
                });
            }
        }
    }
}
