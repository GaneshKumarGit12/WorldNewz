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
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import StarIcon from "@mui/icons-material/Star";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ShareIcon from "@mui/icons-material/Share";
import RefreshIcon from "@mui/icons-material/Refresh";

import CircularProgress from "@mui/material/CircularProgress";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import SpeedIcon from "@mui/icons-material/Speed";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import PersonIcon from "@mui/icons-material/Person";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import PauseIcon from "@mui/icons-material/Pause";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";

import LockIcon from "@mui/icons-material/Lock";
import SettingsIcon from "@mui/icons-material/Settings";
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

type ScreenState = "home" | "tutorial" | "playing" | "paused" | "gameover" | "leaderboard" | "shop" | "profile";

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

interface Skin {
  id: string;
  name: string;
  color: string;
  cost: number;
  unlocked: boolean;
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
  const [currentScreen, setCurrentScreen] = useState<ScreenState>("home");
  const [score, setScore] = useState<number>(4);
  const [highScore, setHighScore] = useState<number>(0);
  const [boostCooldown, setBoostCooldown] = useState<number>(100);
  const [leaderboard, setLeaderboard] = useState<LeaderboardScore[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState<boolean>(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [achievements, setAchievements] = useState<Achievement[]>(INITIAL_ACHIEVEMENTS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Advanced settings toggles
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem("dvcubie_sound") !== "false";
  });
  const [musicEnabled, setMusicEnabled] = useState<boolean>(() => {
    return localStorage.getItem("dvcubie_music") !== "false";
  });
  const [vibrationEnabled, setVibrationEnabled] = useState<boolean>(() => {
    return localStorage.getItem("dvcubie_vibration") !== "false";
  });
  const [nextCube, setNextCube] = useState<number>(2);
  const [leaderboardTab, setLeaderboardTab] = useState<number>(0);

  const [arenaRankings, setArenaRankings] = useState<{ name: string; score: number; isPlayer: boolean }[]>([]);
  const [activeBooster, setActiveBooster] = useState<{ type: string; time: number } | null>(null);

  const formatCubeValue = (val: number): string => {
    if (val >= 1000000) {
      return (val / 1000000).toFixed(0) + "M";
    }
    if (val >= 1000) {
      return (val / 1000).toFixed(0) + "K";
    }
    return val.toString();
  };

  const musicIntervalRef = useRef<any>(null);

  const playMusicNote = () => {
    try {
      const music = localStorage.getItem("dvcubie_music") !== "false";
      if (!music || currentScreen !== "playing") return;

      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sine";
      const notes = [130.81, 164.81, 196.00, 220.00]; // C3, E3, G3, A3
      const freq = notes[Math.floor(Math.random() * notes.length)];

      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.012, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 1.8);

      osc.start();
      osc.stop(ctx.currentTime + 1.8);
    } catch (e) {}
  };

  useEffect(() => {
    if (currentScreen === "playing" && musicEnabled) {
      musicIntervalRef.current = setInterval(playMusicNote, 2800);
    } else {
      if (musicIntervalRef.current) {
        clearInterval(musicIntervalRef.current);
        musicIntervalRef.current = null;
      }
    }
    return () => {
      if (musicIntervalRef.current) clearInterval(musicIntervalRef.current);
    };
  }, [currentScreen, musicEnabled]);

  // Currency & Skins
  const [coins, setCoins] = useState<number>(() => {
    const saved = localStorage.getItem("dvcubie_coins");
    return saved ? parseInt(saved, 10) : 150; // Give 150 starter coins to purchase neon skin immediately
  });

  const [skins, setSkins] = useState<Skin[]>([
    { id: "default", name: "Classic Cubie", color: "#fde68a", cost: 0, unlocked: true },
    { id: "neon", name: "Neon Cyber", color: "#06b6d4", cost: 100, unlocked: false },
    { id: "gold", name: "Golden Aura", color: "#fbbf24", cost: 250, unlocked: false },
    { id: "magma", name: "Volcanic Magma", color: "#dc2626", cost: 400, unlocked: false },
    { id: "matrix", name: "Matrix Code", color: "#10b981", cost: 500, unlocked: false },
  ]);

  const [equippedSkin, setEquippedSkin] = useState<string>(() => {
    return localStorage.getItem("dvcubie_equipped_skin") || "default";
  });

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

