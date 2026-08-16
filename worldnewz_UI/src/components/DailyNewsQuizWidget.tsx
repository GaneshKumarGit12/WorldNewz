import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import RadioGroup from "@mui/material/RadioGroup";
import Radio from "@mui/material/Radio";
import FormControlLabel from "@mui/material/FormControlLabel";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import SchoolIcon from "@mui/icons-material/School";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

import { fetchQuizQuestions, checkQuizUserAttempt } from "../api/apiClient";
import type { QuizQuestionItem } from "../api/apiClient";

export const DailyNewsQuizWidget: React.FC = () => {
  const navigate = useNavigate();

  // User details state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [identified, setIdentified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [idError, setIdError] = useState<string | null>(null);
  const [alreadyAttempted, setAlreadyAttempted] = useState(false);

  // Quiz questions state
  const [questions, setQuestions] = useState<QuizQuestionItem[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Play state
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [answerSaved, setAnswerSaved] = useState(false);

  // Check if already logged in on mount
  useEffect(() => {
    const savedName = sessionStorage.getItem("quiz_user_name");
    const savedEmail = sessionStorage.getItem("quiz_user_email");
    if (savedName && savedEmail) {
      setName(savedName);
      setEmail(savedEmail);
      setIdentified(true);
      loadFirstQuestion();
    }
  }, []);

  const verifyAndLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIdError(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail) {
      setIdError("Name and Email are required.");
      return;
    }

    try {
      setVerifying(true);
      // Check if already attempted today
      const res = await checkQuizUserAttempt(trimmedName, trimmedEmail, new Date().getTimezoneOffset());
      
      if (res.data.exists) {
        setAlreadyAttempted(true);
        sessionStorage.setItem("quiz_user_name", trimmedName);
        sessionStorage.setItem("quiz_user_email", trimmedEmail);
        setIdentified(true);
      } else {
        sessionStorage.setItem("quiz_user_name", trimmedName);
        sessionStorage.setItem("quiz_user_email", trimmedEmail);
        setIdentified(true);
        await loadFirstQuestion();
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || "Sign in failed. Try again.";
      setIdError(msg);
    } finally {
      setVerifying(false);
    }
  };

  const loadFirstQuestion = async () => {
    try {
      setLoadingQuestions(true);
      setLoadError(null);
      const res = await fetchQuizQuestions();
      setQuestions(res.data || []);
    } catch (err) {
      console.error("Failed to load quiz question in widget", err);
      setLoadError("Could not retrieve quiz questions.");
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleOptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedOptionId(Number(event.target.value));
  };

  const saveAnswerAndContinue = () => {
    if (questions.length === 0 || selectedOptionId === null) return;

    const firstQuestion = questions[0];
    sessionStorage.setItem(
      "quiz_sidebar_first_answer",
      JSON.stringify({
        questionId: firstQuestion.id,
        optionId: selectedOptionId,
      })
    );
    setAnswerSaved(true);
  };

  const handleGoToQuiz = () => {
    navigate("/badge-quiz");
  };

  const activeQuestion = questions[0];

  return (
    <Card
      sx={{
        background: (theme) =>
          theme.palette.mode === "dark" ? "#161b22" : "#ffffff",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 4,
        boxShadow: "none",
        overflow: "hidden",
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <SchoolIcon sx={{ color: "#ff5858" }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            Daily GK Trivia Quiz
          </Typography>
        </Box>

        {/* 1. Identification Form */}
        {!identified && (
          <Box component="form" onSubmit={verifyAndLogin} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Enter name & email to play today's GK Quiz, earn coins, and rank on the leaderboard!
            </Typography>

            {idError && <Alert severity="error" sx={{ py: 0, borderRadius: 2 }}>{idError}</Alert>}

            <TextField
              id="quiz-widget-name"
              label="Full Name"
              size="small"
              autoComplete="name"
              inputProps={{ "aria-label": "Full Name" }}
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              disabled={verifying}
            />

            <TextField
              id="quiz-widget-email"
              label="Email Address"
              size="small"
              type="email"
              autoComplete="email"
              inputProps={{ "aria-label": "Email Address" }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              disabled={verifying}
            />

            <Button
              id="btn-quiz-signin"
              type="submit"
              variant="contained"
              disabled={verifying}
              sx={{
                background: "linear-gradient(135deg, #f857a6, #ff5858)",
                color: "white",
                fontWeight: "bold",
                textTransform: "none",
                borderRadius: 2,
                py: 1,
                "&:hover": {
                  filter: "brightness(1.1)",
                },
              }}
            >
              {verifying ? <CircularProgress size={20} color="inherit" /> : "Sign In & Play"}
            </Button>
          </Box>
        )}

        {/* 2. Logged In, but already attempted today */}
        {identified && alreadyAttempted && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, textAlign: "center", py: 1 }}>
            <CheckCircleOutlineIcon sx={{ fontSize: 48, color: "success.main", mx: "auto" }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Attempt Completed Today!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You've already finished today's quiz challenge. Return tomorrow to claim more coins!
            </Typography>
            <Button
              id="btn-quiz-view-leaderboard"
              variant="outlined"
              onClick={handleGoToQuiz}
              sx={{ textTransform: "none", borderRadius: 2 }}
            >
              View Leaderboard & Badges
            </Button>
          </Box>
        )}

        {/* 3. Logged In, loading questions */}
        {identified && !alreadyAttempted && loadingQuestions && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={30} />
          </Box>
        )}

        {/* 4. Logged In, failed to load questions */}
        {identified && !alreadyAttempted && !loadingQuestions && loadError && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Alert severity="warning" sx={{ borderRadius: 2 }}>{loadError}</Alert>
            <Button
              variant="contained"
              onClick={handleGoToQuiz}
              sx={{
                background: "linear-gradient(135deg, #f857a6, #ff5858)",
                textTransform: "none",
                fontWeight: "bold",
                borderRadius: 2,
              }}
            >
              Go to Quiz Page
            </Button>
          </Box>
        )}

        {/* 5. Logged In, question displayed, not answered yet */}
        {identified && !alreadyAttempted && !loadingQuestions && activeQuestion && !answerSaved && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: "primary.main", textTransform: "uppercase" }}>
              Question 1 of 10 (Direct Play)
            </Typography>

            <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
              {activeQuestion.question}
            </Typography>

            <RadioGroup value={selectedOptionId || ""} onChange={handleOptionChange}>
              {activeQuestion.options.map((opt) => (
                <FormControlLabel
                  key={opt.id}
                  value={opt.id}
                  control={<Radio size="small" />}
                  label={<Typography variant="body2" sx={{ color: "text.primary", fontSize: "0.85rem" }}>{opt.optionText}</Typography>}
                  sx={{ mb: 0.5 }}
                />
              ))}
            </RadioGroup>

            <Button
              id="btn-quiz-save-answer"
              variant="contained"
              disabled={selectedOptionId === null}
              onClick={saveAnswerAndContinue}
              sx={{
                background: "linear-gradient(135deg, #f857a6, #ff5858)",
                color: "white",
                fontWeight: "bold",
                textTransform: "none",
                borderRadius: 2,
                py: 0.75,
              }}
            >
              Save Answer
            </Button>
          </Box>
        )}

        {/* 6. Logged In, question answered and saved */}
        {identified && !alreadyAttempted && answerSaved && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, py: 1 }}>
            <Alert severity="success" sx={{ borderRadius: 2 }}>
              Answer saved successfully!
            </Alert>
            <Typography variant="body2" color="text.secondary">
              Now continue playing the remaining questions to check your score and claim your coin reward.
            </Typography>
            <Button
              id="btn-quiz-continue"
              variant="contained"
              onClick={handleGoToQuiz}
              endIcon={<ArrowForwardIcon />}
              sx={{
                background: "linear-gradient(135deg, #f857a6, #ff5858)",
                color: "white",
                fontWeight: "bold",
                textTransform: "none",
                borderRadius: 2,
                py: 1,
              }}
            >
              Continue Quiz
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
