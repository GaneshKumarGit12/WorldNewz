import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  IconButton,
  Slider,
  Card
} from "@mui/material";
import {
  EmojiEvents,
  Fullscreen,
  FullscreenExit,
  VolumeUp,
  VolumeOff,
  Tune,
  Close,
  RestartAlt
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { HitGoalSoccerEngine } from "./HitGoalScene";
import { SEOMeta } from "../../seo/SEOMeta";

const HitGoalGameWrapper: React.FC = () => {
  const navigate = useNavigate();
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
          setLastMsg(engineRef.current.lastResult);
        }
      }, 100);

      return () => {
        clearInterval(syncInterval);
        engine.stop();
      };
    }
  }, []);

  const handleCurveChange = (_: Event, value: number | number[]) => {
    const val = value as number;
    setCurve(val);
    if (engineRef.current) {
      engineRef.current.setCurve(val);
    }
  };

  const handleReset = () => {
    if (engineRef.current) {
      engineRef.current.reset();
      setScore(0);
      setGoals(0);
      setShots(0);
      setStreak(0);
      setLastMsg("");
    }
  };

  const submitScoreToLeaderboard = async () => {
    const playerJson = localStorage.getItem("wnzs_play_games_player");
    const playerId = playerJson ? JSON.parse(playerJson).id : "guest_hitgoal";

    try {
      await fetch(`${API_BASE}/playgames/leaderboards/leaderboard_hit_goal_soccer/scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, scoreValue: score })
      });
      if (streak >= 3) {
        await fetch(`${API_BASE}/playgames/achievements/ach_hit_goal_hattrick/progress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerId, steps: 1 })
        });
      }
      setStatusMsg("High Score Submitted to Play Games Leaderboards!");
    } catch (e) {
      setStatusMsg("Score Saved Locally!");
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
        title="Hit Goal Soccer Shootout ⚽ | WorldNewzs Play Games"
        description="Play Hit Goal Soccer Shootout on WorldNewzs! Drag aiming line, spin curve slider, beat goalkeeper AI, hit corner bullseye targets, and climb global leaderboards."
        canonical="https://worldnewzs.in/games/hit-goal"
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
            border: { xs: "none", sm: "2px solid #10b981" },
            borderRadius: { xs: 0, sm: "24px" },
            boxShadow: { xs: "none", sm: "0 0 45px rgba(16, 185, 129, 0.4)" },
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
                background: "linear-gradient(90deg, #10b981, #3b82f6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontSize: { xs: "1.2rem", sm: "1.6rem" }
              }}
            >
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

          {/* HUD Bar */}
          <Paper elevation={4} sx={{ p: 1.5, mb: 2, bgcolor: "rgba(30, 41, 59, 0.9)", borderRadius: 3, color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <Typography variant="body2" fontWeight={800} color="success.main">
                SCORE: {score}
              </Typography>
              <Typography variant="body2" fontWeight={800} color="info.main">
                ⚽ GOALS: {goals} / {shots}
              </Typography>
              <Typography variant="body2" fontWeight={800} color="warning.main">
                🔥 STREAK: {streak}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="outlined"
                color="success"
                size="small"
                startIcon={<EmojiEvents />}
                onClick={submitScoreToLeaderboard}
                sx={{ borderRadius: 2, fontWeight: 700 }}
              >
                Submit Score
              </Button>
              <Button
                variant="contained"
                color="info"
                size="small"
                startIcon={<RestartAlt />}
                onClick={handleReset}
                sx={{ borderRadius: 2, fontWeight: 700 }}
              >
                Reset
              </Button>
            </Box>
          </Paper>

          {statusMsg && (
            <Chip label={statusMsg} color="success" sx={{ mb: 2, fontWeight: 700, width: "fit-content", mx: "auto" }} />
          )}

          {lastMsg && (
            <Typography variant="h6" fontWeight={800} color={lastMsg.includes("GOAL") ? "success.main" : "error.main"} sx={{ textAlign: "center", mb: 1 }}>
              {lastMsg}
            </Typography>
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
              height={450}
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </Paper>

          {/* CURVE SPIN CONTROL SLIDER */}
          <Paper sx={{ p: 2, mt: 2, maxWidth: 800, mx: "auto", width: "100%", bgcolor: "rgba(30, 41, 59, 0.9)", borderRadius: 3, color: "#fff" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Tune color="success" />
              <Typography fontWeight={700} variant="body2">Ball Spin Curve (Left / Right):</Typography>
              <Slider
                value={curve}
                onChange={handleCurveChange}
                min={-3}
                max={3}
                step={0.5}
                valueLabelDisplay="auto"
                color="success"
                sx={{ flexGrow: 1 }}
              />
            </Box>
          </Paper>
        </Card>
      </Box>
    </>
  );
};

export default HitGoalGameWrapper;
