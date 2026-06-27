import React, { useState, useEffect, useRef } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Paper from "@mui/material/Paper";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import StarIcon from "@mui/icons-material/Star";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ShareIcon from "@mui/icons-material/Share";
import RefreshIcon from "@mui/icons-material/Refresh";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import MouseIcon from "@mui/icons-material/Mouse";
import CircularProgress from "@mui/material/CircularProgress";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { Link } from "react-router-dom";
import Phaser from "phaser";
import { HubConnectionBuilder, HubConnectionState } from "@microsoft/signalr";
import Cubie2048Scene from "./Cubie2048Scene";
import { SEOMeta } from "../../seo/SEOMeta";
import { apiClient } from "../../api/apiClient";
import { useKeywords } from "../../seo/useKeywords";

// Base API and Hub URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "https://worldnewzs.onrender.com/api";
const HUB_URL = API_BASE_URL.replace("/api", "") + "/hubs/leaderboard";

interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
}

interface LeaderboardScore {
  id: number;
  username: string;
  points: number;
  createdAt: string;
}

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: "first_drop", name: "First Drop", description: "Drop your very first cube", unlocked: false },
  { id: "merge_master", name: "Merge Master", description: "Perform a cube merge operation", unlocked: false },
  { id: "double_digit", name: "Double Digit", description: "Create a 16 cube", unlocked: false },
  { id: "triple_digit", name: "Triple Digit", description: "Create a 128 cube", unlocked: false },
  { id: "halfway_there", name: "Halfway There", description: "Create a 512 cube", unlocked: false },
  { id: "dvcubie_legend", name: "DVCubie Legend", description: "Create the ultimate 2048 cube!", unlocked: false },
];

const getCubeColorForPreview = (value: number): string => {
  const colorMap: Record<number, string> = {
    2: "#e2e8f0",
    4: "#fde68a",
    8: "#fed7aa",
    16: "#fecaca",
    32: "#fbcfe8",
    64: "#e9d5ff",
    128: "#bfdbfe",
    256: "#99f6e4",
    512: "#bae6fd",
    1024: "#bbf7d0",
    2048: "#fef08a",
    4096: "#475569",
    8192: "#1e293b",
  };
  return colorMap[value] || "#0f172a";
};

const getCubeTextColorForPreview = (value: number): string => {
  const colorMap: Record<number, string> = {
    2: "#334155",
    4: "#92400e",
    8: "#ea580c",
    16: "#dc2626",
    32: "#db2777",
    64: "#9333ea",
    128: "#2563eb",
    256: "#0d9488",
    512: "#0284c7",
    1024: "#16a34a",
    2048: "#ca8a04",
    4096: "#f8fafc",
    8192: "#f8fafc",
  };
  return colorMap[value] || "#ffffff";
};

