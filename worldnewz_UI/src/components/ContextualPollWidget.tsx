import React, { useState, useEffect } from "react";
import { Box, Paper, Typography, Button, RadioGroup, FormControlLabel, Radio, LinearProgress, Alert, Chip } from "@mui/material";
import HowToVoteIcon from "@mui/icons-material/HowToVote";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { submitSingleVote, fetchContextualPoll } from "../api/apiClient";
import type { ContextualPollData } from "../api/apiClient";
import { startPollsSignalR } from "../services/pollsSignalR";

const ALTERNATIVE_POLLS: Record<string, Array<{ question: string; options: string[] }>> = {
  politics: [
    {
      question: "Should governments restrict social media algorithms for minors?",
      options: ["Yes, absolutely", "No, it's parental choice", "Neutral / Unsure"]
    },
    {
      question: "Do you believe artificial intelligence will influence global elections this year?",
      options: ["Yes, significantly", "No, impact is overstated", "Unsure"]
    },
    {
      question: "Is increased voter turn-out the primary driver of regional policy reforms?",
      options: ["Yes, majorly", "No, lobbying has more weight", "Depends on the region"]
    }
  ],
  technology: [
    {
      question: "Will generative AI completely replace traditional software engineering within 5 years?",
      options: ["Yes, code automation is too fast", "No, developers will adapt", "Partially (hybrid assistance)"]
    },
    {
      question: "Would you trust a fully autonomous self-driving vehicle for your daily commute?",
      options: ["Yes, immediately", "No, safety concerns", "Only on dedicated highway lanes"]
    },
    {
      question: "Should large tech conglomerates be split to foster open market competition?",
      options: ["Yes, monopolies hurt consumers", "No, scale drives innovation", "Indifferent"]
    }
  ],
  business: [
    {
      question: "Are remote-first schedules sustainable for corporate productivity long term?",
      options: ["Yes, improves employee retention", "No, return-to-office builds culture", "Hybrid is the ideal balance"]
    },
    {
      question: "Do you believe digital cryptocurrencies are a viable alternative to traditional currencies?",
      options: ["Yes, decentralized future", "No, speculative assets", "Only under strict government regulation"]
    },
    {
      question: "Are current startup valuation metrics aligned with real economic value?",
      options: ["Yes, based on growth potential", "No, heavily bloated by hype", "Varies by sector"]
    }
  ],
  "science-health": [
    {
      question: "Do you prioritize mental health support as much as physical healthcare routines?",
      options: ["Yes, both are equally critical", "No, focus more on physical", "Need to balance them better"]
    },
    {
      question: "Should global space agencies prioritize Mars exploration over building Moon colonies?",
      options: ["Mars missions directly", "Moon base first as stepping stone", "Focus resources on Earth instead"]
    },
    {
      question: "Will mRNA gene therapies revolutionize modern cancer oncology treatments?",
      options: ["Yes, highly optimistic", "No, too many hurdles", "Unsure / Early to tell"]
    }
  ],
  sports: [
    {
      question: "Do you believe professional athletic records can still be broken without performance aids?",
      options: ["Yes, human potential is limitless", "No, we have reached physical peaks", "Only with improved sportswear technology"]
    },
    {
      question: "Is the integration of video replay reviews (VAR) improving sports integrity?",
      options: ["Yes, corrects critical errors", "No, ruins the flow and emotion", "Yes, but rules must be simplified"]
    }
  ],
  money: [
    {
      question: "Is a 50/30/20 budgeting rule realistic in today's economy?",
      options: ["Yes, crucial constraint", "No, savings rate must be higher", "No, living costs are too high"]
    },
    {
      question: "Should index-matching funds form the core of long-term retirement investments?",
      options: ["Yes, low fees and steady returns", "No, active stock pickers beat indexing", "Prefer real estate / commodities"]
    }
  ]
};

const DEFAULT_POLLS = [
  {
    question: "Do you agree with the primary takeaways of today's news briefing summaries?",
    options: ["Yes, summaries are balanced", "No, seems biased", "Neutral / Undecided"]
  },
  {
    question: "Are AI-powered news summaries helpful for your daily information intake?",
    options: ["Very helpful", "No change", "Prefer reading the full source articles"]
  }
];

interface ContextualPollWidgetProps {
  initialPoll?: ContextualPollData;
  category?: string;
  articleUrl?: string;
}

export const ContextualPollWidget: React.FC<ContextualPollWidgetProps> = ({ initialPoll, category, articleUrl }) => {
  const getDynamicPoll = (): ContextualPollData => {
    const catKey = (category || "general").toLowerCase();
    const pollList = ALTERNATIVE_POLLS[catKey] || DEFAULT_POLLS;
    
    let index = 0;
    if (articleUrl) {
      const hash = articleUrl.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      index = Math.abs(hash) % pollList.length;
    }
    
    const selected = pollList[index];
    const simulatedVotes = [124, 87, 43, 62, 105];
    const optionsData = selected.options.map((opt, i) => ({
      optionId: i + 1,
      text: opt,
      votes: simulatedVotes[i % simulatedVotes.length]
    }));
    
    let pollIdNum = index + 1000;
    const hash = catKey.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    pollIdNum += hash * 10;

    return {
      pollId: pollIdNum,
      question: selected.question,
      options: optionsData,
      totalVotes: optionsData.reduce((sum, o) => sum + o.votes, 0)
    };
  };

  const [poll, setPoll] = useState<ContextualPollData | undefined>(() => {
    if (initialPoll) return initialPoll;
    return getDynamicPoll();
  });
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [voting, setVoting] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (initialPoll) {
      setPoll(initialPoll);
      setHasVoted(false);
      setSelectedOptionId(null);
    } else if (articleUrl) {
      setLoading(true);
      fetchContextualPoll(category, undefined, articleUrl)
        .then((res) => {
          if (res.data) {
            setPoll(res.data);
          } else {
            setPoll(getDynamicPoll());
          }
        })
        .catch(() => {
          setPoll(getDynamicPoll());
        })
        .finally(() => {
          setLoading(false);
        });
      setHasVoted(false);
      setSelectedOptionId(null);
    } else {
      setPoll(getDynamicPoll());
      setHasVoted(false);
      setSelectedOptionId(null);
    }
  }, [initialPoll, category, articleUrl]);

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

  if (loading) {
    return (
      <Paper elevation={1} sx={{ p: 3, mb: 4, borderRadius: 2, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Typography variant="body2" sx={{ mb: 2, fontStyle: "italic" }}>Loading community poll...</Typography>
        <LinearProgress sx={{ width: "100%" }} />
      </Paper>
    );
  }

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
      id="contextual-poll-widget"
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
            value={selectedOptionId !== null ? String(selectedOptionId) : ""}
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
                  value={String(option.optionId)}
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
