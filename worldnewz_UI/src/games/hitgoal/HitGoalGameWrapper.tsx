import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  IconButton,
  Slider,
  Card,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid
} from "@mui/material";
import {
  EmojiEvents,
  Fullscreen,
  FullscreenExit,
  VolumeUp,
  VolumeOff,
  Tune,
  Close,
  RestartAlt,
  HelpOutline,
  Timer
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
  const [currentRound, setCurrentRound] = useState(1);
  const [maxRounds] = useState(5);
  const [isSuddenDeath, setIsSuddenDeath] = useState(false);
  const [isShootoutOver, setIsShootoutOver] = useState(false);
  const [streak, setStreak] = useState(0);
  const [curve, setCurve] = useState(0);
  const [lastMsg, setLastMsg] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [rulesDialogOpen, setRulesDialogOpen] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://worldnewz.onrender.com/api";

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
          setCurrentRound(engineRef.current.currentRound);
          setIsSuddenDeath(engineRef.current.isSuddenDeath);
          setIsShootoutOver(engineRef.current.isShootoutOver);
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

  const handleTriggerWhistle = () => {
    if (engineRef.current) {
      engineRef.current.triggerWhistle();
    }
  };

  const handleReset = () => {
    if (engineRef.current) {
      engineRef.current.reset();
      setScore(0);
      setGoals(0);
      setShots(0);
      setCurrentRound(1);
      setIsSuddenDeath(false);
      setIsShootoutOver(false);
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
        description="Play official Hit Goal Soccer Shootout penalty kicks on WorldNewzs! Experience 5-kick penalty rounds, sudden death tie-breakers, goalkeeper line enforcement, corner bullseye targets, and global leaderboards."
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
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5, pr: 6 }}>
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

          {/* HUD Bar with 5-Kick Penalty Round Tracker */}
          <Paper elevation={4} sx={{ p: 1.5, mb: 1.5, bgcolor: "rgba(30, 41, 59, 0.9)", borderRadius: 3, color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
            <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap" }}>
              <Typography variant="body2" fontWeight={800} color="success.main">
                SCORE: {score}
              </Typography>
              <Typography variant="body2" fontWeight={800} color="info.main">
                ⚽ GOALS: {goals} / {shots}
              </Typography>
              <Chip
                icon={<Timer sx={{ color: "#fff !important" }} />}
                label={isSuddenDeath ? "⚡ SUDDEN DEATH" : `ROUND ${currentRound}/5`}
                size="small"
                color={isSuddenDeath ? "error" : "primary"}
                sx={{ fontWeight: 800 }}
              />
              <Typography variant="body2" fontWeight={800} color="warning.main">
                🔥 STREAK: {streak}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="contained"
                color="warning"
                size="small"
                onClick={handleTriggerWhistle}
                sx={{ borderRadius: 2, fontWeight: 700 }}
              >
                🎷 Whistle
              </Button>
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
            <Chip label={statusMsg} color="success" sx={{ mb: 1.5, fontWeight: 700, width: "fit-content", mx: "auto" }} />
          )}

          {lastMsg && (
            <Typography variant="subtitle1" fontWeight={800} color={lastMsg.includes("GOAL") ? "success.main" : lastMsg.includes("WHISTLE") ? "warning.main" : "error.main"} sx={{ textAlign: "center", mb: 1 }}>
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
              height={430}
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </Paper>

          {/* CURVE SPIN CONTROL SLIDER */}
          <Paper sx={{ p: 1.5, mt: 1.5, maxWidth: 800, mx: "auto", width: "100%", bgcolor: "rgba(30, 41, 59, 0.9)", borderRadius: 3, color: "#fff" }}>
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

      {/* HIT GOAL SOCCER SHOOTOUT QUICK-START INFOGRAPHIC RULES GUIDE MODAL */}
      <Dialog
        open={rulesDialogOpen}
        onClose={() => setRulesDialogOpen(false)}
        maxWidth="md"
        fullWidth
        sx={{ zIndex: 2500 }}
        PaperProps={{
          sx: {
            borderRadius: 4,
            background: "linear-gradient(135deg, #064e3b 0%, #0f172a 100%)",
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
              background: "linear-gradient(90deg, #10b981, #3b82f6, #f59e0b)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}
          >
            ⚽ Hit Goal – Soccer Shootout Rules & Regulations
          </Typography>
          <Typography variant="subtitle2" color="grey.300">
            Official Penalty Kick Rules & Infographic Blueprint
          </Typography>
        </DialogTitle>

        <DialogContent dividers sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
          <Grid container spacing={2.5}>
            {/* 1. Prepare Kick Block (Green) */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Paper sx={{ p: 2.5, borderRadius: 3, bgcolor: "#10b981", color: "#fff", height: "100%" }}>
                <Typography variant="h6" fontWeight={800} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  ⚽ 1. Prepare the Kick
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.95, lineHeight: 1.6 }}>
                  Place the ball on the 12-yard penalty mark. Wait for the referee’s whistle before taking your approach strike!
                </Typography>
              </Paper>
            </Grid>

            {/* 2. Take the Shot Block (Blue) */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Paper sx={{ p: 2.5, borderRadius: 3, bgcolor: "#3b82f6", color: "#fff", height: "100%" }}>
                <Typography variant="h6" fontWeight={800} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  🎯 2. Take the Shot
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.95, lineHeight: 1.6 }}>
                  Swipe/drag trajectory to strike toward goal. Adjust the <strong>Spin Curve Slider</strong> to bend the ball into top or bottom corner bullseye targets!
                </Typography>
              </Paper>
            </Grid>

            {/* 3. Goalkeeper Defense Block (Yellow) */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Paper sx={{ p: 2.5, borderRadius: 3, bgcolor: "#ca8a04", color: "#fff", height: "100%" }}>
                <Typography variant="h6" fontWeight={800} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  🧤 3. Goalkeeper Rules
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.95, lineHeight: 1.6 }}>
                  The goalkeeper must remain on the goal line until the ball is struck. Keeper can dive left or right to block the shot.
                </Typography>
              </Paper>
            </Grid>

            {/* 4. 5 Kicks & Sudden Death Block (Purple) */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Paper sx={{ p: 2.5, borderRadius: 3, bgcolor: "#9333ea", color: "#fff", height: "100%" }}>
                <Typography variant="h6" fontWeight={800} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  ⏱️ 4. 5 Kicks & Sudden Death
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.95, lineHeight: 1.6 }}>
                  Each shootout consists of <strong>5 initial penalty kicks</strong>. If scores are tied after 5 kicks, <strong>Sudden Death</strong> decides the match!
                </Typography>
              </Paper>
            </Grid>

            {/* 5. Fouls & Retakes Block (Orange) */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Paper sx={{ p: 2.5, borderRadius: 3, bgcolor: "#ea580c", color: "#fff", height: "100%" }}>
                <Typography variant="h6" fontWeight={800} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  🚨 5. Fouls & Retakes
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.95, lineHeight: 1.6 }}>
                  Encroachment or goalkeeper stepping forward off the line before the kick is struck triggers an automatic referee retake order!
                </Typography>
              </Paper>
            </Grid>

            {/* 6. Winning the Shootout Block (Red) */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Paper sx={{ p: 2.5, borderRadius: 3, bgcolor: "#dc2626", color: "#fff", height: "100%" }}>
                <Typography variant="h6" fontWeight={800} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  🏆 6. Winning the Shootout
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.95, lineHeight: 1.6 }}>
                  The team with more goals after 5 penalty kicks (or sudden death) wins the shootout and tops global Play Games leaderboards!
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ justifyContent: "center", py: 2 }}>
          <Button variant="contained" color="success" onClick={() => setRulesDialogOpen(false)} sx={{ borderRadius: 2, fontWeight: 700, px: 4 }}>
            Got It! Start Shootout ⚽
          </Button>
        </DialogActions>
      </Dialog>

      {/* Shootout Over Dialog */}
      <Dialog
        open={isShootoutOver}
        onClose={handleReset}
        maxWidth="xs"
        fullWidth
        sx={{ zIndex: 2500 }}
        PaperProps={{ sx: { maxHeight: "90vh", overflowY: "auto" } }}
      >
        <DialogTitle sx={{ textAlign: "center", fontWeight: 900, color: "success.main" }}>
          🏆 Shootout Victory!
        </DialogTitle>
        <DialogContent sx={{ textAlign: "center" }}>
          <Typography variant="body1" fontWeight={700}>
            Shootout Cleared with {goals}/{maxRounds} Goals! Total Score: {score}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 3 }}>
          <Button variant="contained" color="success" onClick={handleReset} sx={{ borderRadius: 2, fontWeight: 700 }}>
            Play New Shootout
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default HitGoalGameWrapper;
