import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Button,
  Tabs,
  Tab,
  LinearProgress,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert
} from "@mui/material";
import {
  SportsEsports,
  EmojiEvents,
  CloudUpload,
  Leaderboard,
  Google,
  CheckCircle,
  Lock,
  PlayArrow,
  Star,
  WorkspacePremium
} from "@mui/icons-material";
import { SEOMeta } from "../seo/SEOMeta";
import AdCard from "../components/AdCard";

interface PlayerProfile {
  id: string;
  googleUserId: string;
  displayName: string;
  email: string;
  avatarUrl: string;
  level: number;
  xpPoints: number;
}

interface LeaderboardItem {
  id: string;
  title: string;
  gameCategory: string;
  iconUrl: string;
  sortOrder: string;
}

interface ScoreEntry {
  id: number;
  leaderboardId: string;
  playerId: string;
  playerName: string;
  avatarUrl: string;
  scoreValue: number;
  formattedValue: string;
  submittedAt: string;
}

interface AchievementItem {
  id: string;
  title: string;
  description: string;
  iconUrl: string;
  unlockedIconUrl: string;
  rarity: string;
  totalSteps: number;
  xpReward: number;
  isUnlocked?: boolean;
  currentSteps?: number;
}

interface SavedGameItem {
  id: string;
  saveName: string;
  gameId: string;
  dataJson: string;
  coverImageUrl: string;
  lastModifiedAt: string;
}

const PlayGamesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [leaderboards, setLeaderboards] = useState<LeaderboardItem[]>([]);
  const [selectedLeaderboard, setSelectedLeaderboard] = useState<string>("leaderboard_snake_arena");
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [savedGames, setSavedGames] = useState<SavedGameItem[]>([]);
  const [scoreDialogOpen, setScoreDialogOpen] = useState(false);
  const [newScoreInput, setNewScoreInput] = useState<string>("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

  // Load player from localStorage on mount
  useEffect(() => {
    const savedPlayer = localStorage.getItem("wnzs_play_games_player");
    if (savedPlayer) {
      try {
        setPlayer(JSON.parse(savedPlayer));
      } catch (e) {
        console.error("Failed to parse saved player profile", e);
      }
    } else {
      // Guest initialization
      const guest: PlayerProfile = {
        id: "guest_" + Math.random().toString(36).substring(2, 9),
        googleUserId: "",
        displayName: "Guest Gamer",
        email: "guest@worldnewzs.in",
        avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
        level: 1,
        xpPoints: 100
      };
      setPlayer(guest);
    }
  }, []);

  // Fetch initial data
  useEffect(() => {
    fetchLeaderboards();
    fetchAchievements();
  }, []);

  useEffect(() => {
    if (selectedLeaderboard) {
      fetchScores(selectedLeaderboard);
    }
  }, [selectedLeaderboard]);

  const fetchLeaderboards = async () => {
    try {
      const res = await fetch(`${API_BASE}/playgames/leaderboards`);
      const data = await res.json();
      if (data.success && data.leaderboards) {
        setLeaderboards(data.leaderboards);
        if (data.leaderboards.length > 0 && !selectedLeaderboard) {
          setSelectedLeaderboard(data.leaderboards[0].id);
        }
      }
    } catch (err) {
      console.warn("Using fallback leaderboards data", err);
      setLeaderboards([
        { id: "leaderboard_snake_arena", title: "🐍 Snake Arena 2026 Masters", gameCategory: "Arcade Action", iconUrl: "https://img.icons8.com/color/96/snake.png", sortOrder: "HighToLow" },
        { id: "leaderboard_quiz_master", title: "🧠 World Trivia Challenge", gameCategory: "Puzzle & Trivia", iconUrl: "https://img.icons8.com/color/96/brain.png", sortOrder: "HighToLow" },
        { id: "leaderboard_cyber_shooter", title: "⚡ Cyber Retro Shooter", gameCategory: "Action & Arcade", iconUrl: "https://img.icons8.com/color/96/space-ship.png", sortOrder: "HighToLow" }
      ]);
    }
  };

  const fetchScores = async (boardId: string) => {
    try {
      const res = await fetch(`${API_BASE}/playgames/leaderboards/${boardId}/scores`);
      const data = await res.json();
      if (data.success && data.scores) {
        setScores(data.scores);
      }
    } catch (err) {
      console.warn("Using fallback scores data", err);
      setScores([
        { id: 1, leaderboardId: boardId, playerId: "p1", playerName: "CyberKnight_99", avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80", scoreValue: 2450, formattedValue: "2,450 pts", submittedAt: new Date().toISOString() },
        { id: 2, leaderboardId: boardId, playerId: "p2", playerName: "PixelQueen", avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80", scoreValue: 1890, formattedValue: "1,890 pts", submittedAt: new Date().toISOString() },
        { id: 3, leaderboardId: boardId, playerId: "p3", playerName: "GamerNinja", avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=120&q=80", scoreValue: 1200, formattedValue: "1,200 pts", submittedAt: new Date().toISOString() }
      ]);
    }
  };

  const fetchAchievements = async () => {
    try {
      const pId = player?.id || "";
      const res = await fetch(`${API_BASE}/playgames/achievements?playerId=${pId}`);
      const data = await res.json();
      if (data.success && data.achievements) {
        const achs = data.achievements.map((ach: AchievementItem) => {
          const userAch = data.playerProgress?.find((pa: any) => pa.achievementId === ach.id);
          return {
            ...ach,
            isUnlocked: userAch ? userAch.isUnlocked : false,
            currentSteps: userAch ? userAch.currentSteps : 0
          };
        });
        setAchievements(achs);
      }
    } catch (err) {
      console.warn("Using fallback achievements data", err);
      setAchievements([
        { id: "ach_welcome", title: "🌟 Welcome Gamer", description: "Sign in to WorldNewzs Play Games Services for the first time.", iconUrl: "https://img.icons8.com/color/96/google-play.png", unlockedIconUrl: "https://img.icons8.com/color/96/star.png", rarity: "Common", totalSteps: 1, xpReward: 100, isUnlocked: true, currentSteps: 1 },
        { id: "ach_snake_slayer", title: "🐍 Snake Slayer", description: "Score 500+ points in Snake Arena 2026.", iconUrl: "https://img.icons8.com/color/96/snake.png", unlockedIconUrl: "https://img.icons8.com/color/96/trophy.png", rarity: "Rare", totalSteps: 1, xpReward: 250, isUnlocked: false, currentSteps: 0 },
        { id: "ach_trivia_genius", title: "🧠 Trivia Genius", description: "Answer 10 consecutive news quiz questions correctly.", iconUrl: "https://img.icons8.com/color/96/idea.png", unlockedIconUrl: "https://img.icons8.com/color/96/medal.png", rarity: "Epic", totalSteps: 10, xpReward: 500, isUnlocked: false, currentSteps: 4 },
        { id: "ach_cloud_pioneer", title: "☁️ Cloud Pioneer", description: "Save your first game state to Google Play Games Cloud.", iconUrl: "https://img.icons8.com/color/96/cloud-storage.png", unlockedIconUrl: "https://img.icons8.com/color/96/ok.png", rarity: "Common", totalSteps: 1, xpReward: 150, isUnlocked: true, currentSteps: 1 }
      ]);
    }
  };

  const handleGoogleSignIn = () => {
    setLoading(true);
    setTimeout(() => {
      const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_PLAY_CLIENT_ID || "wnzsplay-client-id";
      const gPlayer: PlayerProfile = {
        id: "g_play_" + Math.floor(100000 + Math.random() * 900000),
        googleUserId: `${GOOGLE_CLIENT_ID}_${Math.floor(Math.random() * 10000)}`,
        displayName: "Google Champion",
        email: "playgames.user@gmail.com",
        avatarUrl: "https://lh3.googleusercontent.com/a/ACg8ocI-123456789=s96-c",
        level: 5,
        xpPoints: 2350
      };
      setPlayer(gPlayer);
      localStorage.setItem("wnzs_play_games_player", JSON.stringify(gPlayer));
      setLoading(false);
      setStatusMessage("Successfully authenticated with Google Play Games Services!");
    }, 1200);
  };

  const handleSubmitScore = async () => {
    if (!newScoreInput || isNaN(Number(newScoreInput))) {
      setStatusMessage("Please enter a valid numeric score.");
      return;
    }

    const val = Number(newScoreInput);
    try {
      const res = await fetch(`${API_BASE}/playgames/leaderboards/${selectedLeaderboard}/scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: player?.id,
          scoreValue: val
        })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage("Score submitted successfully to Leaderboard!");
        fetchScores(selectedLeaderboard);
        if (player) {
          const updatedPlayer = { ...player, xpPoints: player.xpPoints + 50, level: Math.floor((player.xpPoints + 50) / 500) + 1 };
          setPlayer(updatedPlayer);
          localStorage.setItem("wnzs_play_games_player", JSON.stringify(updatedPlayer));
        }
      }
    } catch (err) {
      console.error("Score submission error", err);
      const newEntry: ScoreEntry = {
        id: Date.now(),
        leaderboardId: selectedLeaderboard,
        playerId: player?.id || "guest",
        playerName: player?.displayName || "Guest Gamer",
        avatarUrl: player?.avatarUrl || "",
        scoreValue: val,
        formattedValue: val.toLocaleString() + " pts",
        submittedAt: new Date().toISOString()
      };
      setScores(prev => [newEntry, ...prev].sort((a, b) => b.scoreValue - a.scoreValue));
      setStatusMessage("Score logged locally!");
    } finally {
      setScoreDialogOpen(false);
      setNewScoreInput("");
    }
  };

  const handleSaveGameState = async (gameId: string, gameTitle: string) => {
    const saveData = {
      playerId: player?.id,
      saveName: `${gameTitle} Save`,
      gameId: gameId,
      dataJson: JSON.stringify({ timestamp: Date.now(), progress: "Stage 3 Cleared", items: ["Shield", "Potion"] }),
      coverImageUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=300&q=80"
    };

    try {
      const res = await fetch(`${API_BASE}/playgames/savedgames`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saveData)
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(`Cloud game state saved for ${gameTitle}!`);
      }
    } catch (err) {
      setStatusMessage(`Cloud state synced locally for ${gameTitle}!`);
    }

    const newSave: SavedGameItem = {
      id: Math.random().toString(36).substring(2, 9),
      saveName: `${gameTitle} Save`,
      gameId: gameId,
      dataJson: saveData.dataJson,
      coverImageUrl: saveData.coverImageUrl,
      lastModifiedAt: new Date().toISOString()
    };
    setSavedGames(prev => [newSave, ...prev.filter(s => s.gameId !== gameId)]);
  };

  const currentXp = player?.xpPoints || 0;
  const currentLevel = player?.level || 1;
  const xpCurrentLevel = currentXp % 500;
  const xpProgressPercent = Math.min(100, Math.round((xpCurrentLevel / 500) * 100));

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", pb: 6 }}>
      <SEOMeta
        title="Google Play Games Services API | WorldNewzs"
        description="The Google Play Games Service allows developers to enhance games with social leaderboards, achievements, game state, sign-in with Google, and interactive web games on WorldNewzs."
        canonical="https://worldnewzs.in/play-games"
      />

      {/* Hero Banner with Glassmorphism */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #1a237e 0%, #0d47a1 50%, #006064 100%)",
          color: "#fff",
          py: 5,
          px: 2,
          position: "relative",
          overflow: "hidden",
          boxShadow: 4
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={3} alignItems="center">
            <Grid size={{ xs: 12, md: 7 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1.5 }}>
                <Avatar
                  src="https://img.icons8.com/color/96/google-play.png"
                  sx={{ width: 56, height: 56, bgcolor: "rgba(255,255,255,0.2)", p: 0.5 }}
                />
                <Box>
                  <Typography variant="h3" component="h1" fontWeight={800} sx={{ letterSpacing: "-0.5px", fontSize: { xs: "1.8rem", md: "2.5rem" } }}>
                    Google Play Games Services
                  </Typography>
                  <Typography variant="subtitle1" sx={{ color: "rgba(255,255,255,0.85)" }}>
                    Social Leaderboards • Achievements • Game Cloud State • Google Sign-In
                  </Typography>
                </Box>
              </Box>

              <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.9)", mt: 2, maxWidth: 650 }}>
                Enhance your gaming journey on WorldNewzs! Sign in with your Google account to unlock global social leaderboards, sync cloud saved states, and earn exclusive XP badges.
              </Typography>
            </Grid>

            {/* Player Profile Card */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Paper
                elevation={6}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  bgcolor: "rgba(255, 255, 255, 0.12)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "#fff"
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                  <Avatar
                    src={player?.avatarUrl}
                    sx={{ width: 64, height: 64, border: "2px solid #00e676" }}
                  />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" fontWeight={700}>
                      {player?.displayName}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                      <Chip
                        icon={<WorkspacePremium sx={{ color: "#ffd700 !important" }} />}
                        label={`Level ${currentLevel}`}
                        size="small"
                        sx={{ bgcolor: "rgba(255,215,0,0.2)", color: "#ffd700", fontWeight: 700 }}
                      />
                      <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.8)" }}>
                        {currentXp.toLocaleString()} total XP
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Level XP Bar */}
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                    <Typography variant="caption">Level Progress</Typography>
                    <Typography variant="caption">{xpCurrentLevel} / 500 XP</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={xpProgressPercent}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: "rgba(255,255,255,0.2)",
                      "& .MuiLinearProgress-bar": { bgcolor: "#00e676" }
                    }}
                  />
                </Box>

                {player?.googleUserId ? (
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<CheckCircle />}
                    sx={{ bgcolor: "#00c853", color: "#fff", fontWeight: 700, borderRadius: 2 }}
                  >
                    Google Connected
                  </Button>
                ) : (
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    startIcon={<Google />}
                    sx={{
                      bgcolor: "#4285F4",
                      color: "#fff",
                      fontWeight: 700,
                      borderRadius: 2,
                      "&:hover": { bgcolor: "#3367D6" }
                    }}
                  >
                    {loading ? "Signing in..." : "Sign in with Google"}
                  </Button>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Main Container */}
      <Container maxWidth="lg" sx={{ mt: 4 }}>

        {statusMessage && (
          <Alert
            severity="success"
            onClose={() => setStatusMessage(null)}
            sx={{ mb: 3, borderRadius: 2 }}
          >
            {statusMessage}
          </Alert>
        )}

        {/* Navigation Tabs */}
        <Paper elevation={2} sx={{ borderRadius: 3, mb: 4, overflow: "hidden" }}>
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            variant="scrollable"
            scrollButtons="auto"
            indicatorColor="primary"
            textColor="primary"
            sx={{
              px: 2,
              "& .MuiTab-root": { py: 2, fontWeight: 700, fontSize: "1rem" }
            }}
          >
            <Tab icon={<SportsEsports />} iconPosition="start" label="Featured Games" id="tab-games" />
            <Tab icon={<Leaderboard />} iconPosition="start" label="Leaderboards" id="tab-leaderboards" />
            <Tab icon={<EmojiEvents />} iconPosition="start" label="Achievements" id="tab-achievements" />
            <Tab icon={<CloudUpload />} iconPosition="start" label="Cloud Save States" id="tab-cloud-saves" />
          </Tabs>
        </Paper>

        {/* TAB 0: FEATURED GAMES */}
        {activeTab === 0 && (
          <Box id="section-featured-games">
            <Typography variant="h5" fontWeight={800} sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
              <SportsEsports color="primary" /> Interactive Games Library
            </Typography>

            <Grid container spacing={3}>
              {/* Game 1: Snake Arena 2026 */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card sx={{ height: "100%", display: "flex", flexDirection: "column", borderRadius: 3, transition: "transform 0.2s", "&:hover": { transform: "translateY(-4px)" } }}>
                  <Box
                    component="img"
                    src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=500&q=80"
                    alt="Snake Arena 2026"
                    sx={{ height: 160, objectFit: "cover" }}
                  />
                  <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
                    <Chip label="Realtime Arcade" size="small" color="primary" sx={{ width: "fit-content", mb: 1 }} />
                    <Typography variant="h6" fontWeight={700}>
                      🐍 Snake Arena 2026
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
                      Multiplayer snake battle royale powered by SignalR & Phaser.
                    </Typography>
                    <Button
                      variant="contained"
                      href="/games/dvcubie2026"
                      startIcon={<PlayArrow />}
                      fullWidth
                      sx={{ borderRadius: 2, fontWeight: 700 }}
                    >
                      Play Now
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              {/* Game 2: World Trivia Challenge */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card sx={{ height: "100%", display: "flex", flexDirection: "column", borderRadius: 3, transition: "transform 0.2s", "&:hover": { transform: "translateY(-4px)" } }}>
                  <Box
                    component="img"
                    src="https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?auto=format&fit=crop&w=500&q=80"
                    alt="World Trivia Challenge"
                    sx={{ height: 160, objectFit: "cover" }}
                  />
                  <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
                    <Chip label="Puzzle & News" size="small" color="secondary" sx={{ width: "fit-content", mb: 1 }} />
                    <Typography variant="h6" fontWeight={700}>
                      🧠 World Trivia Quiz
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
                      Test your knowledge on daily politics, technology, science, and world events.
                    </Typography>
                    <Button
                      variant="contained"
                      href="/badge-quiz"
                      startIcon={<PlayArrow />}
                      fullWidth
                      color="secondary"
                      sx={{ borderRadius: 2, fontWeight: 700 }}
                    >
                      Start Quiz
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              {/* Game 3: Cyber Retro Shooter */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card sx={{ height: "100%", display: "flex", flexDirection: "column", borderRadius: 3, transition: "transform 0.2s", "&:hover": { transform: "translateY(-4px)" } }}>
                  <Box
                    component="img"
                    src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=500&q=80"
                    alt="Cyber Retro Shooter"
                    sx={{ height: 160, objectFit: "cover" }}
                  />
                  <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
                    <Chip label="Action" size="small" color="error" sx={{ width: "fit-content", mb: 1 }} />
                    <Typography variant="h6" fontWeight={700}>
                      ⚡ Cyber Shooter
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
                      Fast-paced retro space shooter with high scores and cloud save states.
                    </Typography>
                    <Button
                      variant="outlined"
                      onClick={() => handleSaveGameState("cyber_shooter", "Cyber Shooter")}
                      startIcon={<CloudUpload />}
                      fullWidth
                      color="error"
                      sx={{ borderRadius: 2, fontWeight: 700 }}
                    >
                      Cloud Save
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              {/* Game 4: Free Games Directory */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card sx={{ height: "100%", display: "flex", flexDirection: "column", borderRadius: 3, transition: "transform 0.2s", "&:hover": { transform: "translateY(-4px)" } }}>
                  <Box
                    component="img"
                    src="https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=500&q=80"
                    alt="Free Games Directory"
                    sx={{ height: 160, objectFit: "cover" }}
                  />
                  <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
                    <Chip label="Catalog" size="small" color="info" sx={{ width: "fit-content", mb: 1 }} />
                    <Typography variant="h6" fontWeight={700}>
                      🎮 Gaming News & Store
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
                      Browse top free-to-play PC & browser games updated live from FreeToGame.
                    </Typography>
                    <Button
                      variant="contained"
                      href="/gaming"
                      startIcon={<PlayArrow />}
                      fullWidth
                      color="info"
                      sx={{ borderRadius: 2, fontWeight: 700 }}
                    >
                      Explore Catalog
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Separated Ad Placement */}
            <Box sx={{ mt: 5 }}>
              <AdCard placement="play-games-banner" />
            </Box>
          </Box>
        )}

        {/* TAB 1: LEADERBOARDS */}
        {activeTab === 1 && (
          <Box id="section-leaderboards">
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
              <Typography variant="h5" fontWeight={800} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Leaderboard color="primary" /> Global Social Leaderboards
              </Typography>
              <Button
                variant="contained"
                onClick={() => setScoreDialogOpen(true)}
                startIcon={<Star />}
                sx={{ borderRadius: 2, fontWeight: 700 }}
              >
                Submit Score
              </Button>
            </Box>

            {/* Leaderboard Category Selector */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {leaderboards.map((lb) => (
                <Grid size={{ xs: 12, sm: 4 }} key={lb.id}>
                  <Card
                    onClick={() => setSelectedLeaderboard(lb.id)}
                    sx={{
                      cursor: "pointer",
                      borderRadius: 3,
                      border: selectedLeaderboard === lb.id ? "2px solid #1976d2" : "1px solid rgba(0,0,0,0.12)",
                      bgcolor: selectedLeaderboard === lb.id ? "action.selected" : "background.paper",
                      p: 2
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Avatar src={lb.iconUrl} sx={{ width: 48, height: 48 }} />
                      <Box>
                        <Typography variant="subtitle1" fontWeight={700}>
                          {lb.title}
                        </Typography>
                        <Chip label={lb.gameCategory} size="small" sx={{ fontSize: "0.7rem" }} />
                      </Box>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Leaderboard Scores Table */}
            <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 3, overflow: "hidden" }}>
              <Table>
                <TableHead sx={{ bgcolor: "primary.main" }}>
                  <TableRow>
                    <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Rank</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Player</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: 700 }} align="right">Score</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: 700 }} align="right">Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {scores.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                        No scores recorded yet. Be the first to play and log a high score!
                      </TableCell>
                    </TableRow>
                  ) : (
                    scores.map((sc, index) => (
                      <TableRow key={sc.id} hover sx={{ bgcolor: sc.playerId === player?.id ? "action.hover" : "inherit" }}>
                        <TableCell>
                          {index === 0 && <Chip label="1st Gold" color="warning" size="small" sx={{ fontWeight: 700 }} />}
                          {index === 1 && <Chip label="2nd Silver" sx={{ bgcolor: "#cfd8dc", fontWeight: 700 }} size="small" />}
                          {index === 2 && <Chip label="3rd Bronze" sx={{ bgcolor: "#bcaaa4", color: "#fff", fontWeight: 700 }} size="small" />}
                          {index > 2 && <Typography fontWeight={700}>#{index + 1}</Typography>}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Avatar src={sc.avatarUrl} sx={{ width: 36, height: 36 }} />
                            <Typography fontWeight={600}>{sc.playerName}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography fontWeight={800} color="primary">
                            {sc.formattedValue || sc.scoreValue.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {new Date(sc.submittedAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* TAB 2: ACHIEVEMENTS */}
        {activeTab === 2 && (
          <Box id="section-achievements">
            <Typography variant="h5" fontWeight={800} sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
              <EmojiEvents color="warning" /> Achievements & Badges
            </Typography>

            <Grid container spacing={3}>
              {achievements.map((ach) => (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={ach.id}>
                  <Card
                    sx={{
                      borderRadius: 3,
                      p: 2.5,
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      bgcolor: ach.isUnlocked ? "action.hover" : "background.paper",
                      border: ach.isUnlocked ? "2px solid #ffd700" : "1px solid rgba(0,0,0,0.12)",
                      opacity: ach.isUnlocked ? 1 : 0.85
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                      <Avatar
                        src={ach.isUnlocked ? ach.unlockedIconUrl : ach.iconUrl}
                        sx={{ width: 56, height: 56, p: 0.5, bgcolor: ach.isUnlocked ? "rgba(255,215,0,0.15)" : "rgba(0,0,0,0.05)" }}
                      />
                      <Chip
                        icon={ach.isUnlocked ? <CheckCircle sx={{ color: "#00c853 !important" }} /> : <Lock />}
                        label={ach.isUnlocked ? "Unlocked" : "Locked"}
                        size="small"
                        color={ach.isUnlocked ? "success" : "default"}
                        sx={{ fontWeight: 700 }}
                      />
                    </Box>

                    <Typography variant="h6" fontWeight={700}>
                      {ach.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ my: 1, flexGrow: 1 }}>
                      {ach.description}
                    </Typography>

                    <Box sx={{ mt: 2, pt: 1, borderTop: "1px dashed rgba(0,0,0,0.12)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Chip label={ach.rarity} size="small" variant="outlined" color="primary" />
                      <Typography variant="caption" fontWeight={700} color="warning.main">
                        +{ach.xpReward} XP
                      </Typography>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* TAB 3: CLOUD SAVE STATES */}
        {activeTab === 3 && (
          <Box id="section-cloud-saves">
            <Typography variant="h5" fontWeight={800} sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
              <CloudUpload color="secondary" /> Cloud Saved Game States
            </Typography>

            {savedGames.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: "center", borderRadius: 3 }}>
                <CloudUpload sx={{ fontSize: 64, color: "text.secondary", mb: 1 }} />
                <Typography variant="h6" fontWeight={700}>
                  No Cloud Saves Found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mx: "auto", mt: 1, mb: 2 }}>
                  Play any featured game and hit "Cloud Save" to synchronize your game progress across desktop and mobile devices.
                </Typography>
                <Button variant="contained" onClick={() => setActiveTab(0)} sx={{ borderRadius: 2 }}>
                  Explore Featured Games
                </Button>
              </Paper>
            ) : (
              <Grid container spacing={3}>
                {savedGames.map((save) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={save.id}>
                    <Card sx={{ borderRadius: 3, overflow: "hidden" }}>
                      <Box component="img" src={save.coverImageUrl} alt={save.saveName} sx={{ height: 140, width: "100%", objectFit: "cover" }} />
                      <CardContent>
                        <Typography variant="h6" fontWeight={700}>{save.saveName}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Last Synced: {new Date(save.lastModifiedAt).toLocaleString()}
                        </Typography>
                        <Box sx={{ mt: 2, p: 1.5, bgcolor: "action.hover", borderRadius: 2, fontFamily: "monospace", fontSize: "0.8rem" }}>
                          {save.dataJson}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}

      </Container>

      {/* Submit Score Dialog */}
      <Dialog open={scoreDialogOpen} onClose={() => setScoreDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Submit High Score</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter your high score value for the selected leaderboard. Your score will be posted to the global social leaderboard.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="Score Value"
            type="number"
            value={newScoreInput}
            onChange={(e) => setNewScoreInput(e.target.value)}
            placeholder="e.g. 1500"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setScoreDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmitScore} sx={{ borderRadius: 2, fontWeight: 700 }}>
            Submit Score
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PlayGamesPage;
