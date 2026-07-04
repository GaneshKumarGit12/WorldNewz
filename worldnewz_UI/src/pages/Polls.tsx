import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import LinearProgress from "@mui/material/LinearProgress";
import Chip from "@mui/material/Chip";
import PollIcon from "@mui/icons-material/Poll";
import HistoryIcon from "@mui/icons-material/History";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import TimerIcon from "@mui/icons-material/Timer";
import InfoIcon from "@mui/icons-material/Info";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import QueryBuilderIcon from "@mui/icons-material/QueryBuilder";
import { fetchActivePolls, submitPollAnswers, checkUserAttempt } from "../api/apiClient";
import type { PollItem } from "../api/apiClient";
import { startPollsSignalR } from "../services/pollsSignalR";
import { SEOMeta } from "../seo/SEOMeta";
import { JSONLDBreadcrumb } from "../seo/JSONLDSchemas";
import { useKeywords } from "../seo/useKeywords";
import { useColorMode } from "../context/ThemeContext";
import { CategoryEditorial } from "../components/CategoryEditorial";

const BANNED_WORDS = [
  "pornography", "pronography", "sexual", "sexsual", 
  "porn", "sex", "xxx", "nsfw", "adult", "naked", 
  "erotic", "prostitute", "bitch", "bastard"
];

const TIMER_DURATION = 15; // 15 seconds per question