const GameWrapper: React.FC = () => {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  // States
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [nextCube, setNextCube] = useState<number>(2);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardScore[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState<boolean>(false);
  const [achievements, setAchievements] = useState<Achievement[]>(INITIAL_ACHIEVEMENTS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // SEO Keywords
  const dynamicKeywordsData = useKeywords("gaming");
  const defaultKeywords = ["DVCubie2026", "Cubie2048", "Suika game online", "merge 2048 game", "Phaser game", "React arcade"];
  const combinedKeywords = dynamicKeywordsData
    ? [...new Set([...defaultKeywords, ...dynamicKeywordsData.primary, ...dynamicKeywordsData.longtail, ...dynamicKeywordsData.trending])]
    : defaultKeywords;

  // Synthesize game sound effects using Web Audio API
  const playSound = (type: "drop" | "merge" | "gameover") => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "drop") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } else if (type === "merge") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === "gameover") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(180, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(60, ctx.currentTime + 0.6);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.6);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      }
    } catch (e) {
      console.warn("Web Audio API not supported or initialized: ", e);
    }
  };

  // Load High Score & Achievements
  useEffect(() => {
    const savedHighScore = localStorage.getItem("dvcubie2026_highscore");
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }

    const savedAchievements = localStorage.getItem("dvcubie2026_achievements");
    if (savedAchievements) {
      try {
        const parsed = JSON.parse(savedAchievements) as Record<string, boolean>;
        setAchievements((prev) =>
          prev.map((ach) => ({
            ...ach,
            unlocked: !!parsed[ach.id],
          }))
        );
      } catch (e) {
        console.error("Error parsing achievements", e);
      }
    }

    fetchLeaderboard();
    setupSignalR();

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  // Fetch Leaderboard scores
  const fetchLeaderboard = async () => {
    setLeaderboardLoading(true);
    try {
      const res = await apiClient.get("/game/leaderboard");
      setLeaderboard(res.data || []);
    } catch (err) {
      console.error("Failed to load leaderboard scores:", err);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  // Setup SignalR Hub connection
  const setupSignalR = async () => {
    let hubUrlClean = HUB_URL;
    // Check if relative path or production server URL
    if (hubUrlClean.startsWith("/")) {
      hubUrlClean = window.location.origin + hubUrlClean;
    }

    const connection = new HubConnectionBuilder()
      .withUrl(hubUrlClean)
      .withAutomaticReconnect()
      .build();

    try {
      await connection.start();
      console.log("✓ Connected to SignalR LeaderboardHub");

      connection.on("UpdateLeaderboard", () => {
        console.log("⚡ SignalR Leaderboard updated!");
        fetchLeaderboard();
      });
    } catch (err) {
      console.warn("SignalR connection failed, falling back to polling:", err);
      // Fallback polling every 30s
      const interval = setInterval(fetchLeaderboard, 30000);
      return () => clearInterval(interval);
    }

    return () => {
      if (connection.state === HubConnectionState.Connected) {
        connection.stop();
      }
    };
  };

  // Mount Phaser Game Instance
  useEffect(() => {
    if (!gameContainerRef.current || gameRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 400,
      height: 600,
      parent: gameContainerRef.current,
      physics: {
        default: "arcade",
        arcade: {
          gravity: { x: 0, y: 350 },
          debug: false,
        },
      },
      scene: [Cubie2048Scene],
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    // Listen to game events
    game.events.on("next-cube-changed", (nextVal: number) => {
      setNextCube(nextVal);
      playSound("drop");
      unlockAchievement("first_drop");
    });

    game.events.on("score-changed", (newScore: number) => {
      setScore(newScore);
    });

    game.events.on("cube-merged", (data: { scoreAwarded: number; mergedValue: number }) => {
      playSound("merge");
      unlockAchievement("merge_master");

      if (data.mergedValue >= 16) unlockAchievement("double_digit");
      if (data.mergedValue >= 128) unlockAchievement("triple_digit");
      if (data.mergedValue >= 512) unlockAchievement("halfway_there");
      if (data.mergedValue >= 2048) unlockAchievement("dvcubie_legend");
    });

    game.events.on("game-over", (finalScore: number) => {
      playSound("gameover");
      setIsGameOver(true);
      setShowSubmitDialog(true);

      // Check high score
      const savedHighScore = localStorage.getItem("dvcubie2026_highscore");
      const currentHigh = savedHighScore ? parseInt(savedHighScore, 10) : 0;
      if (finalScore > currentHigh) {
        localStorage.setItem("dvcubie2026_highscore", finalScore.toString());
        setHighScore(finalScore);
      }
    });

    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
  }, []);

  // Unlock achievements helper
  const unlockAchievement = (id: string) => {
    setAchievements((prev) => {
      const exists = prev.find((ach) => ach.id === id);
      if (exists && !exists.unlocked) {
        const updated = prev.map((ach) =>
          ach.id === id ? { ...ach, unlocked: true, unlockedAt: new Date().toLocaleTimeString() } : ach
        );

        // Persist to localstorage
        const persistenceMap: Record<string, boolean> = {};
        updated.forEach((a) => {
          persistenceMap[a.id] = a.unlocked;
        });
        localStorage.setItem("dvcubie2026_achievements", JSON.stringify(persistenceMap));

        // Display toast alert
        showToast(`🏆 Achievement Unlocked: ${exists.name}!`);
        return updated;
      }
      return prev;
    });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Submit high score to backend
  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await apiClient.post("/game/score", {
        username: username.trim(),
        points: score,
      });
      setShowSubmitDialog(false);
      setUsername("");
      fetchLeaderboard();
      showToast("🚀 Score submitted successfully!");
    } catch (err: any) {
      console.error("Failed to submit score:", err);
      alert(err.message || "Failed to submit score. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Restart Game
  const handleRestart = () => {
    setIsGameOver(false);
    setScore(0);
    if (gameRef.current) {
      gameRef.current.scene.keys.Cubie2048Scene.scene.restart();
    }
  };

  // Social Share Twitter/X
  const shareOnTwitter = () => {
    const text = `I just scored ${score} points in DVCubie2026! Can you beat my high score? Play it now on WorldNewzs!`;
    const url = window.location.href;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank");
  };

  return (
    <>
      <SEOMeta
        title="DVCubie2026 - original 2048 Cube Physics Drop & Merge Game"
        description="Drop, bounce, and merge matching cubes in this physics puzzle. Unlock achievements, stack scores, and rise on our live real-time leaderboard!"
        keywords={combinedKeywords}
        ogType="website"
      />

      <Box
        sx={{
          minHeight: "90vh",
          background: "radial-gradient(circle, #13122c 0%, #070714 100%)",
          color: "#f1f5f9",
          py: 4,
          fontFamily: '"Outfit", sans-serif',
        }}
      >
        <Container maxWidth="xl">
          {/* Back button */}
          <Box mb={3} display="flex" justifyContent="flex-start">
            <Button
              component={Link}
              to="/gaming"
              variant="text"
              startIcon={<ArrowBackIcon />}
              sx={{
                color: "#94a3b8",
                textTransform: "none",
                fontWeight: "600",
                "&:hover": { color: "#ec4899" },
              }}
              id="back-to-gaming-btn"
            >
              Back to Games Directory
            </Button>
          </Box>

          {/* Toast Notification */}
          {toastMessage && (
            <Box
              sx={{
                position: "fixed",
                bottom: 24,
                left: 24,
                zIndex: 2000,
                background: "linear-gradient(to right, #ec4899, #8b5cf6)",
                borderRadius: "12px",
                p: "16px 24px",
                boxShadow: "0 10px 25px rgba(236, 72, 153, 0.4)",
                display: "flex",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <EmojiEventsIcon sx={{ color: "#fff" }} />
              <Typography variant="body1" fontWeight="700" sx={{ color: "#fff" }}>
                {toastMessage}
              </Typography>
            </Box>
          )}

          {/* Page Title & Dashboard */}
          <Box textAlign="center" mb={4}>
            <Typography
              variant="h3"
              component="h1"
              fontWeight="900"
              sx={{
                background: "linear-gradient(to right, #a855f7, #f43f5e)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                mb: 1,
                fontSize: { xs: "2.2rem", md: "3.5rem" },
                letterSpacing: "-0.05em",
              }}
            >
              DVCubie2026
            </Typography>
            <Typography variant="subtitle1" color="textSecondary" sx={{ color: "#94a3b8" }}>
              The Ultimate 2048 Cube Physics Drop & Merge Challenge
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {/* LEFT COLUMN: Controls & Achievements */}
            <Grid size={{ xs: 12, lg: 3 }}>
              <Box display="flex" flexDirection="column" gap={3}>
                {/* Score panel */}
                <Card
                  sx={{
                    background: "rgba(30, 27, 75, 0.4)",
                    backdropFilter: "blur(12px)",
                    borderRadius: "16px",
                    border: "1px solid rgba(168, 85, 247, 0.2)",
                    color: "#fff",
                  }}
                >
                  <CardContent sx={{ textAlign: "center", p: 3 }}>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                          SCORE
                        </Typography>
                        <Typography variant="h4" fontWeight="800" sx={{ color: "#ec4899" }} id="game-active-score">
                          {score}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                          BEST SCORE
                        </Typography>
                        <Typography variant="h4" fontWeight="800" sx={{ color: "#f59e0b" }} id="game-high-score">
                          {highScore}
                        </Typography>
                      </Grid>
                    </Grid>

                    <Box mt={3} p={1.5} sx={{ background: "rgba(15, 23, 42, 0.5)", borderRadius: "12px", border: "1px dashed rgba(168, 85, 247, 0.3)" }}>
                      <Typography variant="caption" sx={{ color: "#94a3b8", display: "block", mb: 1 }}>
                        NEXT CUBE
                      </Typography>
                      <Box display="flex" justifyContent="center">
                        <Box
                          sx={{
                            width: 50,
                            height: 50,
                            borderRadius: "10px",
                            backgroundColor: getCubeColorForPreview(nextCube),
                            color: getCubeTextColorForPreview(nextCube),
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.2rem",
                            fontWeight: "800",
                            boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
                            border: nextCube === 2048 ? "2px solid #ca8a04" : "1px solid rgba(255,255,255,0.2)",
                          }}
                        >
                          {nextCube}
                        </Box>
                      </Box>
                    </Box>
                    {isGameOver && (
                      <Box mt={2}>
                        <Typography variant="body2" fontWeight="700" color="error">
                          GAME OVER! Submit your score.
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>

                {/* Instructions */}
                <Card
                  sx={{
                    background: "rgba(30, 27, 75, 0.4)",
                    backdropFilter: "blur(12px)",
                    borderRadius: "16px",
                    border: "1px solid rgba(168, 85, 247, 0.2)",
                    color: "#fff",
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight="700" mb={2} sx={{ color: "#a855f7" }}>
                      How to Play
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemIcon>
                          <MouseIcon sx={{ color: "#ec4899" }} />
                        </ListItemIcon>
                        <ListItemText
                          primary="Aim & Drop"
                          secondary="Move mouse or slide finger to position, Left Click or tap to drop cube."
                          secondaryTypographyProps={{ style: { color: "#94a3b8" } }}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <StarIcon sx={{ color: "#f59e0b" }} />
                        </ListItemIcon>
                        <ListItemText
                          primary="Merge Cubes"
                          secondary="Collide cubes of the same number to merge them into a higher value (e.g. 2+2=4, 4+4=8)."
                          secondaryTypographyProps={{ style: { color: "#94a3b8" } }}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <EmojiEventsIcon sx={{ color: "#10b981" }} />
                        </ListItemIcon>
                        <ListItemText
                          primary="Keep Below Red Line"
                          secondary="Cubes must stay below the dotted red warning line at the top. 3 seconds above = Game Over!"
                          secondaryTypographyProps={{ style: { color: "#94a3b8" } }}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>

                {/* Achievements panel */}
                <Card
                  sx={{
                    background: "rgba(30, 27, 75, 0.4)",
                    backdropFilter: "blur(12px)",
                    borderRadius: "16px",
                    border: "1px solid rgba(168, 85, 247, 0.2)",
                    color: "#fff",
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight="700" mb={1} sx={{ color: "#a855f7" }}>
                      Achievements
                    </Typography>
                    <List dense>
                      {achievements.map((ach) => (
                        <ListItem key={ach.id} sx={{ px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            {ach.unlocked ? (
                              <CheckCircleIcon sx={{ color: "#10b981", fontSize: 20 }} />
                            ) : (
                              <RadioButtonUncheckedIcon sx={{ color: "#475569", fontSize: 20 }} />
                            )}
                          </ListItemIcon>
                          <ListItemText
                            primary={ach.name}
                            primaryTypographyProps={{ style: { fontWeight: "700", color: ach.unlocked ? "#fff" : "#94a3b8" } }}
                            secondary={ach.description}
                            secondaryTypographyProps={{ style: { color: "#64748b", fontSize: "0.8rem" } }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Box>
            </Grid>

            {/* CENTER COLUMN: Phaser Game Board */}
            <Grid size={{ xs: 12, md: 7, lg: 5 }} display="flex" justifyContent="center">
              <Box display="flex" flexDirection="column" alignItems="center">
                <Paper
                  elevation={12}
                  sx={{
                    p: 1.5,
                    background: "linear-gradient(135deg, #1e1b4b 0%, #311042 100%)",
                    borderRadius: "24px",
                    boxShadow: "0 0 40px rgba(168, 85, 247, 0.5)",
                    border: "2px solid rgba(236, 72, 153, 0.3)",
                    overflow: "hidden",
                    width: 424,
                    height: 624,
                  }}
                >
                  <div
                    ref={gameContainerRef}
                    id="phaser-dvcubie2026-container"
                    style={{
                      width: 400,
                      height: 600,
                      borderRadius: "16px",
                      overflow: "hidden",
                    }}
                  />
                </Paper>

                <Box mt={3} display="flex" gap={2}>
                  <Button
                    variant="contained"
                    onClick={handleRestart}
                    sx={{
                      borderRadius: "10px",
                      background: "linear-gradient(to right, #8b5cf6, #ec4899)",
                      textTransform: "none",
                      fontWeight: "700",
                      px: 3,
                    }}
                    id="restart-game-btn"
                  >
                    Restart Game
                  </Button>

                  <Button
                    variant="outlined"
                    startIcon={<ShareIcon />}
                    onClick={shareOnTwitter}
                    sx={{
                      borderRadius: "10px",
                      borderColor: "rgba(255, 255, 255, 0.2)",
                      color: "#fff",
                      textTransform: "none",
                      "&:hover": { borderColor: "#ec4899" },
                    }}
                    id="share-game-btn"
                  >
                    Share Score
                  </Button>
                </Box>
              </Box>
            </Grid>

            {/* RIGHT COLUMN: Real-Time Leaderboard */}
            <Grid size={{ xs: 12, md: 5, lg: 4 }}>
              <Card
                sx={{
                  background: "rgba(30, 27, 75, 0.4)",
                  backdropFilter: "blur(12px)",
                  borderRadius: "16px",
                  border: "1px solid rgba(168, 85, 247, 0.2)",
                  color: "#fff",
                  height: "100%",
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" fontWeight="700" sx={{ color: "#a855f7" }}>
                      🏆 Live Leaderboard
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<RefreshIcon />}
                      onClick={fetchLeaderboard}
                      sx={{ color: "#ec4899", textTransform: "none", minWidth: 0 }}
                      id="refresh-leaderboard-btn"
                    >
                      Sync
                    </Button>
                  </Box>

                  {leaderboardLoading ? (
                    <Box display="flex" justifyContent="center" py={8}>
                      <CircularProgress size={40} sx={{ color: "#ec4899" }} />
                    </Box>
                  ) : leaderboard.length === 0 ? (
                    <Box textAlign="center" py={8} sx={{ color: "#64748b" }}>
                      No scores recorded yet. Be the first to secure a spot!
                    </Box>
                  ) : (
                    <TableContainer component={Box} sx={{ background: "transparent" }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ color: "#94a3b8", fontWeight: "700", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>Rank</TableCell>
                            <TableCell sx={{ color: "#94a3b8", fontWeight: "700", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>Player</TableCell>
                            <TableCell align="right" sx={{ color: "#94a3b8", fontWeight: "700", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>Score</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {leaderboard.map((scoreRow, idx) => {
                            const isTop3 = idx < 3;
                            const colors = ["#f59e0b", "#94a3b8", "#b45309"]; // Gold, Silver, Bronze
                            return (
                              <TableRow key={scoreRow.id} sx={{ "&:hover": { background: "rgba(255,255,255,0.03)" } }}>
                                <TableCell sx={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                  {isTop3 ? (
                                    <Box display="flex" alignItems="center" gap={0.5}>
                                      <StarIcon sx={{ color: colors[idx], fontSize: 18 }} />
                                      <Typography variant="body2" fontWeight="800" sx={{ color: colors[idx] }}>
                                        {idx + 1}
                                      </Typography>
                                    </Box>
                                  ) : (
                                    <Typography variant="body2" sx={{ color: "#64748b", pl: 1 }}>
                                      {idx + 1}
                                    </Typography>
                                  )}
                                </TableCell>
                                <TableCell sx={{ fontWeight: isTop3 ? "800" : "500", color: "#f1f5f9", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                  {scoreRow.username}
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: "800", color: isTop3 ? "#ec4899" : "#a855f7", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                  {scoreRow.points}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* GAME OVER SUBMIT SCORE DIALOG */}
      <Dialog
        open={showSubmitDialog}
        onClose={() => setShowSubmitDialog(false)}
        PaperProps={{
          sx: {
            background: "linear-gradient(135deg, #1e1b4b 0%, #111827 100%)",
            border: "1px solid rgba(168, 85, 247, 0.4)",
            borderRadius: "20px",
            color: "#fff",
            p: 2,
          },
        }}
      >
        <DialogTitle sx={{ textAlign: "center", pb: 1 }}>
          <EmojiEventsIcon sx={{ fontSize: 44, color: "#f59e0b", mb: 1 }} />
          <Typography variant="h5" fontWeight="800">
            Game Over!
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" textAlign="center" mb={3} sx={{ color: "#94a3b8" }}>
            You scored a fantastic <strong style={{ color: "#ec4899", fontSize: "1.4rem" }}>{score}</strong> points!
            Submit your score to lock your place on the live leaderboard.
          </Typography>
          <form onSubmit={handleSubmitScore} id="score-submission-form">
            <TextField
              fullWidth
              variant="outlined"
              label="Enter Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Player1"
              required
              id="score-username-input"
              InputProps={{
                style: { color: "#fff", backgroundColor: "rgba(0,0,0,0.2)" },
              }}
              InputLabelProps={{
                style: { color: "#a855f7" },
              }}
            />
          </form>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, justifyContent: "space-between" }}>
          <Button
            onClick={() => setShowSubmitDialog(false)}
            sx={{ color: "#94a3b8", textTransform: "none" }}
            id="score-submit-cancel"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="score-submission-form"
            variant="contained"
            disabled={isSubmitting}
            sx={{
              background: "linear-gradient(to right, #ec4899, #8b5cf6)",
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: "700",
            }}
            id="score-submit-confirm"
          >
            {isSubmitting ? "Submitting..." : "Submit Score"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default GameWrapper;
