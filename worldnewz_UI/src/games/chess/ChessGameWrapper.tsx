import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from "@mui/material";
import {
  RestartAlt,
  EmojiEvents,
  VolumeUp,
  VolumeOff,
  SmartToy,
  People,
  ArrowBack,
  Fullscreen,
  FullscreenExit
} from "@mui/icons-material";
import { ChessEngine, type Position } from "./ChessEngine";
import { SEOMeta } from "../../seo/SEOMeta";

const PIECE_UNICODE: Record<string, string> = {
  w_k: "♔", w_q: "♕", w_r: "♖", w_b: "♗", w_n: "♘", w_p: "♙",
  b_k: "♚", b_q: "♛", b_r: "♜", b_b: "♝", b_n: "♞", b_p: "♟"
};

const ChessGameWrapper: React.FC = () => {
  const [engine] = useState<ChessEngine>(() => new ChessEngine());
  const [board, setBoard] = useState(engine.board);
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [gameMode, setGameMode] = useState<"ai" | "pvp">("ai");
  const [aiDifficulty, setAiDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [whiteTimer, setWhiteTimer] = useState(600); // 10 minutes
  const [blackTimer, setBlackTimer] = useState(600);
  const [timerActive, setTimerActive] = useState(false);
  const [gameOverDialog, setGameOverDialog] = useState(false);
  const [winnerMessage, setWinnerMessage] = useState("");
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

  // Clock timer countdown
  useEffect(() => {
    let interval: any;
    if (timerActive && !engine.isCheckmate) {
      interval = setInterval(() => {
        if (engine.turn === "w") {
          setWhiteTimer((prev) => {
            if (prev <= 1) {
              endGame("Black wins on time!");
              return 0;
            }
            return prev - 1;
          });
        } else {
          setBlackTimer((prev) => {
            if (prev <= 1) {
              endGame("White wins on time!");
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, engine.turn, engine.isCheckmate]);

  const handleSquareClick = (row: number, col: number) => {
    if (engine.isCheckmate) return;

    if (!timerActive) setTimerActive(true);

    if (selectedPos) {
      // Check if clicked square is a valid target
      const isTarget = validMoves.some((m) => m.row === row && m.col === col);
      if (isTarget) {
        executeMove(selectedPos, { row, col });
        setSelectedPos(null);
        setValidMoves([]);
        return;
      }
    }

    // Select piece
    const piece = engine.board[row][col];
    if (piece && piece.color === engine.turn) {
      setSelectedPos({ row, col });
      setValidMoves(engine.getValidMoves({ row, col }));
    } else {
      setSelectedPos(null);
      setValidMoves([]);
    }
  };

  const executeMove = (from: Position, to: Position) => {
    const moved = engine.makeMove(from, to);
    if (moved) {
      setBoard([...engine.board.map((r) => [...r])]);
      playSound();

      if (engine.isCheckmate) {
        const winner = engine.turn === "w" ? "Black" : "White";
        endGame(`Checkmate! ${winner} wins the match!`);
        submitScoreToLeaderboard(1500);
      } else if (gameMode === "ai" && engine.turn === "b") {
        // Trigger AI response move
        setTimeout(() => {
          const aiMove = engine.getAIMove(aiDifficulty);
          if (aiMove) {
            engine.makeMove(aiMove.from, aiMove.to);
            setBoard([...engine.board.map((r) => [...r])]);
            playSound();
            if (engine.isCheckmate) {
              endGame("Checkmate! Black AI wins!");
            }
          }
        }, 500);
      }
    }
  };

  const playSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.value = 440;
      gain.gain.value = 0.1;
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    } catch (e) {
      // Ignored audio fallback
    }
  };

  const endGame = (msg: string) => {
    setTimerActive(false);
    setWinnerMessage(msg);
    setGameOverDialog(true);
  };

  const handleReset = () => {
    engine.resetGame();
    setBoard([...engine.board.map((r) => [...r])]);
    setSelectedPos(null);
    setValidMoves([]);
    setWhiteTimer(600);
    setBlackTimer(600);
    setTimerActive(false);
    setGameOverDialog(false);
    setScoreSubmitted(false);
  };

  const submitScoreToLeaderboard = async (score: number) => {
    const playerJson = localStorage.getItem("wnzs_play_games_player");
    const playerId = playerJson ? JSON.parse(playerJson).id : "guest_chess";

    try {
      await fetch(`${API_BASE}/playgames/leaderboards/leaderboard_chess_grandmaster/scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, scoreValue: score })
      });
      await fetch(`${API_BASE}/playgames/achievements/ach_chess_checkmate/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, steps: 1 })
      });
      setScoreSubmitted(true);
    } catch (e) {
      console.warn("Failed to post chess score to backend", e);
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

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#0f172a", color: "#fff", py: 4 }} ref={containerRef}>
      <SEOMeta
        title="Grandmaster Chess ♟️ | WorldNewzs Play Games"
        description="Play Grandmaster Chess online against Stockfish AI or 2-player mode. Features real-time move validation, timers, global leaderboards, and achievements."
        canonical="https://worldnewzs.in/games/chess"
      />

      <Container maxWidth="md">
        {/* Header Bar */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Button
            href="/play-games"
            startIcon={<ArrowBack />}
            sx={{ color: "#fff", fontWeight: 700 }}
          >
            Play Games Hub
          </Button>

          <Typography variant="h4" fontWeight={900} sx={{ background: "linear-gradient(90deg, #ffd700, #ff8f00)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            ♟️ Grandmaster Chess
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

        {/* Top Player Info (Black) */}
        <Paper elevation={4} sx={{ p: 2, mb: 2, bgcolor: "#1e293b", borderRadius: 3, color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar src="https://img.icons8.com/color/96/chess-king.png" sx={{ width: 44, height: 44 }} />
            <Box>
              <Typography fontWeight={700}>
                {gameMode === "ai" ? `Stockfish AI (${aiDifficulty.toUpperCase()})` : "Player 2 (Black)"}
              </Typography>
              <Typography variant="caption" color="grey.400">
                Captured: {engine.capturedBlack.map((p) => PIECE_UNICODE[`b_${p.type}`]).join(" ")}
              </Typography>
            </Box>
          </Box>
          <Chip
            label={formatTime(blackTimer)}
            color={engine.turn === "b" ? "warning" : "default"}
            sx={{ fontWeight: 800, fontSize: "1rem", px: 1 }}
          />
        </Paper>

        {/* Mode & Difficulty Controls */}
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, flexWrap: "wrap", gap: 1 }}>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant={gameMode === "ai" ? "contained" : "outlined"}
              size="small"
              startIcon={<SmartToy />}
              onClick={() => { setGameMode("ai"); handleReset(); }}
              sx={{ borderRadius: 2, fontWeight: 700 }}
            >
              Vs AI
            </Button>
            <Button
              variant={gameMode === "pvp" ? "contained" : "outlined"}
              size="small"
              startIcon={<People />}
              onClick={() => { setGameMode("pvp"); handleReset(); }}
              sx={{ borderRadius: 2, fontWeight: 700 }}
            >
              2-Player Pass & Play
            </Button>
          </Box>

          {gameMode === "ai" && (
            <Box sx={{ display: "flex", gap: 1 }}>
              {(["easy", "medium", "hard"] as const).map((d) => (
                <Chip
                  key={d}
                  label={d.toUpperCase()}
                  onClick={() => setAiDifficulty(d)}
                  color={aiDifficulty === d ? "primary" : "default"}
                  sx={{ cursor: "pointer", fontWeight: 700 }}
                />
              ))}
            </Box>
          )}

          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<RestartAlt />}
            onClick={handleReset}
            sx={{ borderRadius: 2 }}
          >
            New Game
          </Button>
        </Box>

        {/* Check Indicator */}
        {engine.isCheck && (
          <Paper sx={{ p: 1.5, mb: 2, bgcolor: "#dc2626", color: "#fff", textAlign: "center", fontWeight: 800, borderRadius: 2 }}>
            ⚠️ CHECK! {engine.turn === "w" ? "White" : "Black"} King is under attack!
          </Paper>
        )}

        {/* CHESSBOARD CANVAS GRID */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(8, 1fr)",
            aspectRatio: "1",
            maxWidth: 560,
            mx: "auto",
            borderRadius: 3,
            overflow: "hidden",
            boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
            border: "4px solid #334155"
          }}
        >
          {board.map((row, r) =>
            row.map((piece, c) => {
              const isDarkSquare = (r + c) % 2 === 1;
              const isSelected = selectedPos?.row === r && selectedPos?.col === c;
              const isValidTarget = validMoves.some((m) => m.row === r && m.col === c);

              return (
                <Box
                  key={`${r}-${c}`}
                  onClick={() => handleSquareClick(r, c)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: isSelected
                      ? "#f59e0b"
                      : isValidTarget
                      ? isDarkSquare ? "#15803d" : "#4ade80"
                      : isDarkSquare ? "#769656" : "#eeeed2",
                    cursor: "pointer",
                    fontSize: { xs: "2rem", sm: "2.8rem" },
                    userSelect: "none",
                    position: "relative",
                    transition: "all 0.15s ease",
                    "&:hover": { opacity: 0.9 }
                  }}
                >
                  {piece && (
                    <Typography
                      sx={{
                        fontSize: "inherit",
                        color: piece.color === "w" ? "#ffffff" : "#111827",
                        textShadow: piece.color === "w" ? "0 2px 4px rgba(0,0,0,0.8)" : "none"
                      }}
                    >
                      {PIECE_UNICODE[`${piece.color}_${piece.type}`]}
                    </Typography>
                  )}
                  {isValidTarget && !piece && (
                    <Box sx={{ width: 14, height: 14, borderRadius: "50%", bgcolor: "rgba(0,0,0,0.3)" }} />
                  )}
                </Box>
              );
            })
          )}
        </Box>

        {/* Bottom Player Info (White) */}
        <Paper elevation={4} sx={{ p: 2, mt: 2, bgcolor: "#1e293b", borderRadius: 3, color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80" sx={{ width: 44, height: 44 }} />
            <Box>
              <Typography fontWeight={700}>Player 1 (White)</Typography>
              <Typography variant="caption" color="grey.400">
                Captured: {engine.capturedWhite.map((p) => PIECE_UNICODE[`w_${p.type}`]).join(" ")}
              </Typography>
            </Box>
          </Box>
          <Chip
            label={formatTime(whiteTimer)}
            color={engine.turn === "w" ? "warning" : "default"}
            sx={{ fontWeight: 800, fontSize: "1rem", px: 1 }}
          />
        </Paper>

        {/* Move Log */}
        <Paper sx={{ p: 2, mt: 3, bgcolor: "#1e293b", borderRadius: 3, color: "#fff" }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
            📜 Move History
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", maxHeight: 90, overflowY: "auto" }}>
            {engine.moveHistory.length === 0 ? (
              <Typography variant="caption" color="grey.500">No moves made yet.</Typography>
            ) : (
              engine.moveHistory.map((m, idx) => (
                <Chip
                  key={idx}
                  label={`${Math.floor(idx / 2) + 1}. ${m.san}`}
                  size="small"
                  sx={{ bgcolor: idx % 2 === 0 ? "#334155" : "#475569", color: "#fff" }}
                />
              ))
            )}
          </Box>
        </Paper>
      </Container>

      {/* Game Over Dialog */}
      <Dialog open={gameOverDialog} onClose={() => setGameOverDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: "center", fontWeight: 900, fontSize: "1.5rem" }}>
          🎉 Match Concluded!
        </DialogTitle>
        <DialogContent sx={{ textAlign: "center" }}>
          <Typography variant="h6" color="primary" fontWeight={800} sx={{ mb: 2 }}>
            {winnerMessage}
          </Typography>
          {scoreSubmitted && (
            <Chip icon={<EmojiEvents />} label="Score & Achievement Saved to Play Games!" color="success" sx={{ fontWeight: 700 }} />
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 3 }}>
          <Button variant="contained" onClick={handleReset} sx={{ borderRadius: 2, fontWeight: 700 }}>
            Play Again
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChessGameWrapper;
