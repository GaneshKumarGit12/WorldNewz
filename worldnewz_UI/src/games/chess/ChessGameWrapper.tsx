import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card
} from "@mui/material";
import {
  RestartAlt,
  EmojiEvents,
  VolumeUp,
  VolumeOff,
  SmartToy,
  People,
  Close,
  Fullscreen,
  FullscreenExit,
  Flag,
  Handshake,
  Timer
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { ChessEngine, type Position, type PieceType } from "./ChessEngine";
import { SEOMeta } from "../../seo/SEOMeta";

const PIECE_UNICODE: Record<string, string> = {
  w_k: "♔", w_q: "♕", w_r: "♖", w_b: "♗", w_n: "♘", w_p: "♙",
  b_k: "♚", b_q: "♛", b_r: "♜", b_b: "♝", b_n: "♞", b_p: "♟"
};

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

const FIDE_TIME_CONTROLS = [
  { label: "3m Bullet ⚡", seconds: 180 },
  { label: "5m Blitz ⏱️", seconds: 300 },
  { label: "15m Rapid 🏃", seconds: 900 },
  { label: "30m Classical ♟️", seconds: 1800 }
];

const ChessGameWrapper: React.FC = () => {
  const navigate = useNavigate();
  const [engine] = useState<ChessEngine>(() => new ChessEngine());
  const [board, setBoard] = useState(engine.board);
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [gameMode, setGameMode] = useState<"ai" | "pvp">("ai");
  const [aiDifficulty, setAiDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedTimeControl, setSelectedTimeControl] = useState(600); // 10 min
  const [whiteTimer, setWhiteTimer] = useState(600);
  const [blackTimer, setBlackTimer] = useState(600);
  const [timerActive, setTimerActive] = useState(false);

  // Dialog States
  const [gameOverDialog, setGameOverDialog] = useState(false);
  const [winnerMessage, setWinnerMessage] = useState("");
  const [promotionDialogOpen, setPromotionDialogOpen] = useState(false);
  const [pendingPromotionFromTo, setPendingPromotionFromTo] = useState<{ from: Position; to: Position } | null>(null);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://worldnewz.onrender.com/api";

  // FIDE Clock Timer Countdown Loop
  useEffect(() => {
    let interval: any;
    if (timerActive && !engine.isCheckmate && !engine.isDraw) {
      interval = setInterval(() => {
        if (engine.turn === "w") {
          setWhiteTimer((prev) => {
            if (prev <= 1) {
              endGame("Black wins on time! (FIDE Time Expiry)");
              return 0;
            }
            return prev - 1;
          });
        } else {
          setBlackTimer((prev) => {
            if (prev <= 1) {
              endGame("White wins on time! (FIDE Time Expiry)");
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, engine.turn, engine.isCheckmate, engine.isDraw]);

  const handleSquareClick = (row: number, col: number) => {
    if (engine.isCheckmate || engine.isDraw) return;

    if (!timerActive) setTimerActive(true);

    if (selectedPos) {
      // Check if target square is valid
      const isTarget = validMoves.some((m) => m.row === row && m.col === col);
      if (isTarget) {
        attemptMove(selectedPos, { row, col });
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

  const attemptMove = (from: Position, to: Position, promotionChoice?: PieceType) => {
    const piece = engine.board[from.row][from.col];
    if (piece && piece.type === "p" && (to.row === 0 || to.row === 7) && !promotionChoice) {
      setPendingPromotionFromTo({ from, to });
      setPromotionDialogOpen(true);
      return;
    }

    const moved = engine.makeMove(from, to, promotionChoice);
    if (moved) {
      setBoard([...engine.board.map((r) => [...r])]);
      playSound();

      if (engine.isCheckmate) {
        const winner = engine.turn === "w" ? "Black" : "White";
        endGame(`Checkmate! ${winner} wins the match! (FIDE Law 5.1)`);
        submitScoreToLeaderboard(1500);
      } else if (engine.isDraw) {
        endGame(engine.drawReason);
      } else if (gameMode === "ai" && engine.turn === "b") {
        setTimeout(() => {
          const aiMove = engine.getAIMove(aiDifficulty);
          if (aiMove) {
            engine.makeMove(aiMove.from, aiMove.to, aiMove.promo);
            setBoard([...engine.board.map((r) => [...r])]);
            playSound();

            if (engine.isCheckmate) {
              endGame("Checkmate! Black Stockfish AI wins!");
            } else if (engine.isDraw) {
              endGame(engine.drawReason);
            }
          }
        }, 400);
      }
    }
  };

  const handlePromotionSelect = (choice: PieceType) => {
    if (pendingPromotionFromTo) {
      attemptMove(pendingPromotionFromTo.from, pendingPromotionFromTo.to, choice);
    }
    setPromotionDialogOpen(false);
    setPendingPromotionFromTo(null);
  };

  const handleResign = () => {
    const winner = engine.turn === "w" ? "Black" : "White";
    endGame(`${winner} wins by Resignation (FIDE Law 5.2)`);
  };

  const handleOfferDraw = () => {
    endGame("Match drawn by Mutual Agreement (FIDE Law 9.1)");
  };

  const playSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.value = engine.isCheck ? 600 : 440;
      gain.gain.value = 0.1;
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch (e) {
      // Audio fallback
    }
  };

  const endGame = (msg: string) => {
    setTimerActive(false);
    setWinnerMessage(msg);
    setGameOverDialog(true);
  };

  const handleReset = (timeSecs: number = selectedTimeControl) => {
    engine.resetGame();
    setBoard([...engine.board.map((r) => [...r])]);
    setSelectedPos(null);
    setValidMoves([]);
    setWhiteTimer(timeSecs);
    setBlackTimer(timeSecs);
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
      console.warn("Failed to post chess score", e);
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
    <>
      <SEOMeta
        title="FIDE Grandmaster Chess ♟️ | WorldNewzs Play Games"
        description="Official FIDE rated rules Grandmaster Chess on WorldNewzs! Play against Stockfish AI or 2-player mode with legal moves, castling, en passant, promotion, FIDE timers, and global leaderboards."
        canonical="https://worldnewzs.in/games/chess"
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
            border: { xs: "none", sm: "2px solid #a855f7" },
            borderRadius: { xs: 0, sm: "24px" },
            boxShadow: { xs: "none", sm: "0 0 45px rgba(168, 85, 247, 0.4)" },
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
                background: "linear-gradient(90deg, #ffd700, #ff8f00)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontSize: { xs: "1.2rem", sm: "1.6rem" }
              }}
            >
              ♟️ FIDE Grandmaster Chess
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

          {/* FIDE Time Controls Selector Bar */}
          <Paper elevation={4} sx={{ p: 1.5, mb: 2, bgcolor: "rgba(30, 41, 59, 0.9)", borderRadius: 3, color: "#fff" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Timer color="warning" />
                <Typography fontWeight={700} variant="caption">FIDE Time:</Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 0.8, flexWrap: "wrap" }}>
                {FIDE_TIME_CONTROLS.map((tc) => (
                  <Chip
                    key={tc.seconds}
                    label={tc.label}
                    onClick={() => {
                      setSelectedTimeControl(tc.seconds);
                      handleReset(tc.seconds);
                    }}
                    color={selectedTimeControl === tc.seconds ? "primary" : "default"}
                    size="small"
                    sx={{ cursor: "pointer", fontWeight: 700 }}
                  />
                ))}
              </Box>
            </Box>
          </Paper>

          {/* Black Player Info Bar */}
          <Paper elevation={4} sx={{ p: 1.5, mb: 1.5, bgcolor: "rgba(30, 41, 59, 0.9)", borderRadius: 3, color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Avatar src="https://img.icons8.com/color/96/chess-king.png" sx={{ width: 36, height: 36 }} />
              <Box>
                <Typography fontWeight={700} variant="body2">
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
              sx={{ fontWeight: 800, fontSize: "1rem" }}
            />
          </Paper>

          {/* Mode Controls Bar */}
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.5, flexWrap: "wrap", gap: 1 }}>
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
                2P Pass & Play
              </Button>
            </Box>

            {gameMode === "ai" && (
              <Box sx={{ display: "flex", gap: 0.5 }}>
                {(["easy", "medium", "hard"] as const).map((d) => (
                  <Chip
                    key={d}
                    label={d.toUpperCase()}
                    onClick={() => setAiDifficulty(d)}
                    color={aiDifficulty === d ? "primary" : "default"}
                    size="small"
                    sx={{ cursor: "pointer", fontWeight: 700 }}
                  />
                ))}
              </Box>
            )}

            <Box sx={{ display: "flex", gap: 0.5 }}>
              <Button variant="outlined" color="warning" size="small" startIcon={<Handshake />} onClick={handleOfferDraw}>
                Draw
              </Button>
              <Button variant="outlined" color="error" size="small" startIcon={<Flag />} onClick={handleResign}>
                Resign
              </Button>
              <Button variant="outlined" color="info" size="small" startIcon={<RestartAlt />} onClick={() => handleReset()}>
                Reset
              </Button>
            </Box>
          </Box>

          {/* Check Alert Banner */}
          {engine.isCheck && (
            <Paper sx={{ p: 1, mb: 1.5, bgcolor: "#dc2626", color: "#fff", textAlign: "center", fontWeight: 800, borderRadius: 2 }}>
              ⚠️ CHECK! {engine.turn === "w" ? "White" : "Black"} King is under attack!
            </Paper>
          )}

          {/* FIDE CHESSBOARD CONTAINER WITH LOCKED RIGID SQUARES */}
          <Paper
            elevation={8}
            sx={{
              maxWidth: 540,
              width: "fit-content",
              mx: "auto",
              borderRadius: 3,
              p: 1.5,
              bgcolor: "#0f172a",
              border: "3px solid #334155",
              boxShadow: "0 12px 48px rgba(0,0,0,0.8)"
            }}
          >
            {/* Top File Labels (a-h) */}
            <Box sx={{ display: "grid", gridTemplateColumns: "20px repeat(8, min(10vw, 52px)) 20px", textAlign: "center", mb: 0.5, color: "grey.400", fontWeight: 700, fontSize: "0.8rem" }}>
              <span />
              {FILES.map((f) => <span key={f}>{f}</span>)}
              <span />
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              {/* Left Rank Labels (8-1) */}
              <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "space-around", height: "100%", width: 20, textAlign: "center", color: "grey.400", fontWeight: 700, fontSize: "0.8rem" }}>
                {RANKS.map((r) => <span key={r}>{r}</span>)}
              </Box>

              {/* 8x8 RIGID CHESSBOARD GRID (STRICT FIXED DIMENSIONS) */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(8, min(10vw, 52px))",
                  gridTemplateRows: "repeat(8, min(10vw, 52px))",
                  width: "fit-content",
                  height: "fit-content",
                  borderRadius: 1.5,
                  overflow: "hidden",
                  border: "2px solid #475569"
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
                          width: "100%",
                          height: "100%",
                          boxSizing: "border-box",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: isSelected
                            ? "#f59e0b"
                            : isValidTarget
                            ? isDarkSquare ? "#15803d" : "#4ade80"
                            : isDarkSquare ? "#769656" : "#eeeed2",
                          cursor: "pointer",
                          userSelect: "none",
                          position: "relative",
                          overflow: "hidden"
                        }}
                      >
                        {piece && (
                          <Typography
                            component="span"
                            sx={{
                              fontSize: "min(6.5vw, 2.3rem)",
                              lineHeight: 1,
                              display: "block",
                              textAlign: "center",
                              color: piece.color === "w" ? "#ffffff" : "#111827",
                              textShadow: piece.color === "w" ? "0 2px 4px rgba(0,0,0,0.85)" : "none",
                              pointerEvents: "none"
                            }}
                          >
                            {PIECE_UNICODE[`${piece.color}_${piece.type}`]}
                          </Typography>
                        )}
                        {isValidTarget && !piece && (
                          <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "rgba(0,0,0,0.35)", pointerEvents: "none" }} />
                        )}
                      </Box>
                    );
                  })
                )}
              </Box>

              {/* Right Rank Labels (8-1) */}
              <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "space-around", height: "100%", width: 20, textAlign: "center", color: "grey.400", fontWeight: 700, fontSize: "0.8rem" }}>
                {RANKS.map((r) => <span key={r}>{r}</span>)}
              </Box>
            </Box>

            {/* Bottom File Labels (a-h) */}
            <Box sx={{ display: "grid", gridTemplateColumns: "20px repeat(8, min(10vw, 52px)) 20px", textAlign: "center", mt: 0.5, color: "grey.400", fontWeight: 700, fontSize: "0.8rem" }}>
              <span />
              {FILES.map((f) => <span key={f}>{f}</span>)}
              <span />
            </Box>
          </Paper>

          {/* White Player Info Bar */}
          <Paper elevation={4} sx={{ p: 1.5, mt: 1.5, bgcolor: "rgba(30, 41, 59, 0.9)", borderRadius: 3, color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Avatar src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80" sx={{ width: 36, height: 36 }} />
              <Box>
                <Typography fontWeight={700} variant="body2">Player 1 (White)</Typography>
                <Typography variant="caption" color="grey.400">
                  Captured: {engine.capturedWhite.map((p) => PIECE_UNICODE[`w_${p.type}`]).join(" ")}
                </Typography>
              </Box>
            </Box>
            <Chip
              label={formatTime(whiteTimer)}
              color={engine.turn === "w" ? "warning" : "default"}
              sx={{ fontWeight: 800, fontSize: "1rem" }}
            />
          </Paper>

          {/* FIDE Move History */}
          <Paper sx={{ p: 1.5, mt: 1.5, bgcolor: "rgba(30, 41, 59, 0.9)", borderRadius: 3, color: "#fff" }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
              📜 FIDE Move Notation
            </Typography>
            <Box sx={{ display: "flex", gap: 0.8, flexWrap: "wrap", maxHeight: 70, overflowY: "auto" }}>
              {engine.moveHistory.length === 0 ? (
                <Typography variant="caption" color="grey.500">No moves made yet.</Typography>
              ) : (
                engine.moveHistory.map((m, idx) => (
                  <Chip
                    key={idx}
                    label={`${Math.floor(idx / 2) + 1}. ${m.san}`}
                    size="small"
                    sx={{ bgcolor: idx % 2 === 0 ? "#334155" : "#475569", color: "#fff", fontWeight: 600 }}
                  />
                ))
              )}
            </Box>
          </Paper>
        </Card>
      </Box>

      {/* FIDE Pawn Promotion Choice Dialog */}
      <Dialog
        open={promotionDialogOpen}
        onClose={() => setPromotionDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        sx={{ zIndex: 2500 }}
        PaperProps={{ sx: { maxHeight: "90vh", overflowY: "auto" } }}
      >
        <DialogTitle sx={{ textAlign: "center", fontWeight: 800 }}>
          ♕ FIDE Pawn Promotion
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", mb: 2 }}>
            Select a piece to promote your pawn:
          </Typography>
          <Grid container spacing={2}>
            {(['q', 'r', 'b', 'n'] as PieceType[]).map((type) => (
              <Grid size={{ xs: 3 }} key={type}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => handlePromotionSelect(type)}
                  sx={{ fontSize: "2.2rem", py: 1, borderRadius: 2 }}
                >
                  {PIECE_UNICODE[`${engine.turn}_${type}`]}
                </Button>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
      </Dialog>

      {/* Game Over / Concluded Dialog */}
      <Dialog
        open={gameOverDialog}
        onClose={() => setGameOverDialog(false)}
        maxWidth="xs"
        fullWidth
        sx={{ zIndex: 2500 }}
        PaperProps={{ sx: { maxHeight: "90vh", overflowY: "auto" } }}
      >
        <DialogTitle sx={{ textAlign: "center", fontWeight: 900, fontSize: "1.5rem" }}>
          🏆 Match Concluded
        </DialogTitle>
        <DialogContent sx={{ textAlign: "center" }}>
          <Typography variant="h6" color="primary" fontWeight={800} sx={{ mb: 2 }}>
            {winnerMessage}
          </Typography>
          {scoreSubmitted && (
            <Chip icon={<EmojiEvents />} label="Score Saved to Play Games Leaderboards!" color="success" sx={{ fontWeight: 700 }} />
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 3 }}>
          <Button variant="contained" onClick={() => handleReset()} sx={{ borderRadius: 2, fontWeight: 700 }}>
            Play New Match
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ChessGameWrapper;
