# Google Play Games Services API & PlayGames Documentation (`GPlay.md`)

## 1. Overview
The **Play Games** component on WorldNewzs provides a Google Play Games Services-inspired interactive gaming experience. It empowers developers and players with social leaderboards, achievements, game state cloud saving, Google OAuth sign-in integration, and interactive web games.

---

## 2. Security & Credentials Architecture
> [!CAUTION]
> Sensitive credentials MUST NOT be hardcoded into public frontend code or git repositories. Keep all secret keys in Render.com environment configuration variables.

### Environment Variable Mapping
Google OAuth project credentials configuration:

| Secret Key | Variable Name | Environment / Location |
| :--- | :--- | :--- |
| `client_id` | `GOOGLE_PLAY_CLIENT_ID` | Render.com Web API Environment & `worldnewz_UI/.env` (`VITE_GOOGLE_PLAY_CLIENT_ID`) |
| `client_secret` | `GOOGLE_PLAY_CLIENT_SECRET` | Render.com Web API Environment ONLY |
| `project_id` | `GOOGLE_PLAY_PROJECT_ID` | Render.com Web API Environment & `appsettings.json` |
| `auth_uri` | `GOOGLE_AUTH_URI` | `https://accounts.google.com/o/oauth2/auth` |
| `token_uri` | `GOOGLE_TOKEN_URI` | `https://oauth2.googleapis.com/token` |

---

## 3. Database Objects (`DBobjects`)

### Schema Overview
```
+-------------------+      +-------------------------+      +------------------------+
| PlayGamesPlayer   |----->| PlayGamesPlayerAchieve  |<-----| PlayGamesAchievement   |
+-------------------+      +-------------------------+      +------------------------+
        |
        +----------------->| PlayGamesScore          |<-----| PlayGamesLeaderboard   |
        |                  +-------------------------+      +------------------------+
        |
        +----------------->| PlayGamesSavedGame      |
                           +-------------------------+
```

### Table Definitions

#### 1. `PlayGamesPlayer`
- `Id` (GUID / string, PK)
- `GoogleUserId` (string, Unique Index)
- `DisplayName` (string)
- `Email` (string)
- `AvatarUrl` (string)
- `Level` (int, default 1)
- `XpPoints` (long, default 0)
- `CreatedAt` (DateTime)
- `LastLoginAt` (DateTime)

#### 2. `PlayGamesLeaderboard`
- `Id` (string, PK) - e.g. `leaderboard_snake_arena`, `leaderboard_quiz_master`
- `Title` (string)
- `GameCategory` (string)
- `IconUrl` (string)
- `SortOrder` (string) - `HighToLow` or `LowToHigh`

#### 3. `PlayGamesScore`
- `Id` (int, Auto PK)
- `LeaderboardId` (string, FK)
- `PlayerId` (string, FK)
- `PlayerName` (string)
- `AvatarUrl` (string)
- `ScoreValue` (long)
- `FormattedValue` (string)
- `SubmittedAt` (DateTime)

#### 4. `PlayGamesAchievement`
- `Id` (string, PK) - e.g. `ach_welcome`, `ach_snake_slayer`
- `Title` (string)
- `Description` (string)
- `IconUrl` (string)
- `UnlockedIconUrl` (string)
- `Rarity` (string) - `Common`, `Rare`, `Epic`, `Legendary`
- `TotalSteps` (int) - For incremental achievements
- `XpReward` (int)

#### 5. `PlayGamesPlayerAchievement`
- `Id` (int, Auto PK)
- `PlayerId` (string, FK)
- `AchievementId` (string, FK)
- `CurrentSteps` (int)
- `IsUnlocked` (bool)
- `UnlockedAt` (DateTime?)

#### 6. `PlayGamesSavedGame`
- `Id` (string, PK)
- `PlayerId` (string, FK)
- `SaveName` (string)
- `GameId` (string)
- `DataJson` (text)
- `CoverImageUrl` (string)
- `LastModifiedAt` (DateTime)

---

## 4. Backend Service & Controller (`Service`)

### Controller Endpoints (`/api/playgames`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/playgames/auth/google` | Authenticate Google ID token & sync user profile |
| `GET` | `/api/playgames/profile` | Retrieve active player level, XP, & statistics |
| `GET` | `/api/playgames/leaderboards` | List available game leaderboards |
| `GET` | `/api/playgames/leaderboards/{id}/scores` | Fetch top scores & player rank |
| `POST` | `/api/playgames/leaderboards/{id}/scores` | Submit new score to leaderboard |
| `GET` | `/api/playgames/achievements` | Fetch list of achievements & unlock state |
| `POST` | `/api/playgames/achievements/{id}/progress` | Record step progress or unlock achievement |
| `GET` | `/api/playgames/savedgames` | Retrieve player's cloud saved game states |
| `POST` | `/api/playgames/savedgames` | Save / sync game progress data to cloud |

---

## 5. Frontend UI (`UI`)

### Route: `/play-games`
- **Hero Header**: Google Play Games themed header with player avatar, level progress bar, total XP, and Google Sign-In button.
- **Tab Layout**:
  - 🎮 **Featured Games**: Direct playable arcade mini-games (Snake Arena 2026, World Quiz Challenge, Memory Matrix, Cyber Shooter).
  - 🏆 **Leaderboards**: Social leaderboard tables with player ranks, avatar icons, top scores, and time-frame filters (Global, Weekly).
  - 🎖️ **Achievements**: Grid of badges with progress bars, locked/unlocked state, and XP reward values.
  - 💾 **Saved Games (Cloud State)**: Saved game snapshots with last modified timestamps and cloud sync indicators.

---

## 6. Render.com Environment Configuration (`render.com/dashboard`)

When configuring your Web API service on **Render.com**, add the following key-value pairs under **Environment Variables**:

```env
GOOGLE_PLAY_CLIENT_ID=<YOUR_GOOGLE_PLAY_CLIENT_ID>
GOOGLE_PLAY_PROJECT_ID=wnzsplay
GOOGLE_PLAY_CLIENT_SECRET=<YOUR_GOOGLE_PLAY_CLIENT_SECRET>
```

For the frontend static site build on Vercel/Render:
```env
VITE_GOOGLE_PLAY_CLIENT_ID=<YOUR_GOOGLE_PLAY_CLIENT_ID>
```

---

## 7. SEO, Performance & Google Policies Compliance

1. **SEO Optimization**:
   - Title: `Google Play Games Services API | WorldNewzs`
   - Description: `The Google Play Games Service allows developers to enhance games with social leaderboards, achievements, game state, sign-in with Google, and interactive web games on WorldNewzs.`
   - Schema Markup: `SoftwareApplication` / `VideoGame` JSON-LD schema embedded on `/play-games`.
   - Semantic HTML5 structure (`<main>`, `<article>`, `<section>`, `<h1>`).

2. **Performance Optimization**:
   - Lazy loading route in React `main.tsx`.
   - Micro-animations using CSS transitions without layout thrashing.
   - Core Web Vitals optimized (CLS < 0.1, LCP < 2.5s).

3. **Google Content & AdSense Policies**:
   - Original editorial and gameplay content with full interactivity.
   - Clear visual separation between Ad elements (`AdCard`) and interactive game controls.
   - No misleading click targets or overlapping buttons.