const Polls: React.FC = () => {
  const navigate = useNavigate();
  const { mode } = useColorMode();
  const isDark = mode === "dark";

  // Identification State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [identified, setIdentified] = useState(false);
  const [idError, setIdError] = useState<string | null>(null);
  const [duplicateError, setDuplicateError] = useState<boolean>(false);

  // Polls state
  const [polls, setPolls] = useState<PollItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Quiz states
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [isTimedOutState, setIsTimedOutState] = useState<{ [key: number]: boolean }>({});
  const [answeredPolls, setAnsweredPolls] = useState<{ [key: number]: boolean }>({});
  const [selections, setSelections] = useState<{ [key: number]: number }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Popup score state
  const [showPopup, setShowPopup] = useState(false);
  const [popupData, setPopupData] = useState<{ percentage: number; status: string } | null>(null);

  // Timer reference to manage interval
  const timerIntervalRef = useRef<any>(null);

  useEffect(() => {
    // Check if user was already identified in this session
    const savedName = sessionStorage.getItem("polls_user_name");
    const savedEmail = sessionStorage.getItem("polls_user_email");
    if (savedName && savedEmail) {
      setName(savedName);
      setEmail(savedEmail);
      setIdentified(true);
      loadPolls();
    } else {
      setLoading(false);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (polls.length > 0) {
      startPollsSignalR((liveData) => {
        if (!liveData) return;
        setPolls((prevPolls) =>
          prevPolls.map((poll) => {
            if (poll.id === liveData.pollId || poll.id === liveData.id) {
              const updatedOptions = poll.options.map((opt) => {
                const match = liveData.results?.find((r: any) => r.optionId === opt.id || r.id === opt.id);
                return match ? { ...opt, votes: match.votes } : opt;
              });
              return { ...poll, options: updatedOptions };
            }
            return poll;
          })
        );
      });
    }
  }, [polls.length]);

  // Timer countdown logic when current question changes
  useEffect(() => {
    if (identified && polls.length > 0 && currentQuestionIndex < polls.length) {
      const pollId = polls[currentQuestionIndex].id;

      // Reset timer for the current question if not yet answered
      if (!answeredPolls[pollId]) {
        setTimeLeft(TIMER_DURATION);

        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
        }

        timerIntervalRef.current = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
              }
              // Mark question as answered and timed out
              setAnsweredPolls((prevAns) => ({ ...prevAns, [pollId]: true }));
              setIsTimedOutState((prevTimeOut) => ({ ...prevTimeOut, [pollId]: true }));
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [currentQuestionIndex, identified, polls]);

  const loadPolls = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchActivePolls();
      setPolls(response.data);
      setCurrentQuestionIndex(0);
      setSelections({});
      setAnsweredPolls({});
      setIsTimedOutState({});
    } catch (err: any) {
      setError("Failed to load polls. Please try again later.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleIdentificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIdError(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail) {
      setIdError("Both Name and Email Address are required.");
      return;
    }

    // Banned words check (case-insensitive)
    const containsBanned = (str: string) => {
      const lower = str.toLowerCase();
      return BANNED_WORDS.some((word) => lower.includes(word));
    };

    if (containsBanned(trimmedName) || containsBanned(trimmedEmail)) {
      setIdError("Unnecessary or inappropriate words are not allowed in Name or Email.");
      return;
    }

    // Valid email check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setIdError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    checkUserAttempt(trimmedName, trimmedEmail, new Date().getTimezoneOffset())
      .then((res) => {
        if (res.data.exists) {
          setDuplicateError(true);
          setPopupData({
            percentage: res.data.percentage ?? 0,
            status: res.data.scoreStatus ?? "Red"
          });
          setShowPopup(true);
        } else {
          // Save locally
          sessionStorage.setItem("polls_user_name", trimmedName);
          sessionStorage.setItem("polls_user_email", trimmedEmail);
          setIdentified(true);
          loadPolls();
        }
      })
      .catch((err) => {
        const errMsg = err.response?.data?.error || "Failed to verify user. Please try again.";
        setIdError(errMsg);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleOptionSelect = (pollId: number, optionId: number) => {
    // If the poll has already been answered or timed out, block selection
    if (answeredPolls[pollId] || isTimedOutState[pollId]) return;

    // Lock option selection
    setSelections((prev) => ({
      ...prev,
      [pollId]: optionId
    }));
    
    setAnsweredPolls((prev) => ({
      ...prev,
      [pollId]: true
    }));

    // Stop countdown timer immediately
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < polls.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePollsAnswersSubmit = async () => {
    // Format all 5 answers, assigning 0 to options if timed out/unanswered
    const answersList = polls.map((poll) => ({
      pollId: poll.id,
      optionId: selections[poll.id] || 0
    }));

    try {
      setIsSubmitting(true);
      setError(null);

      const payload = {
        name: name.trim(),
        email: email.trim(),
        timezoneOffset: new Date().getTimezoneOffset(),
        answers: answersList
      };

      const response = await submitPollAnswers(payload);

      if (response.data.status === "success") {
        setPopupData({
          percentage: response.data.percentage,
          status: response.data.scoreStatus
        });
        setShowPopup(true);

        // Clear session and state to allow re-identifying cleanly
        sessionStorage.removeItem("polls_user_name");
        sessionStorage.removeItem("polls_user_email");
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error || "Failed to submit poll answers. Please try again.";
      setError(errMsg);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("polls_user_name");
    sessionStorage.removeItem("polls_user_email");
    setName("");
    setEmail("");
    setIdentified(false);
    setPolls([]);
    setSelections({});
    setAnsweredPolls({});
    setIsTimedOutState({});
    setCurrentQuestionIndex(0);
    setDuplicateError(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  };

  const handlePopupClose = () => {
    setShowPopup(false);
    setDuplicateError(false);
    navigate("/polls-history");
  };

  const dynamicKeywordsData = useKeywords("polls");
  const defaultKeywords = ["opinion polls", "public polls", "interactive polls", "voting results", "technology polls", "sports polls"];
  const combinedKeywords = dynamicKeywordsData
    ? [...new Set([...defaultKeywords, ...dynamicKeywordsData.primary, ...dynamicKeywordsData.longtail, ...dynamicKeywordsData.trending])]
    : defaultKeywords;
  const descriptionToUse = dynamicKeywordsData?.metaDesc || "Cast your vote in our daily public polls on technology, sports, business, and policy. View real-time results instantly.";

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "Green":
        return {
          color: "#22c55e",
          label: "Excellent (60-100%)",
          emoji: "🏆",
          animation: "pulse-green"
        };
      case "Orange":
        return {
          color: "#f59e0b",
          label: "Good (30-60%)",
          emoji: "👍",
          animation: "pulse-orange"
        };
      case "Red":
      default:
        return {
          color: "#ef4444",
          label: "Needs Improvement (0-30%)",
          emoji: "⚠️",
          animation: "pulse-red"
        };
    }
  };

  return (
    <>
      <SEOMeta
        title="Interactive Public Opinion Polls | WorldNewzs"
        description={descriptionToUse}
        keywords={combinedKeywords}
        canonical="https://worldnewzs.in/polls"
      />
      <JSONLDBreadcrumb
        crumbs={[
          { name: "Home", url: "https://worldnewzs.in" },
          { name: "Opinion Polls", url: "https://worldnewzs.in/polls" },
        ]}
      />

      <style>{`
        @keyframes pulse-green {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
          70% { transform: scale(1.15); box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
        @keyframes pulse-orange {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7); }
          70% { transform: scale(1.15); box-shadow: 0 0 0 10px rgba(245, 158, 11, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
        }
        @keyframes pulse-red {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { transform: scale(1.15); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        .animate-pulse-green { animation: pulse-green 1.5s infinite; }
        .animate-pulse-orange { animation: pulse-orange 1.5s infinite; }
        .animate-pulse-red { animation: pulse-red 1.5s infinite; }
      `}</style>

      <Container maxWidth="md" sx={{ py: 6 }}>
        {/* Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4, flexWrap: "wrap", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <PollIcon sx={{ fontSize: 40, color: "primary.main" }} />
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 900 }}>
                Opinion Polls
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Verify details, answer active timed questions, and see how you score.
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              component={Link}
              to="/polls-history"
              variant="outlined"
              color="primary"
              startIcon={<HistoryIcon />}
              sx={{ textTransform: "none", borderRadius: 3, fontWeight: 700 }}
            >
              View Leaderboard & History
            </Button>
            {identified && (
              <Button
                onClick={handleLogout}
                variant="text"
                color="error"
                sx={{ textTransform: "none", fontWeight: 700 }}
              >
                Change Identity
              </Button>
            )}
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 4, borderRadius: 3 }}>
            {error}
          </Alert>
        )}

        {/* ─── PHASE 1: IDENTIFICATION FORM ─── */}
        {!identified && !loading && (
          <Card 
            elevation={0}
            sx={{ 
              borderRadius: 4, 
              border: "1px solid",
              borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
              background: isDark 
                ? "linear-gradient(135deg, #1e2530 0%, #161b22 100%)" 
                : "linear-gradient(135deg, #f5f8ff 0%, #ffffff 100%)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.06)"
            }}
          >
            <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
              <Box sx={{ textAlign: "center", mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                  User Verification Required
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Please verify your name and email address to start answering the poll questions.
                </Typography>
              </Box>

              {idError && (
                <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
                  {idError}
                </Alert>
              )}

              <Box component="form" onSubmit={handleIdentificationSubmit} sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <TextField
                  label="Your Full Name"
                  variant="outlined"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  fullWidth
                  required
                  slotProps={{
                    input: { sx: { borderRadius: 3 } }
                  }}
                />
                <TextField
                  label="Email Address"
                  type="email"
                  variant="outlined"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. john.doe@example.com"
                  fullWidth
                  required
                  slotProps={{
                    input: { sx: { borderRadius: 3 } }
                  }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  sx={{ 
                    mt: 2, 
                    borderRadius: 3, 
                    fontWeight: 700, 
                    py: 1.5,
                    background: "linear-gradient(90deg, #ff8a65 0%, #c83a15 100%)",
                    "&:hover": {
                      background: "linear-gradient(90deg, #ff9e80 0%, #d84315 100%)",
                    }
                  }}
                >
                  Verify and Access Polls
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Loading Spinner */}
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress size={50} />
          </Box>
        )}

        {/* ─── PHASE 2: QUESTIONS LIST (ONE-BY-ONE FLOW) ─── */}
        {identified && !loading && polls.length > 0 && (
          <Box>
            {/* User Identity Chip */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3, p: 2, borderRadius: 3, border: "1px solid", borderColor: "divider", backgroundColor: "action.hover" }}>
              <InfoIcon color="primary" fontSize="small" />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Answering as: <Box component="span" sx={{ color: "primary.main" }}>{name} ({email})</Box>
              </Typography>
            </Box>

            {/* Progress indicator */}
            <Box sx={{ mb: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                Question {currentQuestionIndex + 1} of {polls.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Progress: {Math.round(((currentQuestionIndex + 1) / polls.length) * 100)}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={((currentQuestionIndex + 1) / polls.length) * 100}
              sx={{ height: 6, borderRadius: 3, mb: 4 }}
            />

            {(() => {
              const poll = polls[currentQuestionIndex];
              const isTimedOut = isTimedOutState[poll.id] === true;
              const isAnswered = answeredPolls[poll.id] === true;
              const isLocked = isTimedOut || isAnswered;
              const currentSelection = selections[poll.id];

              // Locate correct option
              const correctOption = poll.options.find(o => o.isCorrect === true);

              return (
                <Card
                  sx={{
                    borderRadius: 4,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                    border: "1px solid",
                    borderColor: isLocked ? (isTimedOut ? "error.light" : "success.light") : "divider",
                    transition: "all 0.3s ease"
                  }}
                >
                  {/* Card Header with Question and Timer */}
                  <Box sx={{ 
                    p: 3, 
                    backgroundColor: isLocked ? (isTimedOut ? "rgba(239,68,68,0.03)" : "rgba(34,197,94,0.03)") : "action.hover", 
                    borderBottom: "1px solid", 
                    borderColor: "divider",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: 2
                  }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        {poll.question}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                        {poll.description}
                      </Typography>
                    </Box>

                    {/* Question Timer Indicator */}
                    <Box sx={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: 1, 
                      px: 2, 
                      py: 0.75, 
                      borderRadius: 3, 
                      backgroundColor: isLocked 
                        ? (isTimedOut ? "error.main" : "success.main") 
                        : timeLeft < 6 ? "error.main" : timeLeft < 10 ? "warning.main" : "primary.main",
                      color: "white",
                      fontWeight: 800,
                      fontSize: "0.85rem",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                      transition: "background-color 0.3s"
                    }}>
                      <TimerIcon fontSize="small" />
                      <span>{isTimedOut ? "Timed Out" : isAnswered ? "Answered" : `${timeLeft}s`}</span>
                    </Box>
                  </Box>

                  {/* Animated Timer Progress Bar */}
                  {!isLocked && (
                    <LinearProgress 
                      variant="determinate" 
                      value={(timeLeft / TIMER_DURATION) * 100}
                      sx={{ 
                        height: 4, 
                        backgroundColor: "rgba(0,0,0,0.03)",
                        "& .MuiLinearProgress-bar": {
                          backgroundColor: timeLeft < 6 ? "error.main" : timeLeft < 10 ? "warning.main" : "primary.main",
                          transition: "transform 1s linear"
                        }
                      }}
                    />
                  )}

                  {/* Card Options list */}
                  <CardContent sx={{ p: 4 }}>
                    <RadioGroup
                      value={currentSelection || ""}
                      onChange={(e) => handleOptionSelect(poll.id, parseInt(e.target.value))}
                    >
                      {poll.options.map((option) => {
                        const isSelected = currentSelection === option.id;
                        const isCorrect = option.isCorrect;
                        
                        // Option highlights when locked
                        let borderColor = "divider";
                        let backgroundColor = "transparent";
                        let adornment = null;

                        if (isLocked) {
                          if (isCorrect) {
                            borderColor = "#22c55e"; // Green correct
                            backgroundColor = isDark ? "rgba(34,197,94,0.08)" : "rgba(34,197,94,0.04)";
                            adornment = (
                              <Chip 
                                size="small" 
                                color="success" 
                                icon={<CheckCircleIcon />} 
                                label="Correct Answer" 
                                sx={{ ml: 2, fontWeight: 700 }}
                              />
                            );
                          } else if (isSelected) {
                            borderColor = "#ef4444"; // Red wrong
                            backgroundColor = isDark ? "rgba(239,68,68,0.08)" : "rgba(239,68,68,0.04)";
                            adornment = (
                              <Chip 
                                size="small" 
                                color="error" 
                                icon={<CancelIcon />} 
                                label="Your Wrong Selection" 
                                sx={{ ml: 2, fontWeight: 700 }}
                              />
                            );
                          }
                        } else if (isSelected) {
                          borderColor = "primary.main";
                          backgroundColor = "primary.light";
                        }

                        const isPollAnswered = Boolean(selections[poll.id]);
                        const totalVotesOfPoll = poll.options.reduce((sum, o) => sum + o.votes, 0) + (isPollAnswered ? 1 : 0);
                        const isUserSelected = selections[poll.id] === option.id;
                        const optionVotes = option.votes + (isUserSelected ? 1 : 0);
                        const optionPercentage = totalVotesOfPoll > 0 ? Math.round((optionVotes / totalVotesOfPoll) * 100) : 0;

                        return (
                          <Box
                            key={option.id}
                            sx={{
                              border: "1px solid",
                              borderColor: borderColor,
                              backgroundColor: backgroundColor,
                              borderRadius: 3,
                              px: 2.5,
                              py: 1.8,
                              mb: 2,
                              transition: "all 0.2s",
                              cursor: isLocked ? "not-allowed" : "pointer",
                              opacity: isLocked && !isSelected && !isCorrect ? 0.6 : 1,
                              "&:hover": {
                                borderColor: isLocked ? borderColor : "primary.main",
                                backgroundColor: isLocked ? backgroundColor : "action.hover",
                              }
                            }}
                            onClick={() => !isLocked && handleOptionSelect(poll.id, option.id)}
                          >
                            <FormControlLabel
                              value={option.id}
                              disabled={isLocked}
                              control={<Radio size="small" sx={{ display: isLocked ? "none" : "inline-flex" }} />}
                              label={
                                <Box sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
                                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", width: "100%", gap: 1 }}>
                                    <Typography sx={{ fontWeight: 600 }}>{option.optionText}</Typography>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                      {adornment}
                                      {isLocked && (
                                        <Typography variant="body2" sx={{ fontWeight: 800, color: isCorrect ? "success.main" : isSelected ? "error.main" : "text.secondary" }}>
                                          {optionPercentage}% ({optionVotes} {optionVotes === 1 ? "vote" : "votes"})
                                        </Typography>
                                      )}
                                    </Box>
                                  </Box>
                                  {isLocked && (
                                    <LinearProgress
                                      variant="determinate"
                                      value={optionPercentage}
                                      sx={{
                                        mt: 1.5,
                                        height: 6,
                                        borderRadius: 3,
                                        backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                                        "& .MuiLinearProgress-bar": {
                                          backgroundColor: isCorrect ? "#22c55e" : isSelected ? "#ef4444" : "text.secondary",
                                          borderRadius: 3
                                        }
                                      }}
                                    />
                                  )}
                                </Box>
                              }
                              sx={{ width: "100%", m: 0 }}
                            />
                          </Box>
                        );
                      })}
                    </RadioGroup>

                    {/* Display Correct Answer Reveal below choices */}
                    {isLocked && correctOption && (
                      <Box sx={{ mt: 3 }}>
                        {isTimedOut ? (
                          <Alert severity="warning" variant="outlined" sx={{ borderRadius: 3 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <QueryBuilderIcon color="warning" />
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                Time's up! The correct answer was: <Box component="span" sx={{ color: "success.main", fontWeight: 800 }}>{correctOption.optionText}</Box>
                              </Typography>
                            </Box>
                          </Alert>
                        ) : selections[poll.id] === correctOption.id ? (
                          <Alert severity="success" variant="outlined" sx={{ borderRadius: 3 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <CheckCircleIcon color="success" />
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                Correct! Excellent job. The answer is: <Box component="span" sx={{ color: "success.main", fontWeight: 800 }}>{correctOption.optionText}</Box>
                              </Typography>
                            </Box>
                          </Alert>
                        ) : (
                          <Alert severity="error" variant="outlined" sx={{ borderRadius: 3 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <CancelIcon color="error" />
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                Incorrect. The correct answer is: <Box component="span" sx={{ color: "success.main", fontWeight: 800 }}>{correctOption.optionText}</Box>
                              </Typography>
                            </Box>
                          </Alert>
                        )}
                      </Box>
                    )}

                    {/* Navigation Actions */}
                    {isLocked && (
                      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 4 }}>
                        {currentQuestionIndex < polls.length - 1 ? (
                          <Button
                            variant="contained"
                            size="large"
                            onClick={handleNextQuestion}
                            endIcon={<ArrowForwardIcon />}
                            sx={{
                              borderRadius: 3,
                              textTransform: "none",
                              fontWeight: 800,
                              px: 4,
                              py: 1.25,
                              boxShadow: "0 4px 12px rgba(200, 58, 21, 0.15)",
                              background: "linear-gradient(90deg, #ff8a65 0%, #c83a15 100%)",
                              "&:hover": {
                                background: "linear-gradient(90deg, #ff9e80 0%, #d84315 100%)",
                              }
                            }}
                          >
                            Next Question
                          </Button>
                        ) : (
                          <Button
                            variant="contained"
                            size="large"
                            onClick={handlePollsAnswersSubmit}
                            disabled={isSubmitting}
                            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <CheckCircleOutlineIcon />}
                            sx={{
                              borderRadius: 3,
                              textTransform: "none",
                              fontWeight: 800,
                              px: 5,
                              py: 1.25,
                              boxShadow: "0 6px 18px rgba(200, 58, 21, 0.25)",
                              background: "linear-gradient(90deg, #ff8a65 0%, #c83a15 100%)",
                              "&:hover": {
                                background: "linear-gradient(90deg, #ff9e80 0%, #d84315 100%)",
                              }
                            }}
                          >
                            Finish & View Score
                          </Button>
                        )}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              );
            })()}
          </Box>
        )}

        <CategoryEditorial categoryKey="polls" />

        {/* ─── PHASE 3: RATING POPUP DIALOG ─── */}
        <Dialog
          open={showPopup}
          onClose={handlePopupClose}
          PaperProps={{
            sx: {
              borderRadius: 5,
              p: 3,
              maxWidth: 420,
              width: "100%",
              boxShadow: "0 12px 40px rgba(0,0,0,0.3)",
              border: "1px solid",
              borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
              backgroundColor: isDark ? "rgba(22,27,34,0.95)" : "rgba(255,255,255,0.95)",
              backdropFilter: "blur(12px)"
            }
          }}
        >
          {popupData && (
            <DialogContent sx={{ p: 0, textAlign: "center" }}>
              {duplicateError ? (
                <>
                  {/* Warning Dot */}
                  <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
                    <Box 
                      sx={{
                        width: 90,
                        height: 90,
                        borderRadius: "50%",
                        backgroundColor: "#f59e0b",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "2.5rem",
                        color: "white"
                      }}
                    >
                      ⚠️
                    </Box>
                  </Box>

                  <Typography variant="h5" sx={{ fontWeight: 900, mb: 2, color: "text.primary" }}>
                    Already Submitted
                  </Typography>
                  
                  <Typography variant="body1" sx={{ fontWeight: 700, color: "warning.main", px: 2, mb: 3 }}>
                    Current user already applied. No chance to applicable same user again.
                  </Typography>
                </>
              ) : (
                <>
                  {/* Pulsing Animated Status Circle */}
                  <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
                    <Box 
                      className={`animate-${getStatusConfig(popupData.status).animation}`}
                      sx={{
                        width: 90,
                        height: 90,
                        borderRadius: "50%",
                        backgroundColor: getStatusConfig(popupData.status).color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "2.5rem",
                        color: "white"
                      }}
                    >
                      {getStatusConfig(popupData.status).emoji}
                    </Box>
                  </Box>

                  <Typography variant="h4" sx={{ fontWeight: 900, mb: 1, color: "text.primary" }}>
                    {popupData.percentage}% Score
                  </Typography>
                  
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: getStatusConfig(popupData.status).color, mb: 2 }}>
                    {getStatusConfig(popupData.status).label}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ px: 2, mb: 3 }}>
                    Your responses have been successfully validated and recorded in our live database rankings. Check the leaderboard to compare.
                  </Typography>
                </>
              )}

              <DialogActions sx={{ justifyContent: "center", p: 0 }}>
                <Button
                  onClick={handlePopupClose}
                  variant="contained"
                  sx={{ 
                    borderRadius: 3, 
                    textTransform: "none", 
                    fontWeight: 800,
                    px: 6,
                    py: 1.25,
                    background: "linear-gradient(90deg, #ff8a65 0%, #c83a15 100%)",
                    "&:hover": {
                      background: "linear-gradient(90deg, #ff9e80 0%, #d84315 100%)",
                    }
                  }}
                >
                  OK - View Leaderboard
                </Button>
              </DialogActions>
            </DialogContent>
          )}
        </Dialog>

      </Container>
    </>
  );
};

export default Polls;
