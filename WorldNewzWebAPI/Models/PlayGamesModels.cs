using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WorldNewzWebAPI.Models
{
    public class PlayGamesPlayer
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string GoogleUserId { get; set; } = string.Empty;

        [Required]
        public string DisplayName { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string AvatarUrl { get; set; } = string.Empty;

        public int Level { get; set; } = 1;

        public long XpPoints { get; set; } = 0;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime LastLoginAt { get; set; } = DateTime.UtcNow;
    }

    public class PlayGamesLeaderboard
    {
        [Key]
        public string Id { get; set; } = string.Empty;

        [Required]
        public string Title { get; set; } = string.Empty;

        public string GameCategory { get; set; } = "Arcade";

        public string IconUrl { get; set; } = string.Empty;

        public string SortOrder { get; set; } = "HighToLow"; // HighToLow or LowToHigh
    }

    public class PlayGamesScore
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public string LeaderboardId { get; set; } = string.Empty;

        [Required]
        public string PlayerId { get; set; } = string.Empty;

        public string PlayerName { get; set; } = string.Empty;

        public string AvatarUrl { get; set; } = string.Empty;

        public long ScoreValue { get; set; }

        public string FormattedValue { get; set; } = string.Empty;

        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    }

    public class PlayGamesAchievement
    {
        [Key]
        public string Id { get; set; } = string.Empty;

        [Required]
        public string Title { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public string IconUrl { get; set; } = string.Empty;

        public string UnlockedIconUrl { get; set; } = string.Empty;

        public string Rarity { get; set; } = "Common"; // Common, Rare, Epic, Legendary

        public int TotalSteps { get; set; } = 1;

        public int XpReward { get; set; } = 100;
    }

    public class PlayGamesPlayerAchievement
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public string PlayerId { get; set; } = string.Empty;

        [Required]
        public string AchievementId { get; set; } = string.Empty;

        public int CurrentSteps { get; set; } = 0;

        public bool IsUnlocked { get; set; } = false;

        public DateTime? UnlockedAt { get; set; }
    }

    public class PlayGamesSavedGame
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string PlayerId { get; set; } = string.Empty;

        [Required]
        public string SaveName { get; set; } = "QuickSave";

        public string GameId { get; set; } = "default_game";

        public string DataJson { get; set; } = "{}";

        public string CoverImageUrl { get; set; } = string.Empty;

        public DateTime LastModifiedAt { get; set; } = DateTime.UtcNow;
    }

    // DTO Models
    public class GoogleAuthRequest
    {
        public string IdToken { get; set; } = string.Empty;
        public string GoogleUserId { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string AvatarUrl { get; set; } = string.Empty;
    }

    public class SubmitScoreRequest
    {
        public string PlayerId { get; set; } = string.Empty;
        public long ScoreValue { get; set; }
    }

    public class AchievementProgressRequest
    {
        public string PlayerId { get; set; } = string.Empty;
        public int Steps { get; set; } = 1;
    }

    public class SaveGameRequest
    {
        public string PlayerId { get; set; } = string.Empty;
        public string SaveName { get; set; } = "QuickSave";
        public string GameId { get; set; } = "default_game";
        public string DataJson { get; set; } = "{}";
        public string CoverImageUrl { get; set; } = string.Empty;
    }
}
