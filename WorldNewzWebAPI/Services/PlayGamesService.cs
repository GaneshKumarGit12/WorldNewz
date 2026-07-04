using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using WorldNewzWebAPI.Data;
using WorldNewzWebAPI.Models;

namespace WorldNewzWebAPI.Services
{
    public class PlayGamesService : IPlayGamesService
    {
        private readonly WorldNewsDbContext _dbContext;
        private readonly IConfiguration _configuration;

        public PlayGamesService(WorldNewsDbContext dbContext, IConfiguration configuration)
        {
            _dbContext = dbContext;
            _configuration = configuration;
        }

        public async Task<PlayGamesPlayer> AuthenticateOrRegisterPlayerAsync(GoogleAuthRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.GoogleUserId))
            {
                request.GoogleUserId = "guest_" + Guid.NewGuid().ToString("N").Substring(0, 10);
            }

            var player = await _dbContext.PlayGamesPlayers
                .FirstOrDefaultAsync(p => p.GoogleUserId == request.GoogleUserId);

            if (player == null)
            {
                player = new PlayGamesPlayer
                {
                    GoogleUserId = request.GoogleUserId,
                    DisplayName = string.IsNullOrWhiteSpace(request.DisplayName) ? "WorldGamer_" + Random.Shared.Next(1000, 9999) : request.DisplayName,
                    Email = request.Email ?? "",
                    AvatarUrl = string.IsNullOrWhiteSpace(request.AvatarUrl) ? "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80" : request.AvatarUrl,
                    Level = 1,
                    XpPoints = 100,
                    CreatedAt = DateTime.UtcNow,
                    LastLoginAt = DateTime.UtcNow
                };
                _dbContext.PlayGamesPlayers.Add(player);
            }
            else
            {
                player.LastLoginAt = DateTime.UtcNow;
                if (!string.IsNullOrWhiteSpace(request.DisplayName)) player.DisplayName = request.DisplayName;
                if (!string.IsNullOrWhiteSpace(request.AvatarUrl)) player.AvatarUrl = request.AvatarUrl;
            }

