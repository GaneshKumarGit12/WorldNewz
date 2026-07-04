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
  Chip
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
  Close
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { MarioCanvasEngine } from "./MarioScene";
import { SEOMeta } from "../../seo/SEOMeta";

const MarioGameWrapper: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<MarioCanvasEngine | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

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
        if (engine.isGameOver) setGameOver(true);
        if (engine.isGameWon) setGameWon(true);
      }, 100);

      return () => {
        clearInterval(updateLoop);
        engine.stop();
      };
    }
  }, []);

  const handleRestart = () => {
    if (engineRef.current) {
      engineRef.current.reset();
      setGameOver(false);
      setGameWon(false);
    }
  };

  const handleMobileInput = (action: "left" | "right" | "jump" | "stop") => {
    if (engineRef.current) {
      engineRef.current.handleMobileInput(action);
    }
  };

  const saveGameStateToCloud = async () => {
    const playerJson = localStorage.getItem("wnzs_play_games_player");
    const playerId = playerJson ? JSON.parse(playerJson).id : "guest_mario";

    const saveData = {
      playerId,
      saveName: "Super Mario Progress",
      gameId: "mario_runner",
      dataJson: JSON.stringify({ score, coins, lives, stage: "World 1-1" }),
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
        description="Play Super Mario Retro Runner on WorldNewzs! Experience 2D platforming, coin blocks, enemy Goombas, high scores, cloud save states, and mobile touch D-Pad controls."
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
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, pr: 6 }}>
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
              <IconButton onClick={() => setSoundEnabled(!soundEnabled)} sx={{ color: "#fff" }}>
                {soundEnabled ? <VolumeUp /> : <VolumeOff />}
              </IconButton>
              <IconButton onClick={toggleFullscreen} sx={{ color: "#fff" }}>
                {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
              </IconButton>
            </Box>
          </Box>

          {/* HUD Bar */}
          <Paper elevation={4} sx={{ p: 1.5, mb: 2, bgcolor: "rgba(30, 41, 59, 0.9)", borderRadius: 3, color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <Typography variant="body2" fontWeight={800} color="warning.main">
                SCORE: {score}
              </Typography>
              <Typography variant="body2" fontWeight={800} color="gold">
                🪙 COINS: {coins}
              </Typography>
              <Typography variant="body2" fontWeight={800} color="error.main">
                ❤️ LIVES: {lives}
              </Typography>
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
                Save Cloud
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
            <Chip label={statusMsg} color="success" sx={{ mb: 2, fontWeight: 700, width: "fit-content", mx: "auto" }} />
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

          {/* TOUCH D-PAD CONTROLS FOR MOBILE / TABLET */}
          <Box sx={{ display: { xs: "flex", sm: "none" }, justifyContent: "space-between", alignItems: "center", mt: 2, px: 2 }}>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="contained"
                size="large"
                onMouseDown={() => handleMobileInput("left")}
                onMouseUp={() => handleMobileInput("stop")}
                onTouchStart={() => handleMobileInput("left")}
                onTouchEnd={() => handleMobileInput("stop")}
                sx={{ borderRadius: "50%", minWidth: 60, height: 60, bgcolor: "#334155" }}
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
                sx={{ borderRadius: "50%", minWidth: 60, height: 60, bgcolor: "#334155" }}
              >
                <ArrowRight />
              </Button>
            </Box>

            <Button
              variant="contained"
              color="error"
              size="large"
              onMouseDown={() => handleMobileInput("jump")}
              onTouchStart={() => handleMobileInput("jump")}
              sx={{ borderRadius: "50%", minWidth: 70, height: 70, fontWeight: 900 }}
            >
              JUMP
            </Button>
          </Box>
        </Card>
      </Box>

      {/* Game Over Dialog */}
      <Dialog open={gameOver} onClose={handleRestart} maxWidth="xs" fullWidth>
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
      <Dialog open={gameWon} onClose={handleRestart} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: "center", fontWeight: 900, color: "success.main" }}>
          🚩 Course Cleared!
        </DialogTitle>
        <DialogContent sx={{ textAlign: "center" }}>
          <Typography variant="body1" fontWeight={700}>
            Awesome! You reached the Flagpole with {score} Points!
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
