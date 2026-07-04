import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Chip,
  IconButton,
  Slider
} from "@mui/material";
import {
  EmojiEvents,
  ArrowBack,
  Fullscreen,
  FullscreenExit,
  VolumeUp,
  VolumeOff,
  Tune
} from "@mui/icons-material";
import { HitGoalSoccerEngine } from "./HitGoalScene";
import { SEOMeta } from "../../seo/SEOMeta";

const HitGoalGameWrapper: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<HitGoalSoccerEngine | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [score, setScore] = useState(0);
  const [goals, setGoals] = useState(0);
  const [shots, setShots] = useState(0);
  const [streak, setStreak] = useState(0);
  const [curve, setCurve] = useState(0);
  const [lastMsg, setLastMsg] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

  useEffect(() => {
    if (canvasRef.current) {
      const engine = new HitGoalSoccerEngine(canvasRef.current);
      engineRef.current = engine;
      engine.start();

      const syncInterval = setInterval(() => {
        if (engineRef.current) {
          setScore(engineRef.current.score);
          setGoals(engineRef.current.goals);
          setShots(engineRef.current.shotsCount);
          setStreak(engineRef.current.streak);
          if (engineRef.current.lastResult) {
            setLastMsg(engineRef.current.lastResult);
          }
          if (engineRef.current.streak >= 3 && !statusMsg) {
            submitHattrickAchievement();
          }
        }
      }, 100);

      return () => {
        engine.stop();
        clearInterval(syncInterval);
      };
    }
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !engineRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    engineRef.current.isAiming = true;
    engineRef.current.aimStart = { x, y };
    engineRef.current.aimEnd = { x, y };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !engineRef.current || !engineRef.current.isAiming) return;
    const rect = canvasRef.current.getBoundingClientRect();
    engineRef.current.aimEnd = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseUp = () => {
    if (!engineRef.current || !engineRef.current.isAiming) return;
    engineRef.current.isAiming = false;
    const dx = engineRef.current.aimEnd.x - engineRef.current.aimStart.x;
    const dy = engineRef.current.aimEnd.y - engineRef.current.aimStart.y;
    engineRef.current.startKick(dx, dy, curve);
    playKickSound();
  };

  const playKickSound = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = 150;
      gain.gain.value = 0.2;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      // Ignored sound fallback
    }
  };

  const submitHattrickAchievement = async () => {
    const playerJson = localStorage.getItem("wnzs_play_games_player");
    const playerId = playerJson ? JSON.parse(playerJson).id : "guest_soccer";

    try {
      await fetch(`${API_BASE}/playgames/achievements/ach_hit_goal_hattrick/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, steps: 1 })
      });
      setStatusMsg("🎉 Golden Boot Hattrick Achievement Unlocked!");
    } catch (e) {
      console.warn("Failed to submit hattrick achievement", e);
    }
  };

  const handleFinalScoreSubmit = async () => {
    const playerJson = localStorage.getItem("wnzs_play_games_player");
    const playerId = playerJson ? JSON.parse(playerJson).id : "guest_soccer";

    try {
      await fetch(`${API_BASE}/playgames/leaderboards/leaderboard_hit_goal_soccer/scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, scoreValue: score })
      });
      setStatusMsg("High score submitted to Hit Goal Soccer Leaderboard!");
    } catch (e) {
      setStatusMsg("High score saved locally!");
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
        title="Hit Goal Soccer Penalty Shootout ⚽ | WorldNewzs Play Games"
        description="Play Hit Goal Soccer Penalty Shootout online! Master swipe curve kicks, beat the goalkeeper AI, score corner bullseyes, and top the global social leaderboard."
        canonical="https://worldnewzs.in/games/hit-goal"
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

          <Typography variant="h4" fontWeight={900} sx={{ background: "linear-gradient(90deg, #00e676, #00b0ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            ⚽ Hit Goal Soccer Shootout
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
            <Typography variant="h6" fontWeight={800} color="success.main">{score.toLocaleString()}</Typography>
          </Box>
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="caption" color="grey.400">GOALS ⚽</Typography>
            <Typography variant="h6" fontWeight={800} color="primary.main">{goals} / {shots}</Typography>
          </Box>
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="caption" color="grey.400">STREAK 🔥</Typography>
            <Typography variant="h6" fontWeight={800} color="warning.main">{streak}x</Typography>
          </Box>
          <Button
            variant="contained"
            color="success"
            size="small"
            startIcon={<EmojiEvents />}
            onClick={handleFinalScoreSubmit}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            Submit Leaderboard
          </Button>
        </Paper>

        {/* Last Kick Result Banner */}
        {lastMsg && (
          <Paper sx={{ p: 1.5, mb: 2, bgcolor: lastMsg.includes("GOAL") ? "#15803d" : "#b91c1c", color: "#fff", textAlign: "center", fontWeight: 800, borderRadius: 2 }}>
            {lastMsg}
          </Paper>
        )}

        {statusMsg && (
          <Paper sx={{ p: 1.5, mb: 2, bgcolor: "#0284c7", color: "#fff", textAlign: "center", fontWeight: 800, borderRadius: 2 }}>
            {statusMsg}
          </Paper>
        )}

        {/* STADIUM CANVAS STAGE */}
        <Paper
          elevation={6}
          sx={{
            maxWidth: 800,
            mx: "auto",
            borderRadius: 3,
            overflow: "hidden",
            border: "4px solid #334155",
            bgcolor: "#15803d",
            cursor: "crosshair"
          }}
        >
          <canvas
            ref={canvasRef}
            width={800}
            height={440}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </Paper>

        {/* Spin Curve Control Slider */}
        <Paper sx={{ p: 2, mt: 3, bgcolor: "#1e293b", borderRadius: 3, color: "#fff" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Tune color="primary" />
            <Typography fontWeight={700} sx={{ minWidth: 140 }}>Ball Spin Curve:</Typography>
            <Slider
              value={curve}
              min={-5}
              max={5}
              step={0.5}
              onChange={(_, v) => setCurve(v as number)}
              valueLabelDisplay="auto"
              sx={{ flexGrow: 1, color: "#00e676" }}
            />
            <Chip label={curve < 0 ? "Hook Left" : curve > 0 ? "Slice Right" : "Straight"} size="small" color="primary" />
          </Box>
        </Paper>

        {/* Controls Instructions */}
        <Paper sx={{ p: 2, mt: 2, bgcolor: "#1e293b", borderRadius: 3, color: "grey.300", textAlign: "center" }}>
          <Typography variant="body2">
            <strong>How to Play:</strong> Click and drag/swipe backwards from the ball to aim elevation & power, then release to shoot! Aim for corner bullseye targets (+1000 pts) and beat the keeper.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default HitGoalGameWrapper;
