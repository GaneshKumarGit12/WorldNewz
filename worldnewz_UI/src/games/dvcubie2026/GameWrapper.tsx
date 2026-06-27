import React, { useState, useEffect, useRef } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
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
import MenuIcon from "@mui/icons-material/Menu";
import SpeedIcon from "@mui/icons-material/Speed";
import { Link } from "react-router-dom";
import Phaser from "phaser";
import { HubConnectionBuilder, HubConnectionState } from "@microsoft/signalr";
import DVCubie2026Scene from "./DVCubie2026Scene";
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
}

interface LeaderboardScore {
  id: number;
  username: string;
  points: number;
  createdAt: string;
}

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: "first_merge", name: "First Eat", description: "Collect your first block in the arena", unlocked: false },
  { id: "snake_grow", name: "Growth Spurt", description: "Create a tail chain of 3 blocks", unlocked: false },
  { id: "double_digit", name: "Double Digit", description: "Merge your head block to 16", unlocked: false },
  { id: "triple_digit", name: "Triple Digit", description: "Merge your head block to 128", unlocked: false },
  { id: "legendary_merge", name: "Arena Legend", description: "Merge your head block to 1024!", unlocked: false },
];

const GameWrapper: React.FC = () => {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  // States
  const [score, setScore] = useState<number>(4);
  const [highScore, setHighScore] = useState<number>(0);
  const [boostCooldown, setBoostCooldown] = useState<number>(100);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardScore[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState<boolean>(false);
  const [achievements, setAchievements] = useState<Achievement[]>(INITIAL_ACHIEVEMENTS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Responsive sidebar toggles
  const [showLeftSidebar, setShowLeftSidebar] = useState<boolean>(true);
  const [showRightSidebar, setShowRightSidebar] = useState<boolean>(true);

  // UI Hiding states
  const [hideSearch, setHideSearch] = useState<boolean>(() => {
    return localStorage.getItem("dvcubie_hide_search") !== "false";
  });
  const [hideBadges, setHideBadges] = useState<boolean>(() => {
    return localStorage.getItem("dvcubie_hide_badges") !== "false";
  });

  // SEO Keywords
  const dynamicKeywordsData = useKeywords("gaming");
  const defaultKeywords = ["DVCubie2026", "Cubes 2048.io", "snake 2048 game", "merge cubes online", "Phaser .io game", "React snake game"];
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
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === "merge") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(330, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.12);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } else if (type === "gameover") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(140, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(40, ctx.currentTime + 0.55);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.55);
        osc.start();
        osc.stop(ctx.currentTime + 0.55);
      }
    } catch (e) {
      console.warn("Web Audio API not initialized:", e);
    }
  };

  // Load High Score, Achievements, and trigger initial event sync
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

    // Force dispatching header visibility preferences at start
    dispatchHeaderSettings(hideSearch, hideBadges);

    fetchLeaderboard();
    setupSignalR();

    // Default sidebars on small screens to hidden
    if (window.innerWidth < 960) {
      setShowLeftSidebar(false);
      setShowRightSidebar(false);
    }

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
      // Re-enable layout elements on navigate-away
      dispatchHeaderSettings(false, false);
    };
  }, []);

  const dispatchHeaderSettings = (hideSearchVal: boolean, hideBadgesVal: boolean) => {
    localStorage.setItem("dvcubie_hide_search", hideSearchVal ? "true" : "false");
    localStorage.setItem("dvcubie_hide_badges", hideBadgesVal ? "true" : "false");
    window.dispatchEvent(new CustomEvent("dvcubie-settings-changed"));
  };

  const handleToggleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.checked;
    setHideSearch(val);
    dispatchHeaderSettings(val, hideBadges);
  };

  const handleToggleBadges = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.checked;
    setHideBadges(val);
    dispatchHeaderSettings(hideSearch, val);
  };

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
        fetchLeaderboard();
      });
    } catch (err) {
      console.warn("SignalR connection failed, falling back to polling:", err);
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

    // Fetch container dimensions to match resolution precisely
    const width = gameContainerRef.current.clientWidth || 400;
    const height = gameContainerRef.current.clientHeight || 500;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: width,
      height: height,
      parent: gameContainerRef.current,
      physics: {
        default: "arcade",
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
      scene: [DVCubie2026Scene],
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    // Listen to game events
    game.events.on("score-changed", (newScore: number) => {
      setScore(newScore);
    });

    game.events.on("boost-cooldown-changed", (val: number) => {
      setBoostCooldown(val);
    });

    game.events.on("toast-alert", (msg: string) => {
      showToast(msg);
    });

    game.events.on("cube-merged", (data: { scoreAwarded: number; mergedValue: number }) => {
      playSound("merge");
      unlockAchievement("first_merge");

      if (data.mergedValue >= 16) unlockAchievement("double_digit");
      if (data.mergedValue >= 128) unlockAchievement("triple_digit");
      if (data.mergedValue >= 1024) unlockAchievement("legendary_merge");
    });

    game.events.on("game-over", (finalScore: number) => {
      playSound("gameover");
      setIsGameOver(true);
      setShowSubmitDialog(true);

      const savedHighScore = localStorage.getItem("dvcubie2026_highscore");
      const currentHigh = savedHighScore ? parseInt(savedHighScore, 10) : 0;
      if (finalScore > currentHigh) {
        localStorage.setItem("dvcubie2026_highscore", finalScore.toString());
        setHighScore(finalScore);
      }
    });

    // Resize listener for Phaser container scaling
    const handleResize = () => {
      if (gameRef.current && gameContainerRef.current) {
        const w = gameContainerRef.current.clientWidth;
        const h = gameContainerRef.current.clientHeight;
        gameRef.current.scale.resize(w, h);
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
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
          ach.id === id ? { ...ach, unlocked: true } : ach
        );

        const persistenceMap: Record<string, boolean> = {};
        updated.forEach((a) => {
          persistenceMap[a.id] = a.unlocked;
        });
        localStorage.setItem("dvcubie2026_achievements", JSON.stringify(persistenceMap));
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
    }, 3500);
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
    setScore(4);
    if (gameRef.current) {
      gameRef.current.scene.keys.DVCubie2026Scene.scene.restart();
    }
  };

  // Mobile speed boost trigger
  const handleMobileBoostStart = () => {
    if (gameRef.current) {
      const scene = gameRef.current.scene.keys.DVCubie2026Scene as DVCubie2026Scene;
      scene.setMobileBoost(true);
    }
  };

  const handleMobileBoostEnd = () => {
    if (gameRef.current) {
      const scene = gameRef.current.scene.keys.DVCubie2026Scene as DVCubie2026Scene;
      scene.setMobileBoost(false);
    }
  };

  // Social Share Twitter/X
  const shareOnTwitter = () => {
    const text = `I just scored ${score} points in DVCubie2026 Arena! Can you match my snake size? Play it now on WorldNewzs!`;
    const url = window.location.href;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank");
  };

  return (
    <>
      <SEOMeta
        title="DVCubie2026 - Cubes 2048.io Multiplayer Snake Arena"
        description="Slide, collect, and merge blocks under 2D kinematics. Evade larger snakes, absorb food cubes, and dominate the real-time leaderboard!"
        keywords={combinedKeywords}
        ogType="website"
      />

      <Box
        sx={{
          minHeight: "92vh",
          background: "radial-gradient(circle, #0e0d22 0%, #030308 100%)",
          color: "#f1f5f9",
          p: { xs: 1.5, md: 3 },
          fontFamily: '"Outfit", sans-serif',
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Floating toast message */}
        {toastMessage && (
          <Box
            sx={{
              position: "fixed",
              bottom: 24,
              left: 24,
              zIndex: 2500,
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
            <Typography variant="body2" fontWeight="700" sx={{ color: "#fff" }}>
              {toastMessage}
            </Typography>
          </Box>
        )}

        {/* Floating panel toggles for mobile viewports */}
        <Box
          sx={{
            display: { xs: "flex", md: "none" },
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1.5,
            px: 1,
          }}
        >
          <Button
            component={Link}
            to="/gaming"
            variant="text"
            startIcon={<ArrowBackIcon />}
            sx={{ color: "#94a3b8", textTransform: "none", fontSize: "0.85rem" }}
          >
            Exit Game
          </Button>

          <Box display="flex" gap={1}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<MenuIcon />}
              onClick={() => setShowLeftSidebar(!showLeftSidebar)}
              sx={{ color: "#a855f7", borderColor: "rgba(168, 85, 247, 0.4)", textTransform: "none" }}
            >
              Info
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<StarIcon />}
              onClick={() => setShowRightSidebar(!showRightSidebar)}
              sx={{ color: "#ec4899", borderColor: "rgba(236, 72, 153, 0.4)", textTransform: "none" }}
            >
              Scores
            </Button>
          </Box>
        </Box>

        {/* Desktop Header */}
        <Box sx={{ display: { xs: "none", md: "flex" }, justifyContent: "space-between", alignItems: "center", mb: 3 }}>
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
          >
            Exit to Games Directory
          </Button>

          <Typography
            variant="h4"
            component="h1"
            fontWeight="900"
            sx={{
              background: "linear-gradient(to right, #a855f7, #f43f5e)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "-0.04em",
            }}
          >
            DVCubie2026 Arena
          </Typography>

          <Box display="flex" gap={2}>
            {/* Immersive layout toggles */}
            <FormControlLabel
              control={<Switch checked={hideSearch} onChange={handleToggleSearch} color="secondary" size="small" />}
              label={<Typography variant="caption" color="textSecondary">Auto-Hide Search</Typography>}
            />
            <FormControlLabel
              control={<Switch checked={hideBadges} onChange={handleToggleBadges} color="secondary" size="small" />}
              label={<Typography variant="caption" color="textSecondary">Auto-Hide Badges</Typography>}
            />
          </Box>
        </Box>

        <Grid container spacing={2} sx={{ flexGrow: 1, alignItems: "stretch" }}>
          {/* LEFT SIDEBAR: Instructions & Preferences & Achievements */}
          {showLeftSidebar && (
            <Grid size={{ xs: 12, md: 3 }} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {/* Preferences (mobile config) */}
              <Card sx={{ background: "rgba(20, 18, 50, 0.45)", backdropFilter: "blur(10px)", border: "1px solid rgba(168, 85, 247, 0.25)", color: "#fff" }}>
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="subtitle2" fontWeight="700" color="#a855f7" mb={1.5}>
                    Preferences
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={0.5}>
                    <FormControlLabel
                      control={<Switch checked={hideSearch} onChange={handleToggleSearch} color="secondary" size="small" />}
                      label={<Typography variant="body2" color="#cbd5e1">Hide Search Bar</Typography>}
                    />
                    <FormControlLabel
                      control={<Switch checked={hideBadges} onChange={handleToggleBadges} color="secondary" size="small" />}
                      label={<Typography variant="body2" color="#cbd5e1">Hide Header Badges</Typography>}
                    />
                  </Box>
                </CardContent>
              </Card>

              {/* Game Stats & Next block */}
              <Card sx={{ background: "rgba(20, 18, 50, 0.45)", backdropFilter: "blur(10px)", border: "1px solid rgba(168, 85, 247, 0.25)", color: "#fff" }}>
                <CardContent sx={{ p: 2, textAlign: "center" }}>
                  <Grid container spacing={1}>
                    <Grid size={6}>
                      <Typography variant="caption" sx={{ color: "#94a3b8" }}>CURRENT SIZE</Typography>
                      <Typography variant="h5" fontWeight="900" sx={{ color: "#ec4899" }}>{score}</Typography>
                    </Grid>
                    <Grid size={6}>
                      <Typography variant="caption" sx={{ color: "#94a3b8" }}>MAX SIZE</Typography>
                      <Typography variant="h5" fontWeight="900" sx={{ color: "#f59e0b" }}>{highScore}</Typography>
                    </Grid>
                  </Grid>

                  {/* Boost cooldown visual bar */}
                  <Box mt={2}>
                    {isGameOver ? (
                      <Typography variant="body2" color="error" fontWeight="bold">
                        GAME OVER! Submit your score.
                      </Typography>
                    ) : (
                      <>
                        <Box display="flex" justifyContent="space-between" mb={0.5}>
                          <Typography variant="caption" color="textSecondary">BOOST CHARGE</Typography>
                          <Typography variant="caption" fontWeight="bold" color={boostCooldown < 20 ? "error" : "success"}>
                            {Math.floor(boostCooldown)}%
                          </Typography>
                        </Box>
                        <Box sx={{ width: "100%", height: 6, bg: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden", position: "relative" }}>
                          <Box sx={{ width: `${boostCooldown}%`, height: "100%", background: "linear-gradient(to right, #ec4899, #a855f7)", transition: "width 0.1s ease" }} />
                        </Box>
                      </>
                    )}
                  </Box>
                </CardContent>
              </Card>

              {/* Controls */}
              <Card sx={{ background: "rgba(20, 18, 50, 0.45)", backdropFilter: "blur(10px)", border: "1px solid rgba(168, 85, 247, 0.25)", color: "#fff" }}>
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="subtitle2" fontWeight="700" color="#a855f7" mb={1.5}>
                    Controls
                  </Typography>
                  <List dense disablePadding>
                    <ListItem sx={{ px: 0, py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 28 }}><MouseIcon sx={{ color: "#ec4899", fontSize: 18 }} /></ListItemIcon>
                      <ListItemText primary="Navigation" secondary="Snake follows your mouse pointer or touch drag target." secondaryTypographyProps={{ style: { color: "#94a3b8", fontSize: "0.75rem" } }} />
                    </ListItem>
                    <ListItem sx={{ px: 0, py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 28 }}><SpeedIcon sx={{ color: "#f59e0b", fontSize: 18 }} /></ListItemIcon>
                      <ListItemText primary="Speed Boost" secondary="Hold Left-Click, Space, or on-screen button to sprint." secondaryTypographyProps={{ style: { color: "#94a3b8", fontSize: "0.75rem" } }} />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>

              {/* Achievements */}
              <Card sx={{ background: "rgba(20, 18, 50, 0.45)", backdropFilter: "blur(10px)", border: "1px solid rgba(168, 85, 247, 0.25)", color: "#fff", flexGrow: 1 }}>
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="subtitle2" fontWeight="700" color="#a855f7" mb={1}>
                    Achievements
                  </Typography>
                  <List dense disablePadding sx={{ maxHeight: { xs: 150, md: "none" }, overflowY: "auto" }}>
                    {achievements.map((ach) => (
                      <ListItem key={ach.id} sx={{ px: 0, py: 0.25 }}>
                        <ListItemIcon sx={{ minWidth: 24 }}>
                          {ach.unlocked ? (
                            <CheckCircleIcon sx={{ color: "#10b981", fontSize: 16 }} />
                          ) : (
                            <RadioButtonUncheckedIcon sx={{ color: "#475569", fontSize: 16 }} />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={ach.name}
                          primaryTypographyProps={{ style: { fontWeight: "700", fontSize: "0.8rem", color: ach.unlocked ? "#fff" : "#94a3b8" } }}
                          secondary={ach.description}
                          secondaryTypographyProps={{ style: { color: "#64748b", fontSize: "0.7rem" } }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* CENTER PANEL: Game Canvas Viewport */}
          <Grid size={{ xs: 12, md: showLeftSidebar && showRightSidebar ? 6 : 9 }} sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <Box
              sx={{
                flexGrow: 1,
                position: "relative",
                background: "linear-gradient(135deg, #1e1b4b 0%, #311042 100%)",
                borderRadius: "24px",
                border: "2px solid rgba(236, 72, 153, 0.25)",
                boxShadow: "0 0 35px rgba(168, 85, 247, 0.35)",
                overflow: "hidden",
                height: { xs: "65vh", md: "72vh" },
                width: "100%",
              }}
            >
              <div
                ref={gameContainerRef}
                id="phaser-dvcubie-io-canvas"
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "22px",
                  overflow: "hidden",
                }}
              />

              {/* On-screen Speed Boost Button for Mobile overlay */}
              <Box
                sx={{
                  position: "absolute",
                  bottom: 20,
                  right: 20,
                  zIndex: 1000,
                  display: { xs: "block", md: "none" },
                }}
              >
                <Button
                  variant="contained"
                  onTouchStart={handleMobileBoostStart}
                  onTouchEnd={handleMobileBoostEnd}
                  onMouseDown={handleMobileBoostStart}
                  onMouseUp={handleMobileBoostEnd}
                  sx={{
                    width: 70,
                    height: 70,
                    borderRadius: "50%",
                    minWidth: 0,
                    background: boostCooldown < 10 ? "rgba(239, 68, 68, 0.6)" : "linear-gradient(to right, #ec4899, #8b5cf6)",
                    boxShadow: "0 6px 20px rgba(236, 72, 153, 0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  id="mobile-sprint-button"
                >
                  <SpeedIcon sx={{ fontSize: 32, color: "#fff" }} />
                </Button>
              </Box>
            </Box>

            {/* Quick action bar */}
            <Box mt={2} display="flex" justifyContent="center" gap={2}>
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
              >
                Restart Game
              </Button>
              <Button
                variant="outlined"
                startIcon={<ShareIcon />}
                onClick={shareOnTwitter}
                sx={{
                  borderRadius: "10px",
                  borderColor: "rgba(255, 255, 255, 0.15)",
                  color: "#fff",
                  textTransform: "none",
                  "&:hover": { borderColor: "#ec4899" },
                }}
              >
                Share
              </Button>
            </Box>
          </Grid>

          {/* RIGHT SIDEBAR: Leaderboard rankings */}
          {showRightSidebar && (
            <Grid size={{ xs: 12, md: 3 }} sx={{ display: "flex", flexDirection: "column" }}>
              <Card
                sx={{
                  background: "rgba(20, 18, 50, 0.45)",
                  backdropFilter: "blur(10px)",
                  borderRadius: "16px",
                  border: "1px solid rgba(168, 85, 247, 0.25)",
                  color: "#fff",
                  height: "100%",
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                    <Typography variant="subtitle2" fontWeight="700" sx={{ color: "#a855f7" }}>
                      🏆 Leaderboard
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<RefreshIcon />}
                      onClick={fetchLeaderboard}
                      sx={{ color: "#ec4899", textTransform: "none", minWidth: 0, p: 0 }}
                    >
                      Sync
                    </Button>
                  </Box>

                  {leaderboardLoading ? (
                    <Box display="flex" justifyContent="center" py={6}>
                      <CircularProgress size={30} sx={{ color: "#ec4899" }} />
                    </Box>
                  ) : (
                    <TableContainer component={Box} sx={{ background: "transparent", maxHeight: { xs: 200, md: "60vh" }, overflowY: "auto" }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ color: "#94a3b8", fontSize: "0.75rem", p: 1, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Rank</TableCell>
                            <TableCell sx={{ color: "#94a3b8", fontSize: "0.75rem", p: 1, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Player</TableCell>
                            <TableCell align="right" sx={{ color: "#94a3b8", fontSize: "0.75rem", p: 1, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Score</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {leaderboard.map((scoreRow, idx) => {
                            const isTop3 = idx < 3;
                            const colors = ["#f59e0b", "#94a3b8", "#b45309"];
                            return (
                              <TableRow key={scoreRow.id} sx={{ "&:hover": { background: "rgba(255,255,255,0.03)" } }}>
                                <TableCell sx={{ p: 1, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                  {isTop3 ? (
                                    <StarIcon sx={{ color: colors[idx], fontSize: 14 }} />
                                  ) : (
                                    idx + 1
                                  )}
                                </TableCell>
                                <TableCell sx={{ p: 1, fontSize: "0.8rem", fontWeight: isTop3 ? "800" : "500", color: "#f1f5f9", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                  {scoreRow.username}
                                </TableCell>
                                <TableCell align="right" sx={{ p: 1, fontSize: "0.8rem", fontWeight: "800", color: isTop3 ? "#ec4899" : "#a855f7", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
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
          )}
        </Grid>
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
            p: 1.5,
          },
        }}
      >
        <DialogTitle sx={{ textAlign: "center", pb: 1 }}>
          <EmojiEventsIcon sx={{ fontSize: 36, color: "#f59e0b", mb: 1 }} />
          <Typography variant="h6" fontWeight="800">
            Game Over!
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" textAlign="center" mb={2.5} sx={{ color: "#94a3b8" }}>
            Your final snake size was <strong style={{ color: "#ec4899", fontSize: "1.2rem" }}>{score}</strong> blocks!
            Submit your score to record it on the global leaderboard.
          </Typography>
          <form onSubmit={handleSubmitScore} id="dvcubie-score-form">
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
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="dvcubie-score-form"
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
