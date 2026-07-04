# Google Play Games Services API & PlayGames Documentation (`GPlay.md`)

## 1. Overview
The **Play Games** component on WorldNewzs provides a Google Play Games Services-inspired interactive gaming experience. It empowers developers and players with social leaderboards, achievements, game state cloud saving, Google OAuth sign-in integration, and interactive web games.

---

## 2. Featured Games Portfolio & Architecture

### 1. ♟️ Grandmaster Chess (`/games/chess`)
- **Engine**: Full HTML5 / React Canvas Chess engine with legal move generation, piece capturing, castling, pawn promotion, en passant, and check/checkmate detection.
- **Modes**:
  - **Player vs Stockfish AI**: 3 Difficulty levels (Novice, Club Player, Grandmaster).
  - **Pass & Play (Local 2P)**: Two players on same device with move timer.
- **Features**: Move history log, captured pieces counter, check indicator banner, move sound effects, global leaderboards (`leaderboard_chess_grandmaster`), and `ach_chess_checkmate` achievement.

### 2. 🍄 Super Mario Retro Runner (`/games/mario`)
- **Engine**: Phaser 3 HTML5 Canvas 2D platformer engine.
- **Mechanics**:
  - Player controls Mario (Arrow keys / WASD / Touch buttons).
  - Jump on Goomba / Koopa enemies to defeat them.
  - Hit `?` blocks for coins and mushroom power-ups.
  - Parallax scrolling background, score multiplier, lives system.
- **Features**: Cloud game state sync (`mario_runner`), high score submission to `leaderboard_mario_runner`, and `ach_mario_coin_master` achievement.

### 3. ⚽ Hit Goal Soccer Penalty Shootout (`/games/hit-goal`)
- **Engine**: Physics-based HTML5 Canvas soccer shooting simulator.
- **Mechanics**:
  - Touch / Mouse drag trajectory trajectory curve control for ball spin and power.
  - Dynamic Goalkeeper AI with dive velocity and reaction timing.
  - Moving target bullseyes in goal corners (+500 bonus points).
  - Wind speed & direction dynamics.
- **Features**: Stadium crowd sound effects, streak multipliers, global leaderboards (`leaderboard_hit_goal_soccer`), and `ach_hit_goal_hattrick` achievement.

---

## 3. Security & Credentials Architecture
> [!CAUTION]
> Sensitive credentials MUST NOT be hardcoded into public frontend code or git repositories. Keep all secret keys in Render.com environment configuration variables.

### Environment Variable Mapping

| Secret Key | Variable Name | Environment / Location |
| :--- | :--- | :--- |
| `client_id` | `GOOGLE_PLAY_CLIENT_ID` | Render.com Web API Environment & `worldnewz_UI/.env` (`VITE_GOOGLE_PLAY_CLIENT_ID`) |
| `client_secret` | `GOOGLE_PLAY_CLIENT_SECRET` | Render.com Web API Environment ONLY |
| `project_id` | `GOOGLE_PLAY_PROJECT_ID` | Render.com Web API Environment & `appsettings.json` |

---

## 4. Database Objects (`DBobjects`)

### Table Definitions

#### 1. `PlayGamesPlayer`
- `Id` (string, PK)
- `GoogleUserId` (string, Unique Index)
- `DisplayName` (string)
- `Email` (string)
- `AvatarUrl` (string)
- `Level` (int, default 1)
- `XpPoints` (long, default 0)
- `CreatedAt`, `LastLoginAt` (DateTime)

#### 2. `PlayGamesLeaderboard`
- `Id` (string, PK) - e.g. `leaderboard_snake_arena`, `leaderboard_chess_grandmaster`, `leaderboard_mario_runner`, `leaderboard_hit_goal_soccer`
- `Title`, `GameCategory`, `IconUrl`, `SortOrder`

#### 3. `PlayGamesScore`
- `Id` (int, PK)
- `LeaderboardId`, `PlayerId`, `PlayerName`, `AvatarUrl`, `ScoreValue`, `FormattedValue`, `SubmittedAt`

#### 4. `PlayGamesAchievement`
- `Id` (string, PK) - e.g. `ach_welcome`, `ach_snake_slayer`, `ach_chess_checkmate`, `ach_mario_coin_master`, `ach_hit_goal_hattrick`
- `Title`, `Description`, `IconUrl`, `UnlockedIconUrl`, `Rarity`, `TotalSteps`, `XpReward`

---

## 5. Render.com Environment Configuration (`render.com/dashboard`)

```env
GOOGLE_PLAY_CLIENT_ID=<YOUR_GOOGLE_PLAY_CLIENT_ID>
GOOGLE_PLAY_PROJECT_ID=wnzsplay
GOOGLE_PLAY_CLIENT_SECRET=<YOUR_GOOGLE_PLAY_CLIENT_SECRET>
```
