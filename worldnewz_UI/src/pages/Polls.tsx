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
import PollIcon from "@mui/icons-material/Poll";
import HistoryIcon from "@mui/icons-material/History";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import TimerIcon from "@mui/icons-material/Timer";
import InfoIcon from "@mui/icons-material/Info";
import { fetchActivePolls, submitPollAnswers } from "../api/apiClient";
import type { PollItem } from "../api/apiClient";
import { SEOMeta } from "../seo/SEOMeta";
import { JSONLDBreadcrumb } from "../seo/JSONLDSchemas";
import { useKeywords } from "../seo/useKeywords";
import { useColorMode } from "../context/ThemeContext";

const BANNED_WORDS = [
  "pornography", "pronography", "sexual", "sexsual", 
  "porn", "sex", "xxx", "nsfw", "adult", "naked", 
  "erotic", "prostitute", "bitch", "bastard"
];

const Polls: React.FC = () => {
  const navigate = useNavigate();
  const { mode } = useColorMode();
  const isDark = mode === "dark";

  // Identification State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [identified, setIdentified] = useState(false);
  const [idError, setIdError] = useState<string | null>(null);

  // Polls state
  const [polls, setPolls] = useState<PollItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Timers: { [pollId]: secondsLeft }
  const [timers, setTimers] = useState<{ [key: number]: number }>({});
  const [disabledPolls, setDisabledPolls] = useState<{ [key: number]: boolean }>({});
  
  // Track which polls have been answered
  const [answeredPolls, setAnsweredPolls] = useState<{ [key: number]: boolean }>({});
  
  // Selections: { [pollId]: optionId }
  const [selections, setSelections] = useState<{ [key: number]: number }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Popup score state
  const [showPopup, setShowPopup] = useState(false);
  const [popupData, setPopupData] = useState<{ percentage: number; status: string } | null>(null);

  // Timer reference to manage intervals
  const intervalRef = useRef<any>(null);

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
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const loadPolls = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchActivePolls();
      setPolls(response.data);

      // Initialize timers for each poll (30 seconds each)
      const initialTimers: { [key: number]: number } = {};
      const initialDisabled: { [key: number]: boolean } = {};
      response.data.forEach((poll) => {
        initialTimers[poll.id] = 30;
        initialDisabled[poll.id] = false;
      });
      setTimers(initialTimers);
      setDisabledPolls(initialDisabled);

      // Start the countdown interval
      startTimers(response.data.map(p => p.id));
    } catch (err: any) {
      setError("Failed to load polls. Please try again later.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startTimers = (pollIds: number[]) => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setTimers((prev) => {
        const updated = { ...prev };
        let allZero = true;

        pollIds.forEach((id) => {
          if (updated[id] > 0) {
            updated[id] -= 1;
            allZero = false;
            
            if (updated[id] === 0) {
              setDisabledPolls((prevDisabled) => ({
                ...prevDisabled,
                [id]: true
              }));
            }
          }
        });

        if (allZero && intervalRef.current) {
          clearInterval(intervalRef.current);
        }

        return updated;
      });
    }, 1000);
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

    // Save locally
    sessionStorage.setItem("polls_user_name", trimmedName);
    sessionStorage.setItem("polls_user_email", trimmedEmail);
    setIdentified(true);
    loadPolls();
  };

  const handleOptionSelect = (pollId: number, optionId: number) => {
    // If the poll has already been disabled by timeout or answered once, block changes
    if (disabledPolls[pollId] || answeredPolls[pollId]) return;

    setSelections((prev) => ({
      ...prev,
      [pollId]: optionId
    }));
    
    // Lock the question choice immediately upon the first click
    setAnsweredPolls((prev) => ({
      ...prev,
      [pollId]: true
    }));
  };

  const handlePollsAnswersSubmit = async () => {
    const answersList = Object.entries(selections).map(([pollId, optionId]) => ({
      pollId: parseInt(pollId),
      optionId: optionId
    }));

    if (answersList.length === 0) {
      alert("Please answer at least one question before submitting.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const payload = {
        name: name.trim(),
        email: email.trim(),
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
    setDisabledPolls({});
    setAnsweredPolls({});
    setTimers({});
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const handlePopupClose = () => {
    setShowPopup(false);
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
                Verify your details, answer active timed polls, and track evaluation scores.
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
              View Polls Submissions History
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

        {/* ─── PHASE 2: QUESTIONS LIST ─── */}
        {identified && !loading && (
          <Box>
            {polls.length === 0 ? (
              <Alert severity="info" sx={{ mb: 4, borderRadius: 3 }}>
                No active polls found. Please check back later.
              </Alert>
            ) : (
              <Box>
                {/* User Identity Chip */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3, p: 2, borderRadius: 3, border: "1px solid", borderColor: "divider", backgroundColor: "action.hover" }}>
                  <InfoIcon color="primary" fontSize="small" />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Answering as: <Box component="span" sx={{ color: "primary.main" }}>{name} ({email})</Box>
                  </Typography>
                </Box>

                {polls.map((poll) => {
                  const timeLeft = timers[poll.id] ?? 30;
                  const isTimedOut = disabledPolls[poll.id] === true;
                  const isAnswered = answeredPolls[poll.id] === true;
                  const isLocked = isTimedOut || isAnswered;
                  const currentSelection = selections[poll.id];

                  // Locate correct option
                  const correctOption = poll.options.find(o => o.isCorrect === true);

                  return (
                    <Card
                      key={poll.id}
                      sx={{
                        mb: 4,
                        borderRadius: 4,
                        boxShadow: "0 4px 15px rgba(0,0,0,0.04)",
                        border: "1px solid",
                        borderColor: isLocked ? (isTimedOut && !currentSelection ? "error.light" : "success.light") : "divider",
                        opacity: isTimedOut && !currentSelection ? 0.7 : 1,
                        transition: "all 0.3s ease"
                      }}
                    >
                      {/* Card Header with Question and Timer */}
                      <Box sx={{ 
                        p: 3, 
                        backgroundColor: isLocked ? (isTimedOut && !currentSelection ? "rgba(239,68,68,0.05)" : "rgba(34,197,94,0.05)") : "action.hover", 
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
                          backgroundColor: isLocked ? (isTimedOut && !currentSelection ? "error.main" : "success.main") : timeLeft < 10 ? "warning.main" : "primary.main",
                          color: "white",
                          fontWeight: 800,
                          fontSize: "0.85rem",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
                        }}>
                          <TimerIcon fontSize="small" />
                          <span>{isTimedOut ? "Timed Out" : isAnswered ? "Locked" : `${timeLeft}s`}</span>
                        </Box>
                      </Box>

                      {/* Card Options list */}
                      <CardContent sx={{ p: 3 }}>
                        <RadioGroup
                          value={currentSelection || ""}
                          onChange={(e) => handleOptionSelect(poll.id, parseInt(e.target.value))}
                        >
                          {poll.options.map((option) => (
                            <Box
                              key={option.id}
                              sx={{
                                border: "1px solid",
                                borderColor: currentSelection === option.id 
                                  ? "primary.main" 
                                  : isLocked && option.isCorrect 
                                    ? "success.main" 
                                    : "divider",
                                backgroundColor: currentSelection === option.id 
                                  ? "primary.light" 
                                  : isLocked && option.isCorrect 
                                    ? "rgba(34,197,94,0.08)" 
                                    : "transparent",
                                borderRadius: 3,
                                px: 2.5,
                                py: 1.5,
                                mb: 1.5,
                                transition: "all 0.2s",
                                cursor: isLocked ? "not-allowed" : "pointer",
                                opacity: isLocked && currentSelection !== option.id && !option.isCorrect ? 0.5 : 1,
                                "&:hover": {
                                  borderColor: isLocked 
                                    ? (option.isCorrect ? "success.main" : "divider") 
                                    : "primary.main",
                                  backgroundColor: isLocked 
                                    ? (option.isCorrect ? "rgba(34,197,94,0.08)" : "transparent") 
                                    : currentSelection === option.id ? "primary.light" : "action.hover",
                                }
                              }}
                              onClick={() => !isLocked && handleOptionSelect(poll.id, option.id)}
                            >
                              <FormControlLabel
                                value={option.id}
                                disabled={isLocked}
                                control={<Radio size="small" />}
                                label={
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <span>{option.optionText}</span>
                                    {isLocked && option.isCorrect && (
                                      <Typography variant="caption" sx={{ color: "success.main", fontWeight: 700 }}>
                                        (Correct Choice)
                                      </Typography>
                                    )}
                                  </Box>
                                }
                                sx={{ width: "100%", m: 0 }}
                              />
                            </Box>
                          ))}
                        </RadioGroup>

                        {/* Display Correct Answer Reveal below choices */}
                        {isLocked && correctOption && (
                          <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 1, p: 1.5, borderRadius: 2, backgroundColor: "rgba(34,197,94,0.05)" }}>
                            <CheckCircleOutlineIcon sx={{ color: "success.main", fontSize: "1.1rem" }} />
                            <Typography variant="body2" sx={{ color: "success.main", fontWeight: 800 }}>
                              Correct Answer: {correctOption.optionText}
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}

                {/* Submit Action */}
                <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handlePollsAnswersSubmit}
                    disabled={isSubmitting || Object.keys(selections).length === 0}
                    startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <CheckCircleOutlineIcon />}
                    sx={{
                      borderRadius: 4,
                      textTransform: "none",
                      fontWeight: 800,
                      px: 5,
                      py: 1.5,
                      fontSize: "1.05rem",
                      boxShadow: "0 6px 20px rgba(200, 58, 21, 0.25)",
                      background: "linear-gradient(90deg, #ff8a65 0%, #c83a15 100%)",
                      "&:hover": {
                        background: "linear-gradient(90deg, #ff9e80 0%, #d84315 100%)",
                      }
                    }}
                  >
                    Submit Poll Answers
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        )}

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
                Your responses have been successfully validated and recorded in our live database rankings. Check history to compare.
              </Typography>

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
