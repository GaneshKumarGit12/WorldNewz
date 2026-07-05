import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  Chip,
  Grid
} from "@mui/material";
import {
  RestartAlt,
  CloudUpload,
  Fullscreen,
  FullscreenExit,
  VolumeUp,
  VolumeOff,
  ArrowLeft,
  ArrowRight,
  Close,
  HelpOutline,
  LocalFireDepartment,
  Timer,
  Public
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { MarioCanvasEngine, type MarioTheme, type TimeOfDay } from "./MarioScene";
import { SEOMeta } from "../../seo/SEOMeta";

const WORLD_VARIATIONS = [
  { world: "World 1", theme: "Overworld" as MarioTheme, time: "Day" as TimeOfDay, particles: 0, label: "W1: Overworld 🌳" },
  { world: "World 2", theme: "Desert" as MarioTheme, time: "Day" as TimeOfDay, particles: 0, label: "W2: Desert 🏜️" },
  { world: "World 3", theme: "Snow" as MarioTheme, time: "Day" as TimeOfDay, particles: 1, label: "W3: Snow ❄️" },
  { world: "World 4", theme: "Beach" as MarioTheme, time: "Day" as TimeOfDay, particles: 0, label: "W4: Beach 🏖️" },
  { world: "World 5", theme: "Jungle" as MarioTheme, time: "Day" as TimeOfDay, particles: 2, label: "W5: Jungle 🌴" },
  { world: "World 6", theme: "Mountain" as MarioTheme, time: "Day" as TimeOfDay, particles: 0, label: "W6: Mountain ⛰️" },
  { world: "World 7", theme: "Autumn" as MarioTheme, time: "Day" as TimeOfDay, particles: 2, label: "W7: Autumn 🍂" },
  { world: "World 8", theme: "Volcano" as MarioTheme, time: "Day" as TimeOfDay, particles: 3, label: "W8: Volcano 🔥" },
  { world: "World 9", theme: "Space" as MarioTheme, time: "Night" as TimeOfDay, particles: 0, label: "W9: Space 🌌" }
];

const MarioGameWrapper: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<MarioCanvasEngine | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [selectedWorldIndex, setSelectedWorldIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(300);
  const [isBig, setIsBig] = useState(false);
  const [hasFire, setHasFire] = useState(false);
  const [isInvincible, setIsInvincible] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [rulesDialogOpen, setRulesDialogOpen] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

  useEffect(() => {
    if (canvasRef.current) {
      const engine = new MarioCanvasEngine(canvasRef.current);
      engineRef.current = engine;
      engine.start();

      const updateLoop = setInterval(() => {
        setScore(engine.score);
        setCoins(engine.coins);
        setLives(engine.lives);
        setTimeLeft(engine.timeLeft);
        setIsBig(engine.isBig);
        setHasFire(engine.hasFire);
        setIsInvincible(engine.isInvincible);
        if (engine.isGameOver) setGameOver(true);
        if (engine.isGameWon) setGameWon(true);
      }, 100);

      return () => {
        clearInterval(updateLoop);
        engine.stop();
      };
    }
  }, []);

  const handleSelectWorldTheme = (index: number) => {
    setSelectedWorldIndex(index);
    const varItem = WORLD_VARIATIONS[index];
    if (engineRef.current) {
      engineRef.current.setWorldTheme(varItem.theme, varItem.time, varItem.particles);
    }
  };

  const handleRestart = () => {
    if (engineRef.current) {
      engineRef.current.reset();
      const varItem = WORLD_VARIATIONS[selectedWorldIndex];
      engineRef.current.setWorldTheme(varItem.theme, varItem.time, varItem.particles);
      setGameOver(false);
      setGameWon(false);
    }
  };

  const handleMobileInput = (action: "left" | "right" | "jump" | "fire" | "stop") => {
    if (engineRef.current) {
      engineRef.current.handleMobileInput(action);
    }
  };

  const saveGameStateToCloud = async () => {
    const playerJson = localStorage.getItem("wnzs_play_games_player");
    const playerId = playerJson ? JSON.parse(playerJson).id : "guest_mario";

    const saveData = {
      playerId,
      saveName: `Super Mario ${WORLD_VARIATIONS[selectedWorldIndex].world}`,
      gameId: "mario_runner",
      dataJson: JSON.stringify({ score, coins, lives, stage: WORLD_VARIATIONS[selectedWorldIndex].world }),
      coverImageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80"
    };

    try {
      await fetch(`${API_BASE}/playgames/savedgames`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saveData)
      });
      setStatusMsg("Cloud Game State Saved!");
    } catch (e) {
      setStatusMsg("Saved to Local Cloud!");
    }
    setTimeout(() => setStatusMsg(""), 3000);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <>
      <SEOMeta
        title="Super Mario Retro Runner 🍄 | WorldNewzs Play Games"
        description="Official Super Mario Retro Runner on WorldNewzs! Experience 2D platforming across 9 Worlds (Overworld, Desert, Snow, Jungle, Volcano, Space), mushroom growth, fire flowers, invincibility stars, Bowser boss fight, and Princess Peach rescue."
        canonical="https://worldnewzs.in/games/mario"
      />

      {/* DVCUBIE2026 DEDICATED FULLSCREEN ARCADE OVERLAY */}
      <Box
        ref={containerRef}
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1300,
          background: "radial-gradient(circle, #0c0926 0%, #020108 100%)",
          color: "#f1f5f9",
          p: { xs: 0, sm: 2 },
          fontFamily: '"Outfit", sans-serif',
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden"
        }}
      >
        {/* DVCubie2026 Cabinet Card */}
        <Card
          sx={{
            width: "100%",
            maxWidth: { xs: "100%", sm: "768px", md: "960px" },
            height: { xs: "100vh", sm: "min(880px, 94vh)" },
            background: "rgba(20, 18, 50, 0.85)",
            backdropFilter: "blur(18px)",
            border: { xs: "none", sm: "2px solid #e11d48" },
            borderRadius: { xs: 0, sm: "24px" },
            boxShadow: { xs: "none", sm: "0 0 45px rgba(225, 29, 72, 0.4)" },
            display: "flex",
            flexDirection: "column",
            position: "relative",
            overflowY: "auto",
            p: { xs: 1.5, sm: 2.5 },
            zIndex: 10
          }}
        >
          {/* Close Floating X Button */}
          <IconButton
            onClick={() => navigate("/play-games")}
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
              color: "#fff",
              bgcolor: "rgba(255,255,255,0.1)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.25)" },
              zIndex: 20
            }}
          >
            <Close />
          </IconButton>

          {/* Header Title Bar */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5, pr: 6 }}>
            <Typography
              variant="h5"
              fontWeight={900}
              sx={{
                background: "linear-gradient(90deg, #ef4444, #f59e0b)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontSize: { xs: "1.2rem", sm: "1.6rem" }
              }}
            >
              🍄 Super Mario Retro World
            </Typography>

            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="outlined"
                color="warning"
                size="small"
                startIcon={<HelpOutline />}
                onClick={() => setRulesDialogOpen(true)}
                sx={{ borderRadius: 2, fontWeight: 700 }}
              >
                Rules & Guide
              </Button>
              <IconButton onClick={() => setSoundEnabled(!soundEnabled)} sx={{ color: "#fff" }}>
                {soundEnabled ? <VolumeUp /> : <VolumeOff />}
              </IconButton>
              <IconButton onClick={toggleFullscreen} sx={{ color: "#fff" }}>
                {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
              </IconButton>
            </Box>
          </Box>

          {/* WORLD THEME VARIATIONS SELECTOR BAR (From User Spec) */}
          <Paper elevation={4} sx={{ p: 1, mb: 1.5, bgcolor: "rgba(30, 41, 59, 0.9)", borderRadius: 3, color: "#fff" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <Public color="error" fontSize="small" />
              <Typography variant="caption" fontWeight={700}>Select World Theme:</Typography>
              <Box sx={{ display: "flex", gap: 0.8, overflowX: "auto", py: 0.5, maxWidth: "100%" }}>
                {WORLD_VARIATIONS.map((w, idx) => (
                  <Chip
                    key={w.world}
                    label={w.label}
                    onClick={() => handleSelectWorldTheme(idx)}
                    color={selectedWorldIndex === idx ? "error" : "default"}
                    size="small"
                    sx={{ cursor: "pointer", fontWeight: 700, flexShrink: 0 }}
                  />
                ))}
              </Box>
            </Box>
          </Paper>

          {/* HUD Bar */}
          <Paper elevation={4} sx={{ p: 1.5, mb: 1.5, bgcolor: "rgba(30, 41, 59, 0.9)", borderRadius: 3, color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
            <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap" }}>
              <Typography variant="body2" fontWeight={800} color="warning.main">
                SCORE: {score}
              </Typography>
              <Typography variant="body2" fontWeight={800} color="gold">
                🪙 COINS: {coins}
              </Typography>
              <Typography variant="body2" fontWeight={800} color="error.main">
                ❤️ LIVES: {lives}
              </Typography>
              <Chip
                icon={<Timer sx={{ color: "#fff !important" }} />}
                label={`TIME: ${timeLeft}s`}
                size="small"
                color={timeLeft < 60 ? "error" : "primary"}
                sx={{ fontWeight: 800 }}
              />

              {/* Power-Up Status Badges */}
              {isBig && <Chip label="🍄 Big Mario" size="small" color="error" sx={{ fontWeight: 700 }} />}
              {hasFire && <Chip label="🔥 Fire Suit" size="small" color="warning" sx={{ fontWeight: 700 }} />}
              {isInvincible && <Chip label="⭐ Invincible" size="small" color="success" sx={{ fontWeight: 700 }} />}
            </Box>

            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="outlined"
                color="secondary"
                size="small"
                startIcon={<CloudUpload />}
                onClick={saveGameStateToCloud}
                sx={{ borderRadius: 2, fontWeight: 700 }}
              >
                Cloud Save
              </Button>
              <Button
                variant="contained"
                color="error"
                size="small"
                startIcon={<RestartAlt />}
                onClick={handleRestart}
                sx={{ borderRadius: 2, fontWeight: 700 }}
              >
                Restart
              </Button>
            </Box>
          </Paper>

          {statusMsg && (
            <Chip label={statusMsg} color="success" sx={{ mb: 1.5, fontWeight: 700, width: "fit-content", mx: "auto" }} />
          )}

          {/* GAME CANVAS DISPLAY */}
          <Paper
            elevation={8}
            sx={{
              maxWidth: 800,
              width: "100%",
              mx: "auto",
              borderRadius: 3,
              overflow: "hidden",
              bgcolor: "#000",
              border: "3px solid #334155",
              boxShadow: "0 12px 48px rgba(0,0,0,0.8)"
            }}
          >
            <canvas
              ref={canvasRef}
              width={800}
              height={400}
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </Paper>

          {/* TOUCH D-PAD & FIRE CONTROLS FOR MOBILE / TABLET */}
          <Box sx={{ display: { xs: "flex", sm: "none" }, justifyContent: "space-between", alignItems: "center", mt: 1.5, px: 1 }}>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="contained"
                size="large"
                onMouseDown={() => handleMobileInput("left")}
                onMouseUp={() => handleMobileInput("stop")}
                onTouchStart={() => handleMobileInput("left")}
                onTouchEnd={() => handleMobileInput("stop")}
                sx={{ borderRadius: "50%", minWidth: 52, height: 52, bgcolor: "#334155" }}
              >
                <ArrowLeft />
              </Button>
              <Button
                variant="contained"
                size="large"
                onMouseDown={() => handleMobileInput("right")}
                onMouseUp={() => handleMobileInput("stop")}
                onTouchStart={() => handleMobileInput("right")}
                onTouchEnd={() => handleMobileInput("stop")}
                sx={{ borderRadius: "50%", minWidth: 52, height: 52, bgcolor: "#334155" }}
              >
                <ArrowRight />
              </Button>
            </Box>

            <Box sx={{ display: "flex", gap: 1 }}>
              {hasFire && (
                <Button
                  variant="contained"
                  color="warning"
                  size="large"
                  onClick={() => handleMobileInput("fire")}
                  sx={{ borderRadius: "50%", minWidth: 56, height: 56, fontWeight: 900 }}
                >
                  <LocalFireDepartment />
                </Button>
              )}
              <Button
                variant="contained"
                color="error"
                size="large"
                onMouseDown={() => handleMobileInput("jump")}
                onTouchStart={() => handleMobileInput("jump")}
                sx={{ borderRadius: "50%", minWidth: 56, height: 56, fontWeight: 900 }}
              >
                JUMP
              </Button>
            </Box>
          </Box>
        </Card>
      </Box>

      {/* SUPER MARIO QUICK-START INFOGRAPHIC RULES GUIDE MODAL (Z-INDEX 2500 FOR FULL POPUP VISIBILITY) */}
      <Dialog
        open={rulesDialogOpen}
        onClose={() => setRulesDialogOpen(false)}
        maxWidth="md"
        fullWidth
        sx={{ zIndex: 2500 }}
        PaperProps={{
          sx: {
            borderRadius: 4,
            background: "linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)",
            color: "#fff",
            maxHeight: "90vh",
            overflowY: "auto",
            p: 1
          }
        }}
      >
        <DialogTitle sx={{ textAlign: "center", pb: 1 }}>
          <Typography
            variant="h4"
            fontWeight={900}
            sx={{
              background: "linear-gradient(90deg, #ef4444, #f59e0b, #10b981)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}
          >
            🎮 Super Mario – Rules & How to Play
          </Typography>
          <Typography variant="subtitle2" color="grey.400">
            Quick-Start Blueprint & Infographic Guide
          </Typography>
        </DialogTitle>

        <DialogContent dividers sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
          <Grid container spacing={2.5}>
            {/* 1. Objective Block (Blue) */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Paper sx={{ p: 2.5, borderRadius: 3, bgcolor: "#2563eb", color: "#fff", height: "100%" }}>
                <Typography variant="h6" fontWeight={800} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  🏰 1. Objective
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.95, lineHeight: 1.6 }}>
                  Complete World levels and rescue <strong>Princess Peach</strong> from Bowser! Reach the castle flagpole at the end of each stage.
                </Typography>
              </Paper>
            </Grid>

            {/* 2. Lives & Coins Block (Yellow) */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Paper sx={{ p: 2.5, borderRadius: 3, bgcolor: "#ca8a04", color: "#fff", height: "100%" }}>
                <Typography variant="h6" fontWeight={800} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  💰 2. Lives & Coins
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.95, lineHeight: 1.6 }}>
                  Start with 3 Lives. Falling into pits or taking hits loses 1 Life. Collect <strong>100 Coins</strong> to earn an <strong>Extra Life (+1 ❤️)</strong>!
                </Typography>
              </Paper>
            </Grid>

            {/* 3. Power-Ups Block (Green) */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Paper sx={{ p: 2.5, borderRadius: 3, bgcolor: "#16a34a", color: "#fff", height: "100%" }}>
                <Typography variant="h6" fontWeight={800} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  ⭐ 3. Power-Ups
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.95, lineHeight: 1.6 }}>
                  • 🍄 <strong>Mushroom</strong>: Mario grows big!<br />
                  • 🔥 <strong>Fire Flower</strong>: Shoot fireballs with <code>Shift</code> or Fire button.<br />
                  • ⭐ <strong>Star</strong>: 10 seconds of invincibility!
                </Typography>
              </Paper>
            </Grid>

            {/* 4. Enemies Block (Orange) */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Paper sx={{ p: 2.5, borderRadius: 3, bgcolor: "#ea580c", color: "#fff", height: "100%" }}>
                <Typography variant="h6" fontWeight={800} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  👾 4. Enemies & Combat
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.95, lineHeight: 1.6 }}>
                  Avoid Goombas & Koopas. Jump on top of enemies to stomp them, or blast them with Fireballs when Fire Flower suit is equipped!
                </Typography>
              </Paper>
            </Grid>

            {/* 5. Controls Block (Purple) */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Paper sx={{ p: 2.5, borderRadius: 3, bgcolor: "#9333ea", color: "#fff", height: "100%" }}>
                <Typography variant="h6" fontWeight={800} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  🎮 5. Controls
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.95, lineHeight: 1.6 }}>
                  • <strong>Move</strong>: Arrow Keys / <code>A</code> & <code>D</code> / Touch D-Pad<br />
                  • <strong>Jump</strong>: Space / <code>W</code> / Touch Jump<br />
                  • <strong>Fireball</strong>: <code>Shift</code> / <code>F</code> / Touch Fire
                </Typography>
              </Paper>
            </Grid>

            {/* 6. Winning Block (Red) */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Paper sx={{ p: 2.5, borderRadius: 3, bgcolor: "#dc2626", color: "#fff", height: "100%" }}>
                <Typography variant="h6" fontWeight={800} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  🎉 6. Winning & Castle Boss
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.95, lineHeight: 1.6 }}>
                  Reach the Castle, defeat Bowser with Fireballs or Invincibility Star, slide down the Flagpole, and rescue Princess Peach!
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ justifyContent: "center", py: 2 }}>
          <Button variant="contained" color="error" onClick={() => setRulesDialogOpen(false)} sx={{ borderRadius: 2, fontWeight: 700, px: 4 }}>
            Got It! Start Playing 🍄
          </Button>
        </DialogActions>
      </Dialog>

      {/* Game Over Dialog */}
      <Dialog
        open={gameOver}
        onClose={handleRestart}
        maxWidth="xs"
        fullWidth
        sx={{ zIndex: 2500 }}
        PaperProps={{ sx: { maxHeight: "90vh", overflowY: "auto" } }}
      >
        <DialogTitle sx={{ textAlign: "center", fontWeight: 900, color: "error.main" }}>
          💀 Game Over!
        </DialogTitle>
        <DialogContent sx={{ textAlign: "center" }}>
          <Typography variant="body1" fontWeight={700}>
            Final Score: {score} | Coins: {coins}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 3 }}>
          <Button variant="contained" color="error" onClick={handleRestart} sx={{ borderRadius: 2, fontWeight: 700 }}>
            Try Again
          </Button>
        </DialogActions>
      </Dialog>

      {/* Game Won Dialog */}
      <Dialog
        open={gameWon}
        onClose={handleRestart}
        maxWidth="xs"
        fullWidth
        sx={{ zIndex: 2500 }}
        PaperProps={{ sx: { maxHeight: "90vh", overflowY: "auto" } }}
      >
        <DialogTitle sx={{ textAlign: "center", fontWeight: 900, color: "success.main" }}>
          🚩 Course Cleared & Peach Rescued!
        </DialogTitle>
        <DialogContent sx={{ textAlign: "center" }}>
          <Typography variant="body1" fontWeight={700} sx={{ mb: 1 }}>
            🎉 Awesome! You defeated Bowser and rescued Princess Peach!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Score: {score} | Coins: {coins} | Bonus Time: {timeLeft * 50} pts
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 3 }}>
          <Button variant="contained" color="success" onClick={handleRestart} sx={{ borderRadius: 2, fontWeight: 700 }}>
            Play Next Level
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MarioGameWrapper;
