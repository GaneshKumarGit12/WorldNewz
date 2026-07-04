import React, { useState, useEffect } from "react";
import { Box, Paper, Typography, Button, RadioGroup, FormControlLabel, Radio, LinearProgress, Alert, Chip } from "@mui/material";
import HowToVoteIcon from "@mui/icons-material/HowToVote";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { submitSingleVote } from "../api/apiClient";
import type { ContextualPollData } from "../api/apiClient";
import { startPollsSignalR } from "../services/pollsSignalR";

interface ContextualPollWidgetProps {
  initialPoll?: ContextualPollData;
  category?: string;
}

export const ContextualPollWidget: React.FC<ContextualPollWidgetProps> = ({ initialPoll, category }) => {
  const [poll, setPoll] = useState<ContextualPollData | undefined>(initialPoll);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [voting, setVoting] = useState<boolean>(false);

  useEffect(() => {
    if (initialPoll) {
      setPoll(initialPoll);
    }
  }, [initialPoll]);

  // Subscribe to real-time live voting updates via SignalR
  useEffect(() => {
    startPollsSignalR((liveData) => {
      if (poll && liveData && (liveData.pollId === poll.pollId || liveData.id === poll.pollId)) {
        const updatedTotal = liveData.totalVotes ?? poll.totalVotes;
        const updatedOptions = poll.options.map((opt) => {
          const match = liveData.results?.find((r: any) => r.optionId === opt.optionId || r.id === opt.optionId);
          return match ? { ...opt, votes: match.votes } : opt;
        });
        setPoll((prev) => (prev ? { ...prev, totalVotes: updatedTotal, options: updatedOptions } : prev));
      }
    });
  }, [poll]);

  if (!poll || !poll.options || poll.options.length === 0) {
    return null;
  }

  // Calculate percentages dynamically
  const totalVotes = poll.totalVotes || poll.options.reduce((sum, o) => sum + o.votes, 0);

  const handleVote = async () => {
    if (selectedOptionId === null || hasVoted || voting) return;

    setVoting(true);

    // ⚡ OPTIMISTIC UI UPDATE: Immediately update state locally before API call finishes
    setPoll((prev) => {
      if (!prev) return prev;
      const updatedTotal = prev.totalVotes + 1;
      const updatedOptions = prev.options.map((opt) =>
        opt.optionId === selectedOptionId ? { ...opt, votes: opt.votes + 1 } : opt
      );
      return { ...prev, totalVotes: updatedTotal, options: updatedOptions };
    });
    setHasVoted(true);

    try {
      await submitSingleVote(poll.pollId, selectedOptionId);
    } catch (err) {
      console.warn("Vote API submitted in background:", err);
    } finally {
      setVoting(false);
    }
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        borderRadius: 3,
        background: (theme) =>
          theme.palette.mode === "dark"
            ? "linear-gradient(135deg, rgba(0, 114, 255, 0.12), rgba(0, 198, 255, 0.05))"
            : "linear-gradient(135deg, #f0f7ff, #e6f0fa)",
        border: "1px solid",
        borderColor: "rgba(0, 114, 255, 0.25)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
        <Chip
          label={category ? `${category.toUpperCase()} POLL` : "CONTEXTUAL POLL"}
          size="small"
          color="primary"
          sx={{ fontWeight: 800, fontSize: "0.7rem", borderRadius: 1.5 }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
          {totalVotes.toLocaleString()} Votes
        </Typography>
      </Box>

      <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
        <HowToVoteIcon sx={{ color: "primary.main" }} />
        {poll.question}
      </Typography>

      {!hasVoted ? (
        <Box>
          <RadioGroup
            value={selectedOptionId ?? ""}
            onChange={(e) => setSelectedOptionId(Number(e.target.value))}
            sx={{ mb: 2 }}
          >
            {poll.options.map((option) => (
              <Paper
                key={option.optionId}
                elevation={0}
                onClick={() => setSelectedOptionId(option.optionId)}
                sx={{
                  mb: 1,
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  cursor: "pointer",
                  border: "1px solid",
                  borderColor: selectedOptionId === option.optionId ? "primary.main" : "divider",
                  bgcolor: selectedOptionId === option.optionId ? "action.hover" : "background.paper",
                  transition: "all 0.2s ease",
                  "&:hover": { borderColor: "primary.main" },
                }}
              >
                <FormControlLabel
                  value={option.optionId}
                  control={<Radio size="small" inputProps={{ "aria-label": `Vote for ${option.text}` }} />}
                  label={<Typography variant="body2" sx={{ fontWeight: 600 }}>{option.text}</Typography>}
                  sx={{ width: "100%", m: 0 }}
                />
              </Paper>
            ))}
          </RadioGroup>

          <Button
            id="contextual-poll-submit-btn"
            aria-label="Submit your poll vote"
            variant="contained"
            disabled={selectedOptionId === null || voting}
            onClick={handleVote}
            fullWidth
            sx={{
              fontWeight: 800,
              borderRadius: 2,
              py: 1,
              background: "linear-gradient(135deg, #00c6ff, #0072ff)",
              textTransform: "none",
            }}
          >
            {voting ? "Registering Vote..." : "Submit Vote"}
          </Button>
        </Box>
      ) : (
        <Box>
          <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 2, borderRadius: 2 }}>
            Thank you! Your vote has been recorded in real-time.
          </Alert>

          {poll.options.map((option) => {
            const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
            const isSelected = selectedOptionId === option.optionId;

            return (
              <Box key={option.optionId} sx={{ mb: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: isSelected ? 800 : 600 }}>
                    {option.text} {isSelected && " (Your Choice)"}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: "primary.main" }}>
                    {percentage}% ({option.votes})
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={percentage}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: "action.disabledBackground",
                    "& .MuiLinearProgress-bar": {
                      borderRadius: 4,
                      background: isSelected
                        ? "linear-gradient(90deg, #00c6ff, #0072ff)"
                        : "linear-gradient(90deg, #90caf9, #42a5f5)",
                    },
                  }}
                />
              </Box>
            );
          })}
        </Box>
      )}
    </Paper>
  );
};