            await _dbContext.SaveChangesAsync();
            return player;
        }

        public async Task<PlayGamesPlayer?> GetPlayerProfileAsync(string playerId)
        {
            return await _dbContext.PlayGamesPlayers.FirstOrDefaultAsync(p => p.Id == playerId || p.GoogleUserId == playerId);
        }

        public async Task<List<PlayGamesLeaderboard>> GetLeaderboardsAsync()
        {
            await SeedInitialDataAsync();
            return await _dbContext.PlayGamesLeaderboards.ToListAsync();
        }

        public async Task<List<PlayGamesScore>> GetLeaderboardScoresAsync(string leaderboardId, int top = 20)
        {
            var leaderboard = await _dbContext.PlayGamesLeaderboards.FindAsync(leaderboardId);
            bool highToLow = leaderboard == null || leaderboard.SortOrder == "HighToLow";

            IQueryable<PlayGamesScore> query = _dbContext.PlayGamesScores.Where(s => s.LeaderboardId == leaderboardId);

            if (highToLow)
                query = query.OrderByDescending(s => s.ScoreValue);
            else
                query = query.OrderBy(s => s.ScoreValue);

            return await query.Take(top).ToListAsync();
        }

        public async Task<PlayGamesScore> SubmitScoreAsync(string leaderboardId, SubmitScoreRequest request)
        {
            var player = await GetPlayerProfileAsync(request.PlayerId);
            string playerName = player?.DisplayName ?? "Player_" + request.PlayerId.Substring(0, Math.Min(6, request.PlayerId.Length));
            string avatarUrl = player?.AvatarUrl ?? "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80";

            var scoreEntry = new PlayGamesScore
            {
                LeaderboardId = leaderboardId,
                PlayerId = player?.Id ?? request.PlayerId,
                PlayerName = playerName,
                AvatarUrl = avatarUrl,
                ScoreValue = request.ScoreValue,
                FormattedValue = request.ScoreValue.ToString("N0") + " pts",
                SubmittedAt = DateTime.UtcNow
            };

            _dbContext.PlayGamesScores.Add(scoreEntry);

            // Award XP to player
            if (player != null)
            {
                player.XpPoints += 50;
                player.Level = (int)(player.XpPoints / 500) + 1;
            }

            await _dbContext.SaveChangesAsync();
            return scoreEntry;
        }

        public async Task<List<PlayGamesAchievement>> GetAchievementsAsync()
        {
            await SeedInitialDataAsync();
            return await _dbContext.PlayGamesAchievements.ToListAsync();
        }

        public async Task<List<PlayGamesPlayerAchievement>> GetPlayerAchievementsAsync(string playerId)
        {
            return await _dbContext.PlayGamesPlayerAchievements
                .Where(pa => pa.PlayerId == playerId)
                .ToListAsync();
        }

        public async Task<PlayGamesPlayerAchievement> UpdateAchievementProgressAsync(string achievementId, AchievementProgressRequest request)
        {
            var achievement = await _dbContext.PlayGamesAchievements.FindAsync(achievementId);
            if (achievement == null)
            {
                throw new KeyNotFoundException($"Achievement '{achievementId}' not found.");
            }

            var playerAch = await _dbContext.PlayGamesPlayerAchievements
                .FirstOrDefaultAsync(pa => pa.PlayerId == request.PlayerId && pa.AchievementId == achievementId);

            if (playerAch == null)
            {
                playerAch = new PlayGamesPlayerAchievement
                {
                    PlayerId = request.PlayerId,
                    AchievementId = achievementId,
                    CurrentSteps = request.Steps,
                    IsUnlocked = request.Steps >= achievement.TotalSteps,
                    UnlockedAt = request.Steps >= achievement.TotalSteps ? DateTime.UtcNow : null
                };
                _dbContext.PlayGamesPlayerAchievements.Add(playerAch);
            }
            else
            {
                playerAch.CurrentSteps += request.Steps;
                if (!playerAch.IsUnlocked && playerAch.CurrentSteps >= achievement.TotalSteps)
                {
                    playerAch.IsUnlocked = true;
                    playerAch.UnlockedAt = DateTime.UtcNow;

                    // Award achievement XP
                    var player = await GetPlayerProfileAsync(request.PlayerId);
                    if (player != null)
                    {
                        player.XpPoints += achievement.XpReward;
                        player.Level = (int)(player.XpPoints / 500) + 1;
                    }
                }
            }

            await _dbContext.SaveChangesAsync();
            return playerAch;
        }

        public async Task<List<PlayGamesSavedGame>> GetPlayerSavedGamesAsync(string playerId)
        {
            return await _dbContext.PlayGamesSavedGames
                .Where(sg => sg.PlayerId == playerId)
                .OrderByDescending(sg => sg.LastModifiedAt)
                .ToListAsync();
        }

        public async Task<PlayGamesSavedGame> SaveGameStateAsync(SaveGameRequest request)
        {
            var existingSave = await _dbContext.PlayGamesSavedGames
                .FirstOrDefaultAsync(sg => sg.PlayerId == request.PlayerId && sg.SaveName == request.SaveName && sg.GameId == request.GameId);

            if (existingSave != null)
            {
                existingSave.DataJson = request.DataJson;
                existingSave.CoverImageUrl = request.CoverImageUrl;
                existingSave.LastModifiedAt = DateTime.UtcNow;
                await _dbContext.SaveChangesAsync();
                return existingSave;
            }

            var saveGame = new PlayGamesSavedGame
            {
                PlayerId = request.PlayerId,
                SaveName = request.SaveName,
                GameId = request.GameId,
                DataJson = request.DataJson,
                CoverImageUrl = request.CoverImageUrl,
                LastModifiedAt = DateTime.UtcNow
            };

            _dbContext.PlayGamesSavedGames.Add(saveGame);
            await _dbContext.SaveChangesAsync();
            return saveGame;
        }

        public async Task SeedInitialDataAsync()
        {
            if (!await _dbContext.PlayGamesLeaderboards.AnyAsync())
            {
                var initialLeaderboards = new List<PlayGamesLeaderboard>
                {
                    new PlayGamesLeaderboard
                    {
                        Id = "leaderboard_snake_arena",
                        Title = "🐍 Snake Arena 2026 Masters",
                        GameCategory = "Arcade Action",
                        IconUrl = "https://img.icons8.com/color/96/snake.png",
                        SortOrder = "HighToLow"
                    },
                    new PlayGamesLeaderboard
                    {
                        Id = "leaderboard_quiz_master",
                        Title = "🧠 World Trivia Challenge",
                        GameCategory = "Puzzle & Trivia",
                        IconUrl = "https://img.icons8.com/color/96/brain.png",
                        SortOrder = "HighToLow"
                    },
                    new PlayGamesLeaderboard
                    {
                        Id = "leaderboard_cyber_shooter",
                        Title = "⚡ Cyber Retro Shooter",
                        GameCategory = "Action & Arcade",
                        IconUrl = "https://img.icons8.com/color/96/space-ship.png",
                        SortOrder = "HighToLow"
                    }
                };
                _dbContext.PlayGamesLeaderboards.AddRange(initialLeaderboards);
            }

            if (!await _dbContext.PlayGamesAchievements.AnyAsync())
            {
                var initialAchievements = new List<PlayGamesAchievement>
                {
                    new PlayGamesAchievement
                    {
                        Id = "ach_welcome",
                        Title = "🌟 Welcome Gamer",
                        Description = "Sign in to WorldNewzs Play Games Services for the first time.",
                        IconUrl = "https://img.icons8.com/color/96/google-play.png",
                        UnlockedIconUrl = "https://img.icons8.com/color/96/star.png",
                        Rarity = "Common",
                        TotalSteps = 1,
                        XpReward = 100
                    },
                    new PlayGamesAchievement
                    {
                        Id = "ach_snake_slayer",
                        Title = "🐍 Snake Slayer",
                        Description = "Score 500+ points in Snake Arena 2026.",
                        IconUrl = "https://img.icons8.com/color/96/snake.png",
                        UnlockedIconUrl = "https://img.icons8.com/color/96/trophy.png",
                        Rarity = "Rare",
                        TotalSteps = 1,
                        XpReward = 250
                    },
                    new PlayGamesAchievement
                    {
                        Id = "ach_trivia_genius",
                        Title = "🧠 Trivia Genius",
                        Description = "Answer 10 consecutive news quiz questions correctly.",
                        IconUrl = "https://img.icons8.com/color/96/idea.png",
                        UnlockedIconUrl = "https://img.icons8.com/color/96/medal.png",
                        Rarity = "Epic",
                        TotalSteps = 10,
                        XpReward = 500
                    },
                    new PlayGamesAchievement
                    {
                        Id = "ach_cloud_pioneer",
                        Title = "☁️ Cloud Pioneer",
                        Description = "Save your first game state to Google Play Games Cloud.",
                        IconUrl = "https://img.icons8.com/color/96/cloud-storage.png",
                        UnlockedIconUrl = "https://img.icons8.com/color/96/ok.png",
                        Rarity = "Common",
                        TotalSteps = 1,
                        XpReward = 150
                    }
                };
                _dbContext.PlayGamesAchievements.AddRange(initialAchievements);
            }

            // Seed mock scores if empty
            if (!await _dbContext.PlayGamesScores.AnyAsync())
            {
                var mockScores = new List<PlayGamesScore>
                {
                    new PlayGamesScore { LeaderboardId = "leaderboard_snake_arena", PlayerId = "p1", PlayerName = "CyberKnight_99", AvatarUrl = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80", ScoreValue = 2450, FormattedValue = "2,450 pts", SubmittedAt = DateTime.UtcNow.AddHours(-2) },
                    new PlayGamesScore { LeaderboardId = "leaderboard_snake_arena", PlayerId = "p2", PlayerName = "PixelQueen", AvatarUrl = "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80", ScoreValue = 1890, FormattedValue = "1,890 pts", SubmittedAt = DateTime.UtcNow.AddHours(-5) },
                    new PlayGamesScore { LeaderboardId = "leaderboard_snake_arena", PlayerId = "p3", PlayerName = "GamerNinja", AvatarUrl = "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=120&q=80", ScoreValue = 1200, FormattedValue = "1,200 pts", SubmittedAt = DateTime.UtcNow.AddHours(-12) },
                    new PlayGamesScore { LeaderboardId = "leaderboard_quiz_master", PlayerId = "p4", PlayerName = "NewsWizard", AvatarUrl = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80", ScoreValue = 3500, FormattedValue = "3,500 pts", SubmittedAt = DateTime.UtcNow.AddHours(-1) }
                };
                _dbContext.PlayGamesScores.AddRange(mockScores);
            }

            await _dbContext.SaveChangesAsync();
        }
    }
}
