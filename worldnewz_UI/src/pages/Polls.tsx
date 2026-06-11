import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import LinearProgress from "@mui/material/LinearProgress";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import PollIcon from "@mui/icons-material/Poll";
import HistoryIcon from "@mui/icons-material/History";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { fetchActivePolls, submitPollVote } from "../api/apiClient";
import type { PollItem } from "../api/apiClient";
import { SEOMeta } from "../seo/SEOMeta";
import { JSONLDBreadcrumb } from "../seo/JSONLDSchemas";

const Polls: React.FC = () => {
  const [polls, setPolls] = useState<PollItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Track selected options for each poll: { [pollId]: optionId }
  const [selectedOptions, setSelectedOptions] = useState<{ [key: number]: number }>({});
  
  // Track voted polls locally so we immediately display results: { [pollId]: VoteResponseResults }
  const [votedResults, setVotedResults] = useState<{ [key: number]: any }>({});
  
  // Submitting state for active votes: { [pollId]: boolean }
  const [votingStates, setVotingStates] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    loadPolls();
    // Load voted polls from localStorage
    try {
      const saved = localStorage.getItem("worldnewzs_voted_polls");
      if (saved) {
        setVotedResults(JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Could not load voted polls from localStorage", e);
    }
  }, []);

  const loadPolls = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchActivePolls();
      setPolls(response.data);
    } catch (err: any) {
      setError("Failed to load polls. Please try again later.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionChange = (pollId: number, optionId: number) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [pollId]: optionId,
    }));
  };

  const handleVoteSubmit = async (pollId: number) => {
    const selectedOptionId = selectedOptions[pollId];
    if (!selectedOptionId) return;

    try {
      setVotingStates((prev) => ({ ...prev, [pollId]: true }));
      const response = await submitPollVote(pollId, selectedOptionId);
      
      if (response.data.status === "success") {
        const updatedResults = {
          totalVotes: response.data.totalVotes,
          results: response.data.results,
        };

        const newVoted = {
          ...votedResults,
          [pollId]: updatedResults,
        };

        setVotedResults(newVoted);
        localStorage.setItem("worldnewzs_voted_polls", JSON.stringify(newVoted));
      }
    } catch (err: any) {
      console.error("Voting failed", err);
      alert("Failed to submit vote. Please try again.");
    } finally {
      setVotingStates((prev) => ({ ...prev, [pollId]: false }));
    }
  };

  const getPollOptionPercentage = (pollId: number, optionId: number, optionVotes: number) => {
    const results = votedResults[pollId];
    if (results) {
      const opt = results.results.find((r: any) => r.id === optionId);
      return opt ? opt.percentage : 0;
    }
    
    // Fallback if not voted yet
    const poll = polls.find(p => p.id === pollId);
    if (!poll) return 0;
    const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);
    return totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100 * 10) / 10 : 0;
  };

  const getPollTotalVotes = (pollId: number) => {
    const results = votedResults[pollId];
    if (results) return results.totalVotes;

    const poll = polls.find(p => p.id === pollId);
    return poll ? poll.options.reduce((sum, o) => sum + o.votes, 0) : 0;
  };

  return (
    <>
      <SEOMeta
        title="Interactive Public Opinion Polls | WorldNewzs"
        description="Cast your vote in our daily public polls on technology, sports, business, and policy. View real-time results instantly."
        canonical="https://worldnewzs.in/polls"
      />
      <JSONLDBreadcrumb
        crumbs={[
          { name: "Home", url: "https://worldnewzs.in" },
          { name: "Opinion Polls", url: "https://worldnewzs.in/polls" },
        ]}
      />

      <Container maxWidth="md" sx={{ py: 6 }}>
        {/* Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4, flexWrap: "wrap", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <PollIcon sx={{ fontSize: 40, color: "primary.main" }} />
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 800 }}>
                Opinion Polls
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Share your perspective on trending news topics.
              </Typography>
            </Box>
          </Box>

          <Button
            component={Link}
            to="/polls-history"
            variant="outlined"
            color="primary"
            startIcon={<HistoryIcon />}
            sx={{ textTransform: "none", borderRadius: 3, fontWeight: 700 }}
          >
            View Polls History DataGrid
          </Button>
        </Box>

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress size={50} />
          </Box>
        )}

        {/* Error State */}
        {error && !loading && (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}

        {/* Poll Cards list */}
        {!loading && !error && polls.length === 0 && (
          <Alert severity="info" sx={{ mb: 4 }}>
            No active polls found. Please check back later.
          </Alert>
        )}

        {!loading && !error && polls.map((poll) => {
          const isVoted = votedResults[poll.id] !== undefined;
          const isVoting = votingStates[poll.id] === true;
          const selectedOption = selectedOptions[poll.id];
          const totalVotes = getPollTotalVotes(poll.id);

          return (
            <Card
              key={poll.id}
              sx={{
                mb: 4,
                borderRadius: 4,
                boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
                border: "1px solid",
                borderColor: "divider",
                overflow: "hidden",
                transition: "transform 0.2s ease",
                "&:hover": {
                  transform: "translateY(-2px)"
                }
              }}
            >
              <Box sx={{ p: 3, backgroundColor: "action.hover", borderBottom: "1px solid", borderColor: "divider" }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: "text.primary" }}>
                  {poll.question}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                  {poll.description}
                </Typography>
              </Box>

              <CardContent sx={{ p: 3 }}>
                {!isVoted ? (
                  // Voting Form
                  <Box>
                    <RadioGroup
                      value={selectedOption || ""}
                      onChange={(e) => handleOptionChange(poll.id, parseInt(e.target.value))}
                    >
                      {poll.options.map((option) => (
                        <Box
                          key={option.id}
                          sx={{
                            border: "1px solid",
                            borderColor: selectedOption === option.id ? "primary.main" : "divider",
                            backgroundColor: selectedOption === option.id ? "primary.light" : "transparent",
                            borderRadius: 2,
                            px: 2,
                            py: 1,
                            mb: 1.5,
                            transition: "all 0.2s",
                            "&.Mui-disabled": { opacity: 0.8 },
                            "&:hover": {
                              borderColor: "primary.main",
                              backgroundColor: selectedOption === option.id ? "primary.light" : "action.hover",
                            }
                          }}
                        >
                          <FormControlLabel
                            value={option.id}
                            control={<Radio size="small" />}
                            label={option.optionText}
                            sx={{ width: "100%", m: 0 }}
                          />
                        </Box>
                      ))}
                    </RadioGroup>

                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        {totalVotes} total votes casted
                      </Typography>
                      <Button
                        variant="contained"
                        onClick={() => handleVoteSubmit(poll.id)}
                        disabled={!selectedOption || isVoting}
                        startIcon={isVoting ? <CircularProgress size={16} /> : <CheckCircleOutlineIcon />}
                        sx={{
                          borderRadius: 2,
                          textTransform: "none",
                          fontWeight: 700,
                          px: 3,
                          boxShadow: "none"
                        }}
                      >
                        Submit Vote
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  // Poll Results Mode
                  <Box>
                    {poll.options.map((option) => {
                      const pct = getPollOptionPercentage(poll.id, option.id, option.votes);
                      const isUserSelection = selectedOption === option.id;

                      return (
                        <Box key={option.id} sx={{ mb: 2.5 }}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.75 }}>
                            <Typography variant="body2" sx={{ fontWeight: isUserSelection ? 800 : 500, color: "text.primary" }}>
                              {option.optionText} {isUserSelection && " (Your Vote)"}
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: "primary.main" }}>
                              {pct}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={pct}
                            sx={{
                              height: 10,
                              borderRadius: 5,
                              backgroundColor: "divider",
                              "& .MuiLinearProgress-bar": {
                                borderRadius: 5,
                                background: isUserSelection
                                  ? "linear-gradient(90deg, #ff8a65 0%, #c83a15 100%)"
                                  : "linear-gradient(90deg, #7b809a 0%, #4f5b66 100%)"
                              }
                            }}
                          />
                        </Box>
                      );
                    })}

                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 3, pt: 2, borderTop: "1px solid", borderColor: "divider" }}>
                      <Typography variant="caption" color="text.secondary">
                        {totalVotes} total votes casted (Results updated in real-time)
                      </Typography>
                      <Alert severity="success" icon={false} sx={{ py: 0, px: 1.5, borderRadius: 2, "& .MuiAlert-message": { fontSize: "0.75rem", fontWeight: 700 } }}>
                        ✓ Vote Registered
                      </Alert>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          );
        })}
      </Container>
    </>
  );
};

export default Polls;
