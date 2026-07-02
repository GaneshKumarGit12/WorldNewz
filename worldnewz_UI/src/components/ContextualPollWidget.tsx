import React, { useState } from "react";
import { Box, Typography, Button, Paper, LinearProgress, Chip } from "@mui/material";
import PollIcon from "@mui/icons-material/Poll";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface ContextualPollWidgetProps {
  category?: string;
  title?: string;
}

export const ContextualPollWidget: React.FC<ContextualPollWidgetProps> = ({
  category = "General",
  title = "What is your perspective on this development?"
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);

  const [options, setOptions] = useState<PollOption[]>([
    { id: "1", text: "Strongly Agree / Positive Impact", votes: 42 },
    { id: "2", text: "Needs More Evidence & Time", votes: 28 },
    { id: "3", text: "Disagree / Potential Risks Involved", votes: 19 },
  ]);

  const totalVotes = options.reduce((sum, opt) => sum + opt.votes, 0) + (hasVoted ? 1 : 0);

  const handleVote = (id: string) => {
    if (hasVoted) return;
    setSelectedOption(id);
    setHasVoted(true);
    setOptions((prev) =>
      prev.map((opt) => (opt.id === id ? { ...opt, votes: opt.votes + 1 } : opt))
    );
  };

  return (
    <Paper
      elevation={2}
      sx={{
        my: 4,
        p: { xs: 2.5, sm: 3 },
        borderRadius: 3,
        background: "linear-gradient(135deg, rgba(200, 58, 21, 0.04) 0%, rgba(26, 26, 46, 0.04) 100%)",
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <PollIcon color="primary" />
          <Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, color: "primary.main" }}>
            WorldNewzs Quick Poll
          </Typography>
        </Box>
        <Chip label={category} size="small" variant="outlined" color="primary" sx={{ fontWeight: 700, fontSize: "0.7rem" }} />
      </Box>

      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: "1.05rem", sm: "1.2rem" }, lineHeight: 1.35 }}>
        {title}
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {options.map((opt) => {
          const percentage = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
          const isSelected = selectedOption === opt.id;

          return (
            <Box key={opt.id}>
              {!hasVoted ? (
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => handleVote(opt.id)}
                  sx={{
                    justifyContent: "flex-start",
                    textAlign: "left",
                    py: 1.2,
                    px: 2,
                    borderRadius: 2,
                    fontWeight: 600,
                    textTransform: "none",
                    borderColor: "divider",
                    color: "text.primary",
                    "&:hover": {
                      borderColor: "primary.main",
                      backgroundColor: "action.hover",
                    },
                  }}
                >
                  {opt.text}
                </Button>
              ) : (
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: isSelected ? "rgba(200, 58, 21, 0.08)" : "action.hover",
                    border: isSelected ? "1.5px solid #c83a15" : "1px solid transparent",
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.75 }}>
                    <Typography variant="body2" sx={{ fontWeight: isSelected ? 700 : 500, display: "flex", alignItems: "center", gap: 0.5 }}>
                      {isSelected && <CheckCircleIcon fontSize="small" color="primary" />}
                      {opt.text}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: isSelected ? "primary.main" : "text.secondary" }}>
                      {percentage}%
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
                        bgcolor: isSelected ? "primary.main" : "text.secondary",
                        borderRadius: 4,
                      },
                    }}
                  />
                </Box>
              )}
            </Box>
          );
        })}
      </Box>

      {hasVoted && (
        <Typography variant="caption" sx={{ display: "block", mt: 2, textAlign: "right", color: "text.secondary", fontWeight: 500 }}>
          Thank you for voting! ({totalVotes} readers participated)
        </Typography>
      )}
    </Paper>
  );
};
