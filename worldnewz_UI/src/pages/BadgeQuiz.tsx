import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import TextField from "@mui/material/TextField";
import RadioGroup from "@mui/material/RadioGroup";
import Radio from "@mui/material/Radio";
import FormControlLabel from "@mui/material/FormControlLabel";
import LinearProgress from "@mui/material/LinearProgress";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";

import QuizIcon from "@mui/icons-material/School";
import TimerIcon from "@mui/icons-material/Timer";
import HistoryIcon from "@mui/icons-material/History";
import InfoIcon from "@mui/icons-material/Info";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import StarsIcon from "@mui/icons-material/Stars";

import { fetchQuizQuestions, submitQuizAnswers, checkQuizUserAttempt } from "../api/apiClient";
import type { QuizQuestionItem } from "../api/apiClient";
import { SEOMeta } from "../seo/SEOMeta";
import { JSONLDBreadcrumb } from "../seo/JSONLDSchemas";
import { useKeywords } from "../seo/useKeywords";

const TIMER_DURATION = 15; // 15 seconds per question

const BadgeQuiz: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isDark = theme.palette.mode === "dark";

  // Identification State
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [identified, setIdentified] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [idError, setIdError] = useState<string | null>(null);

  // Quiz State
  const [questions, setQuestions] = useState<QuizQuestionItem[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selections, setSelections] = useState<{ [key: number]: number }>({});
  const [answeredQuestions, setAnsweredQuestions] = useState<{ [key: number]: boolean }>({});
  const [isTimedOutState, setIsTimedOutState] = useState<{ [key: number]: boolean }>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Timer State
  const [timeLeft, setTimeLeft] = useState<number>(TIMER_DURATION);
  const timerIntervalRef = useRef<any | null>(null);

  // Results Popup State
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [popupData, setPopupData] = useState<{ score: number; total: number; percentage: number; coins: number; status: string } | null>(null);
  const [duplicateError, setDuplicateError] = useState<boolean>(false);

  // Autologin on mount if identity is in sessionStorage
  useEffect(() => {
    const savedName = sessionStorage.getItem("quiz_user_name");
    const savedEmail = sessionStorage.getItem("quiz_user_email");
    if (savedName && savedEmail) {
      setName(savedName);
      setEmail(savedEmail);
      setIdentified(true);
      loadQuestions();
    }
  }, []);

  // Timer logic
  useEffect(() => {
    if (identified && questions.length > 0 && currentQuestionIndex < questions.length) {
      const questionId = questions[currentQuestionIndex].id;
      
      // If the current question is not yet answered or timed out, start timer
      if (!answeredQuestions[questionId] && !isTimedOutState[questionId]) {
        setTimeLeft(TIMER_DURATION);

        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
        }

        timerIntervalRef.current = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
              
              // Mark as timed out
              setAnsweredQuestions((prevAns) => ({ ...prevAns, [questionId]: true }));
              setIsTimedOutState((prevTimeOut) => ({ ...prevTimeOut, [questionId]: true }));
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
  }, [currentQuestionIndex, identified, questions, answeredQuestions, isTimedOutState]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchQuizQuestions();
      setQuestions(response.data);
      setSelections({});
      setAnsweredQuestions({});
      setIsTimedOutState({});
      setCurrentQuestionIndex(0);
    } catch (err: any) {
      setError("Failed to load quiz questions. Please try again later.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleIdentificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIdError(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail) {
      setIdError("Both Full Name and Email Address are required.");
      return;
    }

    try {
      setLoading(true);
      // Check if user has already attempted today
      const response = await checkQuizUserAttempt(trimmedName, trimmedEmail, new Date().getTimezoneOffset());
      
      if (response.data.exists) {
        setDuplicateError(true);
        setPopupData({
          score: response.data.score || 0,
          total: 10,
          percentage: response.data.percentage || 0,
          coins: response.data.coins || 0,
          status: response.data.scoreStatus || "Red"
        });
        setShowPopup(true);
      } else {
        sessionStorage.setItem("quiz_user_name", trimmedName);
        sessionStorage.setItem("quiz_user_email", trimmedEmail);
        setIdentified(true);
        await loadQuestions();
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error || "Verification failed. Please try again.";
      setIdError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (questionId: number, optionId: number) => {
    if (answeredQuestions[questionId] || isTimedOutState[questionId]) return;

    setSelections((prev) => ({
      ...prev,
      [questionId]: optionId
    }));
    
    setAnsweredQuestions((prev) => ({
      ...prev,
      [questionId]: true
    }));

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handleQuizSubmit = async () => {
    const answersList = questions.map((q) => ({
      questionId: q.id,
      optionId: selections[q.id] || 0
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

      const response = await submitQuizAnswers(payload);

      if (response.data.status === "success") {
        setPopupData({
          score: response.data.score,
          total: response.data.total,
          percentage: response.data.percentage,
          coins: response.data.coins,
          status: response.data.scoreStatus
        });
        setShowPopup(true);

        sessionStorage.removeItem("quiz_user_name");
        sessionStorage.removeItem("quiz_user_email");
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error || "Failed to submit quiz answers. Please try again.";
      setError(errMsg);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("quiz_user_name");
    sessionStorage.removeItem("quiz_user_email");
    setName("");
    setEmail("");
    setIdentified(false);
    setQuestions([]);
    setSelections({});
    setAnsweredQuestions({});
    setIsTimedOutState({});
    setCurrentQuestionIndex(0);
    setDuplicateError(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  };

  const handlePopupClose = () => {
    setShowPopup(false);
    setDuplicateError(false);
    navigate("/quiz-history");
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "Green":
        return {
          color: "#f59e0b", // Gold coin theme
          label: "Grandmaster (60-100%)",
          emoji: "👑",
          animation: "pulse-green"
        };
      case "Orange":
        return {
          color: "#3b82f6", // Blue scholar theme
          label: "Scholar (30-60%)",
          emoji: "🧠",
          animation: "pulse-orange"
        };
      case "Red":
      default:
        return {
          color: "#ef4444",
          label: "Beginner (0-30%)",
          emoji: "📚",
          animation: "pulse-red"
        };
    }
  };

  const dynamicKeywordsData = useKeywords("badge-quiz");
  const defaultKeywords = ["general knowledge quiz", "gk test", "earn gold coins", "quiz game online", "trivia quiz with badges", "knowledge booster"];
  const combinedKeywords = dynamicKeywordsData
    ? [...new Set([...defaultKeywords, ...dynamicKeywordsData.primary, ...dynamicKeywordsData.longtail, ...dynamicKeywordsData.trending])]
    : defaultKeywords;
  const descriptionToUse = dynamicKeywordsData?.metaDesc || "Test your general knowledge with our interactive Badge Quiz. Answer 10 GK questions, earn gold coins, and rise on the community leaderboard.";

  return (
    <>
      <SEOMeta
        title="General Knowledge Badge Quiz | WorldNewzs"
        description={descriptionToUse}
        keywords={combinedKeywords}
        canonical="https://worldnewzs.in/badge-quiz"
      />
      <JSONLDBreadcrumb
        crumbs={[
          { name: "Home", url: "https://worldnewzs.in" },
          { name: "GK Badge Quiz", url: "https://worldnewzs.in/badge-quiz" },
        ]}
      />

      <style>{`
        @keyframes pulse-green {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7); }
          70% { transform: scale(1.15); box-shadow: 0 0 0 10px rgba(245, 158, 11, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
        }
        @keyframes pulse-orange {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
          70% { transform: scale(1.15); box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
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
            <QuizIcon sx={{ fontSize: 40, color: "warning.main" }} />
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 900 }}>
                GK Badge Quiz
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Answer 10 randomized GK questions, earn Gold Coins, and win badges!
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              component={Link}
              to="/quiz-history"
              variant="outlined"
              color="warning"
              startIcon={<HistoryIcon />}
              sx={{ textTransform: "none", borderRadius: 3, fontWeight: 700 }}
            >
              View Leaderboard & Coins
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

        {/* Verification / Identification Form */}
        {!identified && !loading && (
          <Card 
            elevation={0}
            sx={{ 
              borderRadius: 4, 
              border: "1px solid",
              borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
              background: isDark 
                ? "linear-gradient(135deg, #1e2530 0%, #161b22 100%)" 
                : "linear-gradient(135deg, #fffcf5 0%, #ffffff 100%)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.06)"
            }}
          >
            <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
              <Box sx={{ textAlign: "center", mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                  Enter Player Details
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Please identify yourself to log your score and gold coins. Only one attempt is allowed per day.
                </Typography>
              </Box>

              {idError && (
                <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
                  {idError}
                </Alert>
              )}

              <Box component="form" onSubmit={handleIdentificationSubmit} sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <TextField
                  label="Your Player Name"
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
                    background: "linear-gradient(90deg, #ffb300 0%, #ff8f00 100%)",
                    color: "white",
                    "&:hover": {
                      background: "linear-gradient(90deg, #ffc107 0%, #ffa000 100%)",
                    }
                  }}
                >
                  Start Badge Quiz
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Loading Spinner */}
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress size={50} color="warning" />
          </Box>
        )}

        {/* Questions list (One-by-one flow) */}
        {identified && !loading && questions.length > 0 && (
          <Box>
            {/* Identity chip */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3, p: 2, borderRadius: 3, border: "1px solid", borderColor: "divider", backgroundColor: "action.hover" }}>
              <InfoIcon color="warning" fontSize="small" />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Playing as: <Box component="span" sx={{ color: "warning.main" }}>{name} ({email})</Box>
              </Typography>
            </Box>

            {/* Progress Bar */}
            <Box sx={{ mb: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                Question {currentQuestionIndex + 1} of {questions.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Progress: {Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={((currentQuestionIndex + 1) / questions.length) * 100}
              color="warning"
              sx={{ height: 6, borderRadius: 3, mb: 4 }}
            />

            {(() => {
              const question = questions[currentQuestionIndex];
              const isTimedOut = isTimedOutState[question.id] === true;
              const isAnswered = answeredQuestions[question.id] === true;
              const isLocked = isTimedOut || isAnswered;
              const currentSelection = selections[question.id];

              return (
                <Card
                  sx={{
                    borderRadius: 4,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                    border: "1px solid",
                    borderColor: isLocked ? (isTimedOut ? "error.light" : "warning.light") : "divider",
                    transition: "all 0.3s ease"
                  }}
                >
                  {/* Card Header */}
                  <Box sx={{ 
                    p: 3, 
                    backgroundColor: isLocked ? (isTimedOut ? "rgba(239,68,68,0.03)" : "rgba(255,179,0,0.03)") : "action.hover", 
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
                        {question.question}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                        {question.description}
                      </Typography>
                    </Box>

                    {/* Countdown Timer */}
                    <Box sx={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: 1, 
                      px: 2, 
                      py: 0.75, 
                      borderRadius: 3, 
                      backgroundColor: isLocked 
                        ? (isTimedOut ? "error.main" : "warning.main") 
                        : timeLeft < 6 ? "error.main" : "warning.main",
                      color: "white",
                      fontWeight: 800,
                      fontSize: "0.85rem",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                      transition: "background-color 0.3s"
                    }}>
                      <TimerIcon fontSize="small" />
                      <span>{isTimedOut ? "Timed Out" : isAnswered ? "Completed" : `${timeLeft}s`}</span>
                    </Box>
                  </Box>

                  {/* Countdown Progress */}
                  {!isLocked && (
                    <LinearProgress 
                      variant="determinate" 
                      value={(timeLeft / TIMER_DURATION) * 100}
                      color={timeLeft < 6 ? "error" : "warning"}
                      sx={{ 
                        height: 4, 
                        backgroundColor: "rgba(0,0,0,0.03)",
                        "& .MuiLinearProgress-bar": {
                          transition: "transform 1s linear"
                        }
                      }}
                    />
                  )}

                  {/* Options List */}
                  <CardContent sx={{ p: 4 }}>
                    <RadioGroup
                      value={currentSelection || ""}
                      onChange={(e) => handleOptionSelect(question.id, parseInt(e.target.value))}
                    >
                      {question.options.map((option) => {
                        const isSelected = currentSelection === option.id;

                        let borderColor = "divider";
                        let backgroundColor = "transparent";

                        if (isSelected) {
                          borderColor = "warning.main";
                          backgroundColor = isDark ? "rgba(255,179,0,0.08)" : "rgba(255,179,0,0.04)";
                        }

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
                              "&:hover": {
                                borderColor: isLocked ? borderColor : "warning.main",
                                backgroundColor: isLocked ? backgroundColor : "action.hover",
                              }
                            }}
                            onClick={() => !isLocked && handleOptionSelect(question.id, option.id)}
                          >
                            <FormControlLabel
                              value={option.id}
                              disabled={isLocked}
                              control={<Radio size="small" color="warning" />}
                              label={
                                <Typography sx={{ fontWeight: 600 }}>{option.optionText}</Typography>
                              }
                              sx={{ width: "100%", m: 0 }}
                            />
                          </Box>
                        );
                      })}
                    </RadioGroup>

                    {/* Navigation Actions */}
                    {isLocked && (
                      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 4 }}>
                        {currentQuestionIndex < questions.length - 1 ? (
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
                              color: "white",
                              background: "linear-gradient(90deg, #ffb300 0%, #ff8f00 100%)",
                              "&:hover": {
                                background: "linear-gradient(90deg, #ffc107 0%, #ffa000 100%)",
                              }
                            }}
                          >
                            Next Question
                          </Button>
                        ) : (
                          <Button
                            variant="contained"
                            size="large"
                            onClick={handleQuizSubmit}
                            disabled={isSubmitting}
                            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <CheckCircleOutlineIcon />}
                            sx={{
                              borderRadius: 3,
                              textTransform: "none",
                              fontWeight: 800,
                              px: 5,
                              py: 1.25,
                              color: "white",
                              background: "linear-gradient(90deg, #ffb300 0%, #ff8f00 100%)",
                              "&:hover": {
                                background: "linear-gradient(90deg, #ffc107 0%, #ffa000 100%)",
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

        {/* Results Popup Dialog */}
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
                    Already Attempted
                  </Typography>
                  
                  <Typography variant="body1" sx={{ fontWeight: 700, color: "warning.main", px: 2, mb: 3 }}>
                    You have already completed today's quiz. Your score: {popupData.score}/10 ({popupData.percentage}%) earning {popupData.coins} Gold Coins.
                  </Typography>
                </>
              ) : (
                <>
                  {/* Status Badges */}
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
                    {popupData.score} / {popupData.total} Score
                  </Typography>
                  
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: getStatusConfig(popupData.status).color, mb: 2 }}>
                    {getStatusConfig(popupData.status).label}
                  </Typography>

                  <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 1, my: 3, p: 2, borderRadius: 3, backgroundColor: "rgba(255,179,0,0.1)", border: "1px solid rgba(255,179,0,0.2)" }}>
                    <StarsIcon sx={{ color: "warning.main", fontSize: 30 }} />
                    <Typography variant="h5" sx={{ fontWeight: 900, color: "warning.main" }}>
                      +{popupData.coins} Gold Coins
                    </Typography>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ px: 2, mb: 3 }}>
                    Your GK Quiz performance has been validated and recorded. Check the coin leaderboard to see your rank.
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
                    color: "white",
                    background: "linear-gradient(90deg, #ffb300 0%, #ff8f00 100%)",
                    "&:hover": {
                      background: "linear-gradient(90deg, #ffc107 0%, #ffa000 100%)",
                    }
                  }}
                >
                  OK - Go to Leaderboard
                </Button>
              </DialogActions>
            </DialogContent>
          )}
        </Dialog>
      </Container>
    </>
  );
};

export default BadgeQuiz;
