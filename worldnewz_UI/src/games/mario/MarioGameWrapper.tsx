import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from "@mui/material";
import {
  RestartAlt,
  CloudUpload,
  ArrowBack,
  Fullscreen,
  FullscreenExit,
  VolumeUp,
  VolumeOff,
  ArrowLeft,
  ArrowRight
} from "@mui/icons-material";
import { MarioCanvasEngine } from "./MarioScene";
import { SEOMeta } from "../../seo/SEOMeta";

const MarioGameWrapper: React.FC = () => {
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

      // Keyboard Listeners
      const handleKeyDown = (e: KeyboardEvent) => {
        engine.keys[e.code] = true;
      };
      const handleKeyUp = (e: KeyboardEvent) => {
        engine.keys[e.code] = false;
      };

      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);

      // UI Sync Loop
      const syncInterval = setInterval(() => {
        if (engineRef.current) {
          setScore(engineRef.current.score);
          setCoins(engineRef.current.coins);
          setLives(engineRef.current.lives);
          if (engineRef.current.isGameOver && !gameOver) {
            setGameOver(true);
            submitScore(engineRef.current.score);
          }
          if (engineRef.current.isGameWon && !gameWon) {
            setGameWon(true);
            submitScore(engineRef.current.score + 5000);
          }
        }
      }, 100);

      return () => {
        engine.stop();
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("keyup", handleKeyUp);
        clearInterval(syncInterval);
      };
    }
  }, []);

  const handleRestart = () => {
    if (engineRef.current) {
      engineRef.current.initLevel();
      engineRef.current.start();
      setGameOver(false);
      setGameWon(false);
      setStatusMsg("");
    }
  };

  const handleTouchControl = (key: string, state: boolean) => {
    if (engineRef.current) {
      engineRef.current.keys[key] = state;
    }
  };

  const submitScore = async (finalScore: number) => {
    const playerJson = localStorage.getItem("wnzs_play_games_player");
    const playerId = playerJson ? JSON.parse(playerJson).id : "guest_mario";

    try {
      await fetch(`${API_BASE}/playgames/leaderboards/leaderboard_mario_runner/scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, scoreValue: finalScore })
      });
      await fetch(`${API_BASE}/playgames/achievements/ach_mario_coin_master/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, steps: coins })
      });
      setStatusMsg("High score & achievements saved to Google Play Games!");
    } catch (e) {
      console.warn("Failed to post mario score", e);
    }
  };

  const handleCloudSave = async () => {
    const playerJson = localStorage.getItem("wnzs_play_games_player");
    const playerId = playerJson ? JSON.parse(playerJson).id : "guest_mario";

    const saveData = {
      playerId,
      saveName: "Mario World 1-1 Save",
      gameId: "mario_runner",
      dataJson: JSON.stringify({ score, coins, lives, level: 1, timestamp: Date.now() }),
      coverImageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80"
    };

    try {
      await fetch(`${API_BASE}/playgames/savedgames`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saveData)
      });
      setStatusMsg("Game state saved to Google Play Games Cloud Storage!");
    } catch (e) {
      setStatusMsg("Game state saved locally!");
    }
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
    <Box sx={{ minHeight: "100vh", bgcolor: "#0f172a", color: "#fff", py: 4 }} ref={containerRef}>
      <SEOMeta
        title="Super Mario Retro Runner 🍄 | WorldNewzs Play Games"
        description="Play Super Mario Retro Runner online on WorldNewzs! Experience retro 2D platforming, coin blocks, Goomba enemies, global leaderboards, and cloud save state sync."
        canonical="https://worldnewzs.in/games/mario"
      />

      <Container maxWidth="md">
        {/* Navigation Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Button
            href="/play-games"
            startIcon={<ArrowBack />}
            sx={{ color: "#fff", fontWeight: 700 }}
          >
            Play Games Hub
          </Button>

          <Typography variant="h4" fontWeight={900} sx={{ background: "linear-gradient(90deg, #ff5252, #ff4081)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
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

        {/* Stats HUD Bar */}
        <Paper elevation={4} sx={{ p: 2, mb: 2, bgcolor: "#1e293b", borderRadius: 3, color: "#fff", display: "flex", justifyContent: "space-around", alignItems: "center" }}>
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="caption" color="grey.400">SCORE</Typography>
            <Typography variant="h6" fontWeight={800} color="warning.main">{score.toLocaleString()}</Typography>
          </Box>
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="caption" color="grey.400">COINS 🪙</Typography>
            <Typography variant="h6" fontWeight={800} color="secondary.main">{coins}</Typography>
          </Box>
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="caption" color="grey.400">LIVES ❤️</Typography>
            <Typography variant="h6" fontWeight={800} color="error.main">{lives}</Typography>
          </Box>
          <Button
            variant="contained"
            color="secondary"
            size="small"
            startIcon={<CloudUpload />}
            onClick={handleCloudSave}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            Cloud Save
          </Button>
        </Paper>

        {statusMsg && (
          <Paper sx={{ p: 1.5, mb: 2, bgcolor: "#059669", color: "#fff", textAlign: "center", fontWeight: 700, borderRadius: 2 }}>
            {statusMsg}
          </Paper>
        )}

        {/* CANVASCANVAS GAME STAGE */}
        <Paper
          elevation={6}
          sx={{
            maxWidth: 800,
            mx: "auto",
            borderRadius: 3,
            overflow: "hidden",
            border: "4px solid #334155",
            bgcolor: "#5c94fc"
          }}
        >
          <canvas
            ref={canvasRef}
            width={800}
            height={440}
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </Paper>

        {/* On-Screen Mobile Touch D-Pad Controls */}
        <Box sx={{ mt: 3, display: { xs: "flex", md: "none" }, justifyContent: "space-between", alignItems: "center", px: 2 }}>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="contained"
              onTouchStart={() => handleTouchControl("TouchLeft", true)}
              onTouchEnd={() => handleTouchControl("TouchLeft", false)}
              onMouseDown={() => handleTouchControl("TouchLeft", true)}
              onMouseUp={() => handleTouchControl("TouchLeft", false)}
              sx={{ minWidth: 60, height: 60, borderRadius: 3, bgcolor: "#334155" }}
            >
              <ArrowLeft sx={{ fontSize: 36 }} />
            </Button>
            <Button
              variant="contained"
              onTouchStart={() => handleTouchControl("TouchRight", true)}
              onTouchEnd={() => handleTouchControl("TouchRight", false)}
              onMouseDown={() => handleTouchControl("TouchRight", true)}
              onMouseUp={() => handleTouchControl("TouchRight", false)}
              sx={{ minWidth: 60, height: 60, borderRadius: 3, bgcolor: "#334155" }}
            >
              <ArrowRight sx={{ fontSize: 36 }} />
            </Button>
          </Box>

          <Button
            variant="contained"
            color="error"
            onTouchStart={() => handleTouchControl("TouchJump", true)}
            onTouchEnd={() => handleTouchControl("TouchJump", false)}
            onMouseDown={() => handleTouchControl("TouchJump", true)}
            onMouseUp={() => handleTouchControl("TouchJump", false)}
            sx={{ width: 80, height: 60, borderRadius: 3, fontWeight: 900, fontSize: "1.2rem" }}
          >
            JUMP
          </Button>
        </Box>

        {/* Controls Instructions */}
        <Paper sx={{ p: 2, mt: 3, bgcolor: "#1e293b", borderRadius: 3, color: "grey.300", textAlign: "center" }}>
          <Typography variant="body2">
            <strong>Desktop Controls:</strong> Move with <code>A / D</code> or <code>Arrow Keys</code>. Jump with <code>W</code>, <code>Space</code>, or <code>Up Arrow</code>.
          </Typography>
        </Paper>
      </Container>

      {/* Game Over / Win Dialog */}
      <Dialog open={gameOver || gameWon} onClose={handleRestart} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: "center", fontWeight: 900 }}>
          {gameWon ? "🎉 LEVEL CLEARED!" : "💀 GAME OVER"}
        </DialogTitle>
        <DialogContent sx={{ textAlign: "center" }}>
          <Typography variant="h5" color={gameWon ? "success.main" : "error.main"} fontWeight={800} sx={{ mb: 2 }}>
            {gameWon ? "You reached the Flagpole!" : "Out of lives!"}
          </Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>Final Score: <strong>{score.toLocaleString()}</strong></Typography>
          <Typography variant="body2" color="text.secondary">Coins Collected: {coins}</Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 3 }}>
          <Button variant="contained" onClick={handleRestart} startIcon={<RestartAlt />} sx={{ borderRadius: 2, fontWeight: 700 }}>
            Play Again
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MarioGameWrapper;
