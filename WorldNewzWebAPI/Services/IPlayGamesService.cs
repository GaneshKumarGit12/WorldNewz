using System.Collections.Generic;
using System.Threading.Tasks;
using WorldNewzWebAPI.Models;

namespace WorldNewzWebAPI.Services
{
    public interface IPlayGamesService
    {
        Task<PlayGamesPlayer> AuthenticateOrRegisterPlayerAsync(GoogleAuthRequest request);
        Task<PlayGamesPlayer?> GetPlayerProfileAsync(string playerId);
        Task<List<PlayGamesLeaderboard>> GetLeaderboardsAsync();
        Task<List<PlayGamesScore>> GetLeaderboardScoresAsync(string leaderboardId, int top = 20);
        Task<PlayGamesScore> SubmitScoreAsync(string leaderboardId, SubmitScoreRequest request);
        Task<List<PlayGamesAchievement>> GetAchievementsAsync();
        Task<List<PlayGamesPlayerAchievement>> GetPlayerAchievementsAsync(string playerId);
        Task<PlayGamesPlayerAchievement> UpdateAchievementProgressAsync(string achievementId, AchievementProgressRequest request);
        Task<List<PlayGamesSavedGame>> GetPlayerSavedGamesAsync(string playerId);
        Task<PlayGamesSavedGame> SaveGameStateAsync(SaveGameRequest request);
        Task SeedInitialDataAsync();
    }
}