  // Synthesize sound effects
  const playSound = (type: "click" | "merge" | "gameover" | "upgrade") => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "click") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      } else if (type === "merge") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(330, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.12);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } else if (type === "gameover") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(160, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(50, ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } else if (type === "upgrade") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(520, ctx.currentTime);
        osc.frequency.setValueAtTime(780, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch (e) {
      console.warn("Web Audio API not supported:", e);
    }
  };

  // Lifecycle initialization
  useEffect(() => {
    // Load local high score
    const savedHighScore = localStorage.getItem("dvcubie2026_highscore");
    if (savedHighScore) setHighScore(parseInt(savedHighScore, 10));

    // Load achievements
    const savedAchievements = localStorage.getItem("dvcubie2026_achievements");
    if (savedAchievements) {
      try {
        const parsed = JSON.parse(savedAchievements) as Record<string, boolean>;
        setAchievements((prev) =>
          prev.map((ach) => ({ ...ach, unlocked: !!parsed[ach.id] }))
        );
      } catch (e) {
        console.error(e);
      }
    }

    // Load unlocked skins
    const savedSkins = localStorage.getItem("dvcubie_unlocked_skins");
    if (savedSkins) {
      try {
        const unlockedIds = JSON.parse(savedSkins) as string[];
        setSkins((prev) =>
          prev.map((s) => ({ ...s, unlocked: s.unlocked || unlockedIds.includes(s.id) }))
        );
      } catch (e) {
        console.error(e);
      }
    }

    dispatchHeaderSettings(hideSearch, hideBadges);
    fetchLeaderboard();
    setupSignalR();

    return () => {
      destroyPhaserGame();
      dispatchHeaderSettings(false, false);
    };
  }, []);

  const dispatchHeaderSettings = (hideSearchVal: boolean, hideBadgesVal: boolean) => {
    localStorage.setItem("dvcubie_hide_search", hideSearchVal ? "true" : "false");
    localStorage.setItem("dvcubie_hide_badges", hideBadgesVal ? "true" : "false");
    window.dispatchEvent(new CustomEvent("dvcubie-settings-changed"));
  };

  const handleToggleSearch = (checked: boolean) => {
    setHideSearch(checked);
    dispatchHeaderSettings(checked, hideBadges);
  };

  const handleToggleBadges = (checked: boolean) => {
    setHideBadges(checked);
    dispatchHeaderSettings(hideSearch, checked);
  };

  const fetchLeaderboard = async () => {
    setLeaderboardLoading(true);
    try {
      const res = await apiClient.get("/game/leaderboard");
      setLeaderboard(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLeaderboardLoading(false);
    }
  };

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
      connection.on("UpdateLeaderboard", fetchLeaderboard);
    } catch (err) {
      console.warn("SignalR fallback:", err);
      const interval = setInterval(fetchLeaderboard, 30000);
      return () => clearInterval(interval);
    }
    return () => {
      if (connection.state === HubConnectionState.Connected) connection.stop();
    };
  };

  // Phaser Management
  const startPhaserGame = () => {
    if (gameRef.current || !gameContainerRef.current) return;

    const width = gameContainerRef.current.clientWidth || 400;
    const height = gameContainerRef.current.clientHeight || 500;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: width,
      height: height,
      parent: gameContainerRef.current,
      physics: {
        default: "arcade",
        arcade: { gravity: { x: 0, y: 0 }, debug: false },
      },
      scene: [DVCubie2026Scene],
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    // Listeners
    game.events.on("score-changed", (newScore: number) => {
      setScore(newScore);
    });

    game.events.on("boost-cooldown-changed", setBoostCooldown);
    game.events.on("toast-alert", showToast);

    game.events.on("next-cube-changed", (val: number) => {
      setNextCube(val);
    });

    game.events.on("arena-rankings-updated", (rankings: any) => {
      setArenaRankings(rankings);
    });

    game.events.on("booster-activated", (data: { type: string; duration: number }) => {
      setActiveBooster({ type: data.type, time: data.duration });
      playSound("merge");
    });

    game.events.on("booster-tick", (data: { type: string; time: number }) => {
      setActiveBooster({ type: data.type, time: data.time });
    });

    game.events.on("booster-deactivated", () => {
      setActiveBooster(null);
    });

    game.events.on("coin-earned", (amt: number) => {
      setCoins((prev) => {
        const next = prev + amt;
        localStorage.setItem("dvcubie_coins", next.toString());
        return next;
      });
    });

    game.events.on("cube-merged", (data: { scoreAwarded: number; mergedValue: number }) => {
      playSound("merge");
      unlockAchievement("first_merge");
      if (data.mergedValue >= 16) unlockAchievement("double_digit");
      if (data.mergedValue >= 128) unlockAchievement("triple_digit");
      if (data.mergedValue >= 1024) unlockAchievement("legendary_merge");

      // Mobile haptic vibration
      if (vibrationEnabled && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(40);
      }
    });

    game.events.on("game-over", (finalScore: number) => {
      playSound("gameover");
      setCurrentScreen("gameover");
      destroyPhaserGame();

      const savedHighScore = localStorage.getItem("dvcubie2026_highscore");
      const currentHigh = savedHighScore ? parseInt(savedHighScore, 10) : 0;
      if (finalScore > currentHigh) {
        localStorage.setItem("dvcubie2026_highscore", finalScore.toString());
        setHighScore(finalScore);
      }
    });
  };

  const destroyPhaserGame = () => {
    if (gameRef.current) {
      gameRef.current.destroy(true);
      gameRef.current = null;
    }
  };

  // Actions
  const handlePlayClick = () => {
    playSound("click");
    // Show tutorial on first play, otherwise launch directly
    const tutorialPlayed = localStorage.getItem("dvcubie_tutorial_played");
    if (!tutorialPlayed) {
      setCurrentScreen("tutorial");
    } else {
      launchGame();
    }
  };

  const launchGame = () => {
    localStorage.setItem("dvcubie_tutorial_played", "true");
    setCurrentScreen("playing");
    setScore(4);
    setTimeout(startPhaserGame, 100);
  };

  const handlePause = () => {
    if (gameRef.current) {
      playSound("click");
      gameRef.current.scene.pause("DVCubie2026Scene");
      setCurrentScreen("paused");
    }
  };

  const handleResume = () => {
    if (gameRef.current) {
      playSound("click");
      gameRef.current.scene.resume("DVCubie2026Scene");
      setCurrentScreen("playing");
    }
  };

  const handleRestart = () => {
    playSound("click");
    destroyPhaserGame();
    launchGame();
  };

  const handleExitToHome = () => {
    playSound("click");
    destroyPhaserGame();
    setCurrentScreen("home");
  };

  const handleBuySkin = (skin: Skin) => {
    if (coins >= skin.cost) {
      const nextCoins = coins - skin.cost;
      setCoins(nextCoins);
      localStorage.setItem("dvcubie_coins", nextCoins.toString());

      const nextSkins = skins.map((s) => (s.id === skin.id ? { ...s, unlocked: true } : s));
      setSkins(nextSkins);

      const unlockedIds = nextSkins.filter((s) => s.unlocked).map((s) => s.id);
      localStorage.setItem("dvcubie_unlocked_skins", JSON.stringify(unlockedIds));

      playSound("upgrade");
      showToast(`🎨 Unlocked Skin: ${skin.name}!`);
    } else {
      alert("Not enough coins! Play matches to earn more coins.");
    }
  };

  const handleEquipSkin = (id: string) => {
    playSound("click");
    setEquippedSkin(id);
    localStorage.setItem("dvcubie_equipped_skin", id);
    showToast("Skin equipped successfully!");
  };

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
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await apiClient.post("/game/score", { username: username.trim(), points: score });
      showToast("🚀 Score uploaded!");
      localStorage.setItem("dvcubie_submitted_name", username.trim());
      setUsername("");
      fetchLeaderboard();
      setCurrentScreen("leaderboard");
    } catch (err: any) {
      alert(err.message || "Failed to submit score");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mobile boost handlers
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
          background: "radial-gradient(circle, #0c0926 0%, #020108 100%)",
          color: "#f1f5f9",
          p: { xs: 1, sm: 2 },
          fontFamily: '"Outfit", sans-serif',
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <Card
          sx={{
            width: "100%",
            maxWidth: "540px",
            height: "min(760px, 92vh)",
            background: "rgba(20, 18, 50, 0.75)",
            backdropFilter: "blur(18px)",
            border: "2px solid #a855f7",
            borderRadius: "24px",
            boxShadow: "0 0 45px rgba(168, 85, 247, 0.4)",
            display: "flex",
            flexDirection: "column",
            position: "relative",
            overflow: "hidden",
            p: { xs: 2, sm: 3 },
            zIndex: 10,
          }}
        >
        {/* Toast Alert */}
        {toastMessage && (
          <Box
            sx={{
              position: "fixed",
              bottom: 24,
              left: 24,
              zIndex: 2500,
              background: "linear-gradient(135deg, #f43f5e, #a855f7)",
              borderRadius: "12px",
              p: "14px 20px",
              boxShadow: "0 10px 30px rgba(168, 85, 247, 0.4)",
              display: "flex",
              alignItems: "center",
              gap: 1.2,
            }}
          >
            <EmojiEventsIcon sx={{ color: "#fff" }} />
            <Typography variant="body2" fontWeight="700" sx={{ color: "#fff" }}>
              {toastMessage}
            </Typography>
          </Box>
        )}

        {/* --- SCREEN 1: HOME SCREEN --- */}
        {currentScreen === "home" && (
          <Box
            sx={{
              width: "100%",
              height: "100%",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              alignItems: "center",
              animation: "fadeIn 0.5s ease-out",
            }}
          >
            {/* Title / Logo */}
            <Box
              sx={{
                background: "rgba(20, 15, 60, 0.55)",
                border: "3px solid #ec4899",
                borderRadius: "24px",
                p: 3,
                boxShadow: "0 0 35px rgba(236, 72, 153, 0.4)",
              }}
            >
              <Typography variant="h3" fontWeight="950" sx={{ color: "#ffffff", letterSpacing: "-0.04em" }}>
                CUBES
              </Typography>
              <Typography
                variant="h4"
                fontWeight="900"
                sx={{
                  background: "linear-gradient(to right, #fbbf24, #f59e0b)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  letterSpacing: "-0.02em",
                }}
              >
                2026.io
              </Typography>
            </Box>

            {/* Pulsating PLAY Button */}
            <Button
              onClick={handlePlayClick}
              variant="contained"
              id="home-play-btn"
              sx={{
                height: 70,
                fontSize: "1.7rem",
                fontWeight: "900",
                borderRadius: "20px",
                background: "linear-gradient(135deg, #fbbf24, #f57c00)",
                boxShadow: "0 8px 30px rgba(245, 124, 0, 0.55)",
                color: "#fff",
                textTransform: "uppercase",
                "&:hover": {
                  background: "linear-gradient(135deg, #ffca28, #f57c00)",
                  transform: "scale(1.03)",
                },
                transition: "all 0.15s ease-in-out",
              }}
            >
              Play Arena
            </Button>

            {/* Secondary Buttons Grid */}
            <Grid container spacing={2}>
              <Grid size={6}>
                <Button
                  onClick={() => setCurrentScreen("shop")}
                  fullWidth
                  variant="outlined"
                  startIcon={<ShoppingBagIcon />}
                  sx={{
                    borderRadius: "14px",
                    borderColor: "rgba(168, 85, 247, 0.4)",
                    color: "#a855f7",
                    p: 1.5,
                    textTransform: "none",
                    fontWeight: "600",
                    background: "rgba(168, 85, 247, 0.05)",
                    "&:hover": { borderColor: "#a855f7", background: "rgba(168, 85, 247, 0.15)" },
                  }}
                >
                  Skins & Shop
                </Button>
              </Grid>
              <Grid size={6}>
                <Button
                  onClick={() => setCurrentScreen("leaderboard")}
                  fullWidth
                  variant="outlined"
                  startIcon={<EmojiEventsIcon />}
                  sx={{
                    borderRadius: "14px",
                    borderColor: "rgba(236, 72, 153, 0.4)",
                    color: "#ec4899",
                    p: 1.5,
                    textTransform: "none",
                    fontWeight: "600",
                    background: "rgba(236, 72, 153, 0.05)",
                    "&:hover": { borderColor: "#ec4899", background: "rgba(236, 72, 153, 0.15)" },
                  }}
                >
                  Leaderboard
                </Button>
              </Grid>
              <Grid size={6}>
                <Button
                  onClick={() => setCurrentScreen("profile")}
                  fullWidth
                  variant="outlined"
                  startIcon={<PersonIcon />}
                  sx={{
                    borderRadius: "14px",
                    borderColor: "rgba(59, 130, 246, 0.4)",
                    color: "#3b82f6",
                    p: 1.5,
                    textTransform: "none",
                    fontWeight: "600",
                    background: "rgba(59, 130, 246, 0.05)",
                    "&:hover": { borderColor: "#3b82f6", background: "rgba(59, 130, 246, 0.15)" },
                  }}
                >
                  Profile / Medals
                </Button>
              </Grid>
              <Grid size={6}>
                <Button
                  onClick={() => setShowSettingsDialog(true)}
                  fullWidth
                  variant="outlined"
                  startIcon={<SettingsIcon />}
                  sx={{
                    borderRadius: "14px",
                    borderColor: "rgba(168, 85, 247, 0.4)",
                    color: "#a855f7",
                    p: 1.5,
                    textTransform: "none",
                    fontWeight: "600",
                    background: "rgba(168, 85, 247, 0.05)",
                    "&:hover": { borderColor: "#a855f7", background: "rgba(168, 85, 247, 0.15)" },
                  }}
                >
                  Settings
                </Button>
              </Grid>
              <Grid size={12}>
                <Button
                  onClick={() => setCurrentScreen("tutorial")}
                  fullWidth
                  variant="outlined"
                  startIcon={<HelpOutlineIcon />}
                  sx={{
                    borderRadius: "14px",
                    borderColor: "rgba(148, 163, 184, 0.4)",
                    color: "#cbd5e1",
                    p: 1.5,
                    textTransform: "none",
                    fontWeight: "600",
                    background: "rgba(148, 163, 184, 0.05)",
                    "&:hover": { borderColor: "#cbd5e1", background: "rgba(148, 163, 184, 0.15)" },
                  }}
                >
                  How to Play
                </Button>
              </Grid>
            </Grid>

            {/* Back to games list link */}
            <Box mt={1}>
              <Button component={Link} to="/gaming" sx={{ color: "#64748b", textTransform: "none" }}>
                Exit to Games Portal
              </Button>
            </Box>
          </Box>
        )}

        {/* --- SCREEN 2: TUTORIAL SCREEN --- */}
        {currentScreen === "tutorial" && (
          <Box
            sx={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              textAlign: "center",
              animation: "fadeIn 0.4s ease-out",
            }}
          >
            <Typography variant="h5" fontWeight="950" color="#a855f7" mb={2}>
              How to Play
            </Typography>

            {/* Visual merge rule side-by-side */}
            <Box
              sx={{
                background: "rgba(0,0,0,0.2)",
                borderRadius: "16px",
                p: 2,
                mb: 2.5,
                border: "1px solid rgba(255,255,255,0.06)"
              }}
            >
              <Typography variant="body2" sx={{ color: "#cbd5e1", mb: 1.5, fontWeight: "bold" }}>
                Cube Merge Guide
              </Typography>
              <Box display="flex" justifyContent="center" alignItems="center" gap={2}>
                <Box sx={{ bg: "#e2e8f0", color: "#334155", width: 40, height: 40, borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>2</Box>
                <Typography variant="body2" color="#a855f7" fontWeight="bold">+</Typography>
                <Box sx={{ bg: "#e2e8f0", color: "#334155", width: 40, height: 40, borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>2</Box>
                <Typography variant="body2" color="success.main" fontWeight="bold">=</Typography>
                <Box sx={{ bg: "#fde68a", color: "#92400e", width: 44, height: 44, borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", boxShadow: "0 0 8px #fde68a" }}>4</Box>
              </Box>
            </Box>

            {/* Gesture layout directions ← ↑ → ↓ */}
            <Box
              sx={{
                background: "rgba(0,0,0,0.2)",
                borderRadius: "16px",
                p: 2,
                mb: 3,
                border: "1px solid rgba(255,255,255,0.06)"
              }}
            >
              <Typography variant="body2" sx={{ color: "#cbd5e1", mb: 1.5, fontWeight: "bold" }}>
                Steering Controls
              </Typography>
              <Box display="flex" justifyContent="center" gap={2} mb={1.2}>
                <Box sx={{ p: "6px 12px", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px" }}>←</Box>
                <Box sx={{ p: "6px 12px", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px" }}>↑</Box>
                <Box sx={{ p: "6px 12px", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px" }}>↓</Box>
                <Box sx={{ p: "6px 12px", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px" }}>→</Box>
              </Box>
              <Typography variant="caption" color="textSecondary" sx={{ display: "block" }}>
                Swipe or drag to steer your snake around the grid.
              </Typography>
            </Box>

            <Typography variant="body2" color="#fbbf24" fontWeight="bold" sx={{ display: "block", mb: 3.5 }}>
              💡 Keep merging cubes to reach 2048!
            </Typography>

            <Button
              onClick={launchGame}
              variant="contained"
              fullWidth
              sx={{
                background: "linear-gradient(to right, #fbbf24, #f57c00)",
                fontWeight: "900",
                fontSize: "1.15rem",
                py: 1.6,
                borderRadius: "14px",
                boxShadow: "0 4px 15px rgba(245, 124, 0, 0.4)",
              }}
            >
              Got it ➔
            </Button>
          </Box>
        )}

        {/* --- SCREEN 3: GAMEPLAY SCREEN --- */}
        {currentScreen === "playing" && (
          <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", flexGrow: 1 }}>
            {/* HUD Overlay */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1.5,
                px: 1.5,
                zIndex: 100,
              }}
            >
              {/* Left Side: Pause Button + Current Score */}
              <Box display="flex" alignItems="center" gap={1}>
                <IconButton onClick={handlePause} sx={{ color: "#cbd5e1", p: 1, border: "1.5px solid rgba(255,255,255,0.15)", borderRadius: "10px" }} aria-label="Pause game">
                  <PauseIcon sx={{ fontSize: 20 }} />
                </IconButton>
                <Box display="flex" flexDirection="column" sx={{ ml: 1 }}>
                  <Typography variant="caption" color="textSecondary" sx={{ fontSize: "0.65rem", fontWeight: "bold" }}>SCORE</Typography>
                  <Typography variant="h6" fontWeight="950" sx={{ color: "#a855f7", lineHeight: 1.1 }}>
                    {formatCubeValue(score)}
                  </Typography>
                </Box>
              </Box>

              {/* Sprint meter */}
              <Box sx={{ width: 100, display: { xs: "none", sm: "block" } }}>
                <Box display="flex" justifyContent="space-between" mb={0.25}>
                  <Typography variant="caption" sx={{ color: "#94a3b8", fontSize: "0.65rem" }}>Sprint</Typography>
                  <Typography variant="caption" fontWeight="bold" color="#ec4899" sx={{ fontSize: "0.65rem" }}>{Math.floor(boostCooldown)}%</Typography>
                </Box>
                <Box sx={{ width: "100%", height: 6, bg: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden" }}>
                  <Box sx={{ width: `${boostCooldown}%`, height: "100%", bg: "#ec4899" }} />
                </Box>
              </Box>

              {/* Right Side: Best Score */}
              <Box display="flex" flexDirection="column" alignSelf="center">
                <Typography variant="caption" color="textSecondary" align="right" sx={{ fontSize: "0.65rem", fontWeight: "bold" }}>BEST</Typography>
                <Typography variant="h6" fontWeight="950" color="#fbbf24" align="right" sx={{ lineHeight: 1.1 }}>
                  {formatCubeValue(highScore)}
                </Typography>
              </Box>
            </Box>

            {/* Phaser Game Mount Viewport */}
            <Box
              sx={{
                flexGrow: 1,
                position: "relative",
                borderRadius: "24px",
                border: "2px solid rgba(168, 85, 247, 0.3)",
                boxShadow: "0 0 35px rgba(168, 85, 247, 0.2)",
                overflow: "hidden",
                height: "100%",
                width: "100%",
              }}
            >
              <div ref={gameContainerRef} id="phaser-dvcubie-io-canvas" style={{ width: "100%", height: "100%" }} />

              {/* Active Booster Overlay (Top-Left) */}
              {activeBooster && activeBooster.time > 0 && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 14,
                    left: 14,
                    zIndex: 1000,
                    background: activeBooster.type.startsWith("/") ? "rgba(220, 38, 38, 0.85)" : "rgba(245, 158, 11, 0.85)",
                    border: activeBooster.type.startsWith("/") ? "1.5px solid #ef4444" : "1.5px solid #fbbf24",
                    borderRadius: "12px",
                    p: "6px 12px",
                    textAlign: "center",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.5)",
                    minWidth: 100,
                  }}
                >
                  <Typography variant="caption" sx={{ color: "#fff", display: "block", mb: 0.5, fontSize: "0.6rem", fontWeight: "bold" }}>
                    {activeBooster.type.startsWith("/") ? "⚠️ DECREASED" : "⚡ BOOSTER"}
                  </Typography>
                  <Box
                    sx={{
                      borderRadius: "6px",
                      background: "rgba(255,255,255,0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      p: 0.5,
                    }}
                  >
                    <Typography variant="body2" fontWeight="950" sx={{ color: "#fff" }}>
                      {activeBooster.type} ({activeBooster.time.toFixed(1)}s)
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Next Cube Preview Overlay (Top-Right) */}
              <Box
                sx={{
                  position: "absolute",
                  top: 14,
                  right: 14,
                  zIndex: 1000,
                  background: "rgba(20, 18, 50, 0.85)",
                  border: "1.5px solid #a855f7",
                  borderRadius: "12px",
                  p: "6px 12px",
                  textAlign: "center",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.5)",
                }}
              >
                <Typography variant="caption" sx={{ color: "#94a3b8", display: "block", mb: 0.5, fontSize: "0.65rem", fontWeight: "bold" }}>
                  NEXT CUBE
                </Typography>
                <Box
                  sx={{
                    width: 34,
                    height: 34,
                    borderRadius: "6px",
                    background: "linear-gradient(to right, #ec4899, #8b5cf6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 0 8px rgba(168, 85, 247, 0.5)",
                    mx: "auto",
                  }}
                >
                  <Typography variant="body2" fontWeight="950" sx={{ color: "#fff" }}>
                    {nextCube}
                  </Typography>
                </Box>
              </Box>

              {/* In-Game Mini Leaderboard (Top Right) */}
              <Box
                sx={{
                  position: "absolute",
                  top: 96,
                  right: 14,
                  zIndex: 1000,
                  background: "rgba(15, 12, 38, 0.75)",
                  backdropFilter: "blur(4px)",
                  border: "1.5px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "12px",
                  p: 1.5,
                  width: 140,
                  boxShadow: "0 4px 15px rgba(0,0,0,0.5)",
                }}
              >
                <Typography variant="caption" sx={{ color: "#94a3b8", display: "block", mb: 0.8, fontSize: "0.65rem", fontWeight: "bold", textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", pb: 0.5 }}>
                  ARENA TOP 5
                </Typography>
                <Box display="flex" flexDirection="column" gap={0.5}>
                  {arenaRankings.slice(0, 5).map((player, idx) => {
                    const isSelf = player.isPlayer;
                    return (
                      <Box key={player.name} display="flex" justifyContent="space-between" alignItems="center">
                        <Typography 
                          variant="caption" 
                          fontWeight={isSelf ? "bold" : "normal"} 
                          sx={{ 
                            color: isSelf ? "#fbbf24" : "#cbd5e1", 
                            fontSize: "0.6rem", 
                            overflow: "hidden", 
                            textOverflow: "ellipsis", 
                            whiteSpace: "nowrap",
                            maxWidth: 80 
                          }}
                        >
                          {idx + 1}. {isSelf ? "You" : player.name}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          fontWeight="bold" 
                          sx={{ color: isSelf ? "#fbbf24" : "#ec4899", fontSize: "0.6rem" }}
                        >
                          {formatCubeValue(player.score)}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Box>

              {/* Speed Boost Button on Mobile/Touch overlay */}
              <Box
                sx={{
                  position: "absolute",
                  bottom: 24,
                  right: 24,
                  zIndex: 1000,
                  display: { xs: "block", md: "none" },
                }}
              >
                <Button
                  onTouchStart={handleMobileBoostStart}
                  onTouchEnd={handleMobileBoostEnd}
                  onMouseDown={handleMobileBoostStart}
                  onMouseUp={handleMobileBoostEnd}
                  sx={{
                    width: 76,
                    height: 76,
                    borderRadius: "50%",
                    minWidth: 0,
                    background: boostCooldown < 10 ? "rgba(239,68,68,0.5)" : "linear-gradient(to right, #ec4899, #8b5cf6)",
                    boxShadow: "0 6px 20px rgba(236,72,153,0.45)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  id="mobile-sprint-button"
                >
                  <SpeedIcon sx={{ fontSize: 36, color: "#fff" }} />
                </Button>
              </Box>
            </Box>
          </Box>
        )}

        {/* --- SCREEN 4: PAUSE MENU --- */}
        {currentScreen === "paused" && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 2000,
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: "fadeIn 0.25s ease-out",
            }}
          >
            <Box
              sx={{
                maxWidth: 400,
                width: "90%",
                background: "linear-gradient(135deg, #1c1936 0%, #0e0d1f 100%)",
                border: "2px solid #a855f7",
                boxShadow: "0 0 35px rgba(168, 85, 247, 0.45)",
                color: "#fff",
                borderRadius: "24px",
                p: 3.5,
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                gap: 2.2,
                position: "relative",
              }}
            >
              {/* Close Icon (X) top-right */}
              <IconButton
                onClick={handleResume}
                sx={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  color: "#94a3b8",
                  "&:hover": { color: "#fff" }
                }}
                aria-label="Resume game"
              >
                <CloseIcon />
              </IconButton>

              <Typography variant="h5" fontWeight="950" color="#a855f7" mb={1}>
                Game Paused
              </Typography>

              <Button
                onClick={handleResume}
                variant="contained"
                startIcon={<PlayArrowIcon />}
                sx={{
                  background: "linear-gradient(to right, #10b981, #059669)",
                  fontWeight: "900",
                  py: 1.5,
                  borderRadius: "12px",
                  fontSize: "1.1rem"
                }}
              >
                Resume
              </Button>

              <Button
                onClick={handleRestart}
                variant="contained"
                sx={{
                  background: "linear-gradient(to right, #f59e0b, #d97706)",
                  fontWeight: "750",
                  py: 1.2,
                  borderRadius: "12px",
                }}
              >
                Restart
              </Button>

              <Button
                onClick={handleExitToHome}
                variant="outlined"
                sx={{
                  borderColor: "rgba(148, 163, 184, 0.3)",
                  color: "#cbd5e1",
                  py: 1.2,
                  borderRadius: "12px",
                  textTransform: "none",
                }}
              >
                Main Menu
              </Button>

              {/* Pause Menu Settings Toggles */}
              <Box
                sx={{
                  mt: 1.5,
                  pt: 2,
                  borderTop: "1px solid rgba(255,255,255,0.08)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.2,
                  textAlign: "left"
                }}
              >
                <FormControlLabel
                  control={
                    <Switch
                      checked={soundEnabled}
                      onChange={(e) => {
                        setSoundEnabled(e.target.checked);
                        localStorage.setItem("dvcubie_sound", e.target.checked ? "true" : "false");
                      }}
                      color="secondary"
                      size="small"
                    />
                  }
                  label={<Typography variant="body2" color="#cbd5e1">🔊 Sound On/Off</Typography>}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={musicEnabled}
                      onChange={(e) => {
                        setMusicEnabled(e.target.checked);
                        localStorage.setItem("dvcubie_music", e.target.checked ? "true" : "false");
                      }}
                      color="secondary"
                      size="small"
                    />
                  }
                  label={<Typography variant="body2" color="#cbd5e1">🎵 Music On/Off</Typography>}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={vibrationEnabled}
                      onChange={(e) => {
                        setVibrationEnabled(e.target.checked);
                        localStorage.setItem("dvcubie_vibration", e.target.checked ? "true" : "false");
                      }}
                      color="secondary"
                      size="small"
                    />
                  }
                  label={<Typography variant="body2" color="#cbd5e1">📳 Vibration On/Off</Typography>}
                />
              </Box>
            </Box>
          </Box>
        )}

        {/* --- SCREEN 5: GAME OVER SCREEN --- */}
        {currentScreen === "gameover" && (
          <Box
            sx={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              textAlign: "center",
              animation: "fadeIn 0.4s ease-out",
            }}
          >
            <EmojiEventsIcon sx={{ fontSize: 44, color: "#fbbf24", mb: 1 }} />
            <Typography variant="h4" fontWeight="950" color="#ef4444" mb={2}>
              GAME OVER
            </Typography>

            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid size={6}>
                <Typography variant="caption" color="textSecondary">YOUR SCORE</Typography>
                <Typography variant="h5" fontWeight="900" color="#ec4899">{formatCubeValue(score)}</Typography>
              </Grid>
              <Grid size={6}>
                <Typography variant="caption" color="textSecondary">BEST SCORE</Typography>
                <Typography variant="h5" fontWeight="900" color="#fbbf24">{formatCubeValue(highScore)}</Typography>
              </Grid>
            </Grid>

            {/* Score Submission Form */}
            <Box
              component="form"
              onSubmit={handleSubmitScore}
              sx={{
                mb: 4,
                p: 2,
                borderRadius: "14px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <Typography variant="subtitle2" fontWeight="700" color="#cbd5e1" mb={1.5}>
                Submit your score to global rankings!
              </Typography>
              <Box display="flex" gap={1.2}>
                <TextField
                  fullWidth
                  variant="outlined"
                  size="small"
                  label="Name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Player name"
                  required
                  id="score-username-input"
                  InputProps={{ style: { color: "#fff", backgroundColor: "rgba(0,0,0,0.2)" } }}
                  InputLabelProps={{ style: { color: "#a855f7" } }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                  sx={{
                    background: "linear-gradient(to right, #ec4899, #8b5cf6)",
                    textTransform: "none",
                    fontWeight: "bold",
                    px: 3,
                  }}
                >
                  {isSubmitting ? "..." : "Send"}
                </Button>
              </Box>
            </Box>

            {/* Navigation buttons */}
            <Box display="flex" flexDirection="column" gap={1.8}>
              <Grid container spacing={1.5}>
                <Grid size={6}>
                  <Button
                    onClick={handlePlayClick}
                    fullWidth
                    variant="contained"
                    sx={{
                      background: "linear-gradient(to right, #10b981, #059669)",
                      py: 1.5,
                      borderRadius: "12px",
                      fontWeight: "750",
                    }}
                  >
                    Retry
                  </Button>
                </Grid>
                <Grid size={6}>
                  <Button
                    onClick={handleExitToHome}
                    fullWidth
                    variant="contained"
                    sx={{
                      background: "linear-gradient(to right, #fbbf24, #f57c00)",
                      py: 1.5,
                      borderRadius: "12px",
                      fontWeight: "750",
                    }}
                  >
                    Home
                  </Button>
                </Grid>
              </Grid>

              <Button
                variant="outlined"
                startIcon={<ShareIcon />}
                onClick={() => {
                  const text = `I merged my way to ${score} points in DVCubie2026 Snake Arena! Can you beat me? Play now on WorldNewzs!`;
                  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
                }}
                sx={{
                  borderRadius: "12px",
                  borderColor: "rgba(255,255,255,0.15)",
                  color: "#cbd5e1",
                  py: 1.2,
                  textTransform: "none",
                }}
              >
                Share Score
              </Button>
            </Box>
          </Box>
        )}

        {/* --- SCREEN 6: LEADERBOARD SCREEN --- */}
        {currentScreen === "leaderboard" && (
          <Box
            sx={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              animation: "fadeIn 0.4s ease-out",
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="h5" fontWeight="950" color="#a855f7">
                LEADERBOARD
              </Typography>
              <Button
                size="small"
                startIcon={<RefreshIcon />}
                onClick={fetchLeaderboard}
                sx={{ color: "#ec4899", textTransform: "none", minWidth: 0 }}
              >
                Sync
              </Button>
            </Box>

            {/* Rankings Tabs: Global vs Friends */}
            <Tabs
              value={leaderboardTab}
              onChange={(_, newVal) => setLeaderboardTab(newVal)}
              variant="fullWidth"
              textColor="secondary"
              indicatorColor="secondary"
              sx={{ mb: 2, borderBottom: "1px solid rgba(255,255,255,0.08)" }}
            >
              <Tab label="🌍 Global" sx={{ textTransform: "none", fontWeight: "bold" }} />
              <Tab label="👥 Friends" sx={{ textTransform: "none", fontWeight: "bold" }} />
            </Tabs>

            {leaderboardLoading ? (
              <Box display="flex" justifyContent="center" py={8}>
                <CircularProgress size={30} sx={{ color: "#ec4899" }} />
              </Box>
            ) : (
              <TableContainer component={Box} sx={{ background: "transparent", maxHeight: "40vh", overflowY: "auto", mb: 3 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: "#94a3b8", fontWeight: "bold", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Rank</TableCell>
                      <TableCell sx={{ color: "#94a3b8", fontWeight: "bold", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Player</TableCell>
                      <TableCell align="right" sx={{ color: "#94a3b8", fontWeight: "bold", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Score</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {leaderboardTab === 0 ? (
                      leaderboard.map((row, idx) => {
                        const isTop3 = idx < 3;
                        const colors = ["#fbbf24", "#cbd5e1", "#d97706"];
                        const lastSubmittedName = localStorage.getItem("dvcubie_submitted_name") || "";
                        const isSelf = row.username === lastSubmittedName;
                        return (
                          <TableRow 
                            key={row.id} 
                            sx={{ 
                              background: isSelf ? "rgba(251, 191, 36, 0.15)" : "transparent",
                              boxShadow: isSelf ? "inset 0 0 10px rgba(251, 191, 36, 0.3)" : "none",
                              "&:hover": { background: "rgba(255,255,255,0.03)" } 
                            }}
                          >
                            <TableCell sx={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                              {isTop3 ? <StarIcon sx={{ color: colors[idx], fontSize: 16 }} /> : idx + 1}
                            </TableCell>
                            <TableCell sx={{ fontWeight: isTop3 || isSelf ? "900" : "500", color: isSelf ? "#fbbf24" : "#fff", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                              {row.username} {isSelf && "(You)"}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: "800", color: isSelf ? "#fbbf24" : (isTop3 ? "#ec4899" : "#a855f7"), borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                              {row.points}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      // Friends Tab List (Simulated / Highlighted)
                      [
                        { username: localStorage.getItem("dvcubie_submitted_name") || "You (Highlight)", points: Math.max(score, highScore), isSelf: true },
                        { username: "Ganesh_Kumar", points: Math.max(score, highScore) * 0.9 + 40, isSelf: false },
                        { username: "AlphaSnake", points: Math.max(score, highScore) * 0.7 + 20, isSelf: false },
                        { username: "BlitzCubes", points: Math.max(score, highScore) * 0.5 + 10, isSelf: false },
                      ]
                        .sort((a, b) => b.points - a.points)
                        .map((row, idx) => {
                          const isTop3 = idx < 3;
                          const colors = ["#fbbf24", "#cbd5e1", "#d97706"];
                          return (
                            <TableRow 
                              key={row.username} 
                              sx={{ 
                                background: row.isSelf ? "rgba(251, 191, 36, 0.15)" : "transparent",
                                boxShadow: row.isSelf ? "inset 0 0 10px rgba(251, 191, 36, 0.3)" : "none",
                                "&:hover": { background: "rgba(255,255,255,0.03)" } 
                              }}
                            >
                              <TableCell sx={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                {isTop3 ? <StarIcon sx={{ color: colors[idx], fontSize: 16 }} /> : idx + 1}
                              </TableCell>
                              <TableCell sx={{ fontWeight: "900", color: row.isSelf ? "#fbbf24" : "#fff", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                {row.username}
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: "800", color: row.isSelf ? "#fbbf24" : (isTop3 ? "#ec4899" : "#a855f7"), borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                {Math.floor(row.points)}
                              </TableCell>
                            </TableRow>
                          );
                        })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            <Button
              onClick={() => setCurrentScreen("home")}
              variant="outlined"
              fullWidth
              sx={{
                borderRadius: "12px",
                borderColor: "rgba(255, 255, 255, 0.15)",
                color: "#cbd5e1",
                py: 1.2,
                textTransform: "none",
              }}
            >
              Back to Menu
            </Button>
          </Box>
        )}

        {/* --- SCREEN 7: SHOP / SKINS SCREEN --- */}
        {currentScreen === "shop" && (
          <Box
            sx={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              animation: "fadeIn 0.4s ease-out",
            }}
          >
            {/* Header / Coins balance */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5" fontWeight="950" color="#a855f7">
                🎨 Cubie Skins
              </Typography>
              <Box display="flex" alignItems="center" gap={0.5} sx={{ background: "rgba(251, 191, 36, 0.15)", p: "6px 12px", borderRadius: "10px" }}>
                <MonetizationOnIcon sx={{ color: "#fbbf24", fontSize: 18 }} />
                <Typography variant="subtitle2" fontWeight="800" color="#fbbf24">
                  {coins}
                </Typography>
              </Box>
            </Box>

            <List sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: 2, maxHeight: "40vh", overflowY: "auto", pr: 0.5 }}>
              {skins.map((skin) => {
                const isEquipped = equippedSkin === skin.id;
                return (
                  <ListItem
                    key={skin.id}
                    sx={{
                      background: isEquipped ? "rgba(168, 85, 247, 0.12)" : "rgba(255,255,255,0.02)",
                      border: isEquipped ? "1.5px solid #a855f7" : "1.5px solid rgba(255,255,255,0.06)",
                      borderRadius: "14px",
                      p: 1.5,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={2}>
                      {/* Color Preview Block */}
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: "6px",
                          backgroundColor: skin.color,
                          boxShadow: `0 0 10px ${skin.color}66`,
                        }}
                      />
                      <ListItemText
                        primary={skin.name}
                        primaryTypographyProps={{ style: { fontWeight: "700", color: "#fff" } }}
                        secondary={skin.id === "default" ? "Classic Outfit" : `Cost: ${skin.cost} coins`}
                        secondaryTypographyProps={{ style: { color: "#94a3b8", fontSize: "0.75rem" } }}
                      />
                    </Box>

                    {/* Action buttons */}
                    {skin.unlocked ? (
                      isEquipped ? (
                        <Button variant="text" size="small" sx={{ color: "#10b981", fontWeight: "bold" }}>
                          Equipped
                        </Button>
                      ) : (
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleEquipSkin(skin.id)}
                          sx={{ background: "#a855f7", textTransform: "none", fontWeight: "bold" }}
                        >
                          Equip
                        </Button>
                      )
                    ) : (
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleBuySkin(skin)}
                        disabled={coins < skin.cost}
                        startIcon={<LockIcon sx={{ fontSize: 12 }} />}
                        sx={{
                          background: "linear-gradient(to right, #fbbf24, #f57c00)",
                          textTransform: "none",
                          fontWeight: "bold",
                        }}
                      >
                        Unlock
                      </Button>
                    )}
                  </ListItem>
                );
              })}
            </List>

            <Button
              onClick={() => setCurrentScreen("home")}
              variant="outlined"
              fullWidth
              sx={{
                borderRadius: "12px",
                borderColor: "rgba(255, 255, 255, 0.15)",
                color: "#cbd5e1",
                py: 1.2,
                textTransform: "none",
              }}
            >
              Back to Menu
            </Button>
          </Box>
        )}

        {/* --- SCREEN 8: PROFILE / MEDALS SCREEN --- */}
        {currentScreen === "profile" && (
          <Box
            sx={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              animation: "fadeIn 0.4s ease-out",
            }}
          >
            <Typography variant="h5" fontWeight="950" color="#a855f7" mb={3} textAlign="center">
              👤 Player Profile
            </Typography>

            {/* Stats Card */}
            <Card sx={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", mb: 3 }}>
              <CardContent sx={{ p: 2 }}>
                <Grid container spacing={2} textAlign="center">
                  <Grid size={6}>
                    <Typography variant="caption" color="textSecondary">BEST SCORE</Typography>
                    <Typography variant="h5" fontWeight="900" color="#fbbf24">{highScore}</Typography>
                  </Grid>
                  <Grid size={6}>
                    <Typography variant="caption" color="textSecondary">COINS</Typography>
                    <Typography variant="h5" fontWeight="900" color="#10b981">{coins}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Achievements list */}
            <Typography variant="subtitle2" fontWeight="700" color="#a855f7" mb={1}>
              Achievements & Badges
            </Typography>
            <List sx={{ maxHeight: 200, overflowY: "auto", mb: 3 }}>
              {achievements.map((ach) => (
                <ListItem key={ach.id} sx={{ px: 1, py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 28 }}>
                    {ach.unlocked ? (
                      <CheckCircleIcon sx={{ color: "#10b981", fontSize: 18 }} />
                    ) : (
                      <RadioButtonUncheckedIcon sx={{ color: "#475569", fontSize: 18 }} />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={ach.name}
                    primaryTypographyProps={{ style: { fontWeight: "750", fontSize: "0.85rem", color: ach.unlocked ? "#fff" : "#94a3b8" } }}
                    secondary={ach.description}
                    secondaryTypographyProps={{ style: { color: "#64748b", fontSize: "0.75rem" } }}
                  />
                </ListItem>
              ))}
            </List>

            <Button
              onClick={() => setCurrentScreen("home")}
              variant="outlined"
              fullWidth
              sx={{
                borderRadius: "12px",
                borderColor: "rgba(255, 255, 255, 0.15)",
                color: "#cbd5e1",
                py: 1.2,
                textTransform: "none",
              }}
            >
              Back to Menu
            </Button>
          </Box>
        )}
        </Card>
      </Box>

      {/* SETTINGS DIALOG */}
      <Dialog
        open={showSettingsDialog}
        onClose={() => setShowSettingsDialog(false)}
        PaperProps={{
          sx: {
            background: "linear-gradient(135deg, #1c1936, #0e0d1f)",
            border: "2px solid #a855f7",
            borderRadius: "20px",
            color: "#fff",
            p: 2,
          },
        }}
      >
        <DialogTitle sx={{ textAlign: "center", pb: 1 }}>
          <Typography variant="h6" fontWeight="950" color="#a855f7">
            Game Settings
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <FormControlLabel
              control={
                <Switch
                  checked={hideSearch}
                  onChange={(e) => handleToggleSearch(e.target.checked)}
                  color="secondary"
                />
              }
              label={<Typography variant="body2" color="#cbd5e1">Auto-Hide Search Bar</Typography>}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={hideBadges}
                  onChange={(e) => handleToggleBadges(e.target.checked)}
                  color="secondary"
                />
              }
              label={<Typography variant="body2" color="#cbd5e1">Auto-Hide Header Badges</Typography>}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSettingsDialog(false)} sx={{ color: "#a855f7", fontWeight: "bold" }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default GameWrapper;
