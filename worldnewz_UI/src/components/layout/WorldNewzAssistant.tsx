import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  IconButton,
  TextField,
  Button,
  Avatar,
  Chip,
  Tooltip,
  CircularProgress,
  Fade,
  Slide,
  Dialog,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import PersonIcon from "@mui/icons-material/Person";
import MicIcon from "@mui/icons-material/Mic";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import { useColorMode } from "../../context/ThemeContext";
import { askChatbot } from "../../api/apiClient";
import type { ChatMessageDto } from "../../api/apiClient";
import { WzChatbotIcon } from "../common/WzChatbotIcon";

export type AssistantContextMode = "news" | "shopping" | "ideas" | "help";

export interface AssistantMessage {
  id: string;
  sender: "user" | "bot" | "system";
  text: string;
  timestamp: string;
  visualMockPrompt?: string;
  generatedImage?: string;
}

const CONTEXT_CONFIG: Record<
  AssistantContextMode,
  {
    name: string;
    label: string;
    pill: string;
    accentColor: string;
    greeting: string;
    switchNotice: string;
    suggestions: string[];
  }
> = {
  news: {
    name: "News",
    label: "News Mode",
    pill: "📰 NEWS MODE",
    accentColor: "#E63946",
    greeting:
      "Hello! I am **WorldNewz Assistant**. I can summarize breaking developments, provide fact-checked insights, or compare news timelines.",
    switchNotice: "Switched to News mode — I can help you summarize and analyze stories here.",
    suggestions: [
      "Summarize latest Tech news",
      "What are today's top business headlines?",
      "Explain the latest sports updates",
    ],
  },
  shopping: {
    name: "Shopping",
    label: "Shopping Mode",
    pill: "🛍️ SHOPPING MODE",
    accentColor: "#F4A340",
    greeting:
      "Welcome to **Shopping Mode**! I can help you compare products, evaluate deals, highlight key pros & cons, and find top value picks.",
    switchNotice: "Switched to Shopping mode — I can help you compare picks and find top deals here.",
    suggestions: [
      "Which laptop should I buy under ₹60,000?",
      "Compare top smartphone deals today",
      "Is this Amazon product deal worth buying?",
    ],
  },
  ideas: {
    name: "Ideas",
    label: "Weekend Ideas Mode",
    pill: "💡 IDEAS MODE",
    accentColor: "#2EC4B6",
    greeting:
      "Hey there! Ready for inspiration? I can share quick weekend trip ideas, low-budget group plans, delicious recipes, and fun activities.",
    switchNotice: "Switched to Weekend Ideas mode — I can give you creative lifestyle, travel & food tips!",
    suggestions: [
      "Give me 3 low-budget weekend getaway ideas",
      "Quick dinner recipes under 20 minutes",
      "Fun group activities for 4 friends",
    ],
  },
  help: {
    name: "Help",
    label: "Site Help Mode",
    pill: "ℹ️ HELP MODE",
    accentColor: "#E63946",
    greeting:
      "How can I assist you with WorldNewzs? I can guide you through site navigation, editorial guidelines, policies, or contact details.",
    switchNotice: "Switched to Site Help mode — ask me anything about policies, navigation, or contact.",
    suggestions: [
      "Where can I find the Privacy Policy?",
      "How do I submit news or contact editors?",
      "How to access GK Quiz and Job boards?",
    ],
  },
};

const getContextFromPath = (path: string): AssistantContextMode => {
  const lowerPath = path.toLowerCase();
  if (lowerPath.includes("/shopping") || lowerPath.includes("/amazon-products") || lowerPath.includes("/deals")) {
    return "shopping";
  }
  if (
    lowerPath.includes("/lifestyle") ||
    lowerPath.includes("/food") ||
    lowerPath.includes("/travel") ||
    lowerPath.includes("/cartoons")
  ) {
    return "ideas";
  }
  if (
    lowerPath.includes("/about") ||
    lowerPath.includes("/contact") ||
    lowerPath.includes("/privacy-policy") ||
    lowerPath.includes("/terms") ||
    lowerPath.includes("/disclaimer") ||
    lowerPath.includes("/editorial-")
  ) {
    return "help";
  }
  return "news";
};

// Routes where the launcher floating widget should be hidden
const EXCLUDED_PATHS = [
  "/admin",
  "/facebook-settings",
  "/jobs/post-job",
  "/checkout",
  "/payment",
  "/login",
  "/signup",
  "/chatbot", // Hide floating overlay on dedicated chatbot page
];

export const WorldNewzAssistant: React.FC = () => {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery("(max-width:599px)");
  const { mode } = useColorMode();
  const isDark = mode === "dark";

  // Context & Open states
  const activeContext = getContextFromPath(location.pathname);
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Conversation History state initialized from sessionStorage
  const [messages, setMessages] = useState<AssistantMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem("worldnewz_assistant_history");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Failed to load assistant history from sessionStorage:", e);
    }
    const config = CONTEXT_CONFIG[activeContext];
    return [
      {
        id: "welcome-init",
        sender: "bot",
        text: config.greeting,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ];
  });

  const previousContextRef = useRef<AssistantContextMode>(activeContext);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Save history to sessionStorage on updates
  useEffect(() => {
    try {
      sessionStorage.setItem("worldnewz_assistant_history", JSON.stringify(messages));
    } catch (e) {
      console.warn("Failed to save assistant history to sessionStorage:", e);
    }
  }, [messages]);

  // Handle mid-chat context switching
  useEffect(() => {
    if (previousContextRef.current !== activeContext) {
      const newConfig = CONTEXT_CONFIG[activeContext];
      const switchMsg: AssistantMessage = {
        id: `switch-${Date.now()}`,
        sender: "system",
        text: newConfig.switchNotice,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, switchMsg]);
      previousContextRef.current = activeContext;
    }
  }, [activeContext]);

  // Handle tooltip display logic (once per session)
  useEffect(() => {
    const tooltipShown = sessionStorage.getItem("worldnewz_assistant_tooltip_shown");
    if (!tooltipShown) {
      setShowTooltip(true);
    }
  }, []);

  const handleMouseEnterTooltip = () => {
    if (!sessionStorage.getItem("worldnewz_assistant_tooltip_shown")) {
      sessionStorage.setItem("worldnewz_assistant_tooltip_shown", "true");
    }
    setShowTooltip(false);
  };

  // Auto-scroll to bottom of chat list
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, loading, isOpen]);

  // Listen for Esc key to close panel accessibility requirement
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Check if current route is excluded
  const isExcluded = EXCLUDED_PATHS.some((path) => location.pathname.toLowerCase().startsWith(path));

  if (isExcluded) {
    return null;
  }

  const activeConfig = CONTEXT_CONFIG[activeContext];

  const handleSend = (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsg: AssistantMessage = {
      id: `msg-${Date.now()}-user`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const apiHistory: ChatMessageDto[] = messages
      .filter((m) => m.sender !== "system" && !m.id.startsWith("welcome"))
      .map((m) => ({
        sender: m.sender === "user" ? "user" : "bot",
        text: m.text,
      }));

    askChatbot(textToSend, apiHistory, activeContext)
      .then((res) => {
        const botMsg: AssistantMessage = {
          id: `msg-${Date.now()}-bot`,
          sender: "bot",
          text: res.data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          visualMockPrompt: res.data.visualMockPrompt,
          generatedImage: res.data.generatedImage,
        };
        setMessages((prev) => [...prev, botMsg]);
      })
      .catch((err) => {
        let errorText = err.message || "Failed to communicate with WorldNewz Assistant. Please try again.";
        const statusCode = (err as any).response?.status;
        if (statusCode === 429) {
          errorText =
            "**Quota Limit Exceeded**: The server rate limit was reached. Please wait 30 seconds before sending another query.";
        }
        const errMsg: AssistantMessage = {
          id: `msg-${Date.now()}-err`,
          sender: "bot",
          text: `⚠️ **System Error**: ${errorText}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, errMsg]);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  // Voice speech input recognition
  const handleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  // Text-To-Speech reader
  const handleReadAloud = (text: string) => {
    if (!("speechSynthesis" in window)) {
      alert("Speech synthesis is not supported in this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/\*\*|\[|\]\(.*?\)/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    window.speechSynthesis.speak(utterance);
  };

  // Markdown inline renderer
  const renderFormattedText = (text: string) => {
    return text.split("\n\n").map((para, i) => {
      const parts = para.split(/(\*\*.*?\*\*)/g);
      return (
        <Typography
          key={i}
          variant="body2"
          sx={{
            mb: 1,
            lineHeight: 1.6,
            wordBreak: "break-word",
            fontSize: "0.9rem",
          }}
        >
          {parts.map((part, idx) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              const boldText = part.slice(2, -2);
              return (
                <strong key={idx} style={{ color: activeConfig.accentColor, fontWeight: 700 }}>
                  {boldText}
                </strong>
              );
            }

            const subParts = part.split(/(\[.*?\]\(.*?\))/g);
            return subParts.map((subPart, sIdx) => {
              const linkMatch = subPart.match(/\[(.*?)\]\((.*?)\)/);
              if (linkMatch) {
                const label = linkMatch[1];
                const url = linkMatch[2];
                return (
                  <a
                    key={sIdx}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: activeConfig.accentColor,
                      fontWeight: 700,
                      textDecoration: "none",
                      borderBottom: `1px dashed ${activeConfig.accentColor}`,
                    }}
                  >
                    {label}
                  </a>
                );
              }
              return subPart;
            });
          })}
        </Typography>
      );
    });
  };

  // Render Inner Chat Panel Content
  const renderPanelContent = () => (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: isDark ? "#0d1117" : "#ffffff",
        color: isDark ? "#f8fafc" : "#0f172a",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          backgroundColor: isDark ? "#161b22" : "#f1f5f9",
          borderBottom: `2px solid ${activeConfig.accentColor}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {isMobile && (
            <IconButton
              aria-label="Back to page"
              onClick={() => setIsOpen(false)}
              sx={{ color: isDark ? "#ffffff" : "#0f172a", minWidth: 44, minHeight: 44 }}
            >
              <ArrowBackIcon />
            </IconButton>
          )}
          <WzChatbotIcon size={38} variant="tile" borderRadius={10} bg="#10172A" zColor="#C4272F" />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
              WorldNewz Assistant
            </Typography>
            <Chip
              label={activeConfig.pill}
              size="small"
              sx={{
                height: 20,
                fontSize: "0.68rem",
                fontWeight: 800,
                mt: 0.3,
                backgroundColor: `${activeConfig.accentColor}20`,
                color: activeConfig.accentColor,
                border: `1px solid ${activeConfig.accentColor}50`,
              }}
            />
          </Box>
        </Box>

        <IconButton
          id="assistant-minimize-btn"
          aria-label="Close WorldNewz Assistant"
          onClick={() => setIsOpen(false)}
          sx={{
            color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)",
            minWidth: 44,
            minHeight: 44,
            "&:hover": { color: activeConfig.accentColor },
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Messages Stream */}
      <Box
        ref={chatContainerRef}
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          p: 2,
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          backgroundColor: isDark ? "#0d1117" : "#f8fafc",
        }}
      >
        {messages.map((msg) => {
          if (msg.sender === "system") {
            return (
              <Box
                key={msg.id}
                sx={{
                  alignSelf: "center",
                  my: 1,
                  px: 2,
                  py: 0.8,
                  borderRadius: 4,
                  backgroundColor: `${activeConfig.accentColor}15`,
                  border: `1px solid ${activeConfig.accentColor}40`,
                  textAlign: "center",
                }}
              >
                <Typography variant="caption" sx={{ color: activeConfig.accentColor, fontWeight: 700 }}>
                  💡 {msg.text}
                </Typography>
              </Box>
            );
          }

          const isBot = msg.sender === "bot";
          return (
            <Box
              key={msg.id}
              sx={{
                display: "flex",
                flexDirection: isBot ? "row" : "row-reverse",
                alignItems: "flex-start",
                gap: 1,
                mb: 1,
              }}
            >
              {isBot ? (
                <WzChatbotIcon size={32} variant="tile" borderRadius={8} bg="#10172A" zColor="#C4272F" />
              ) : (
                <Avatar
                  sx={{
                    backgroundColor: activeConfig.accentColor,
                    color: "#ffffff",
                    width: 32,
                    height: 32,
                    fontSize: 18,
                  }}
                >
                  <PersonIcon fontSize="inherit" />
                </Avatar>
              )}

              <Box sx={{ maxWidth: "82%" }}>
                <Paper
                  elevation={1}
                  sx={{
                    p: 1.8,
                    borderRadius: isBot ? "4px 16px 16px 16px" : "16px 4px 16px 16px",
                    backgroundColor: isBot
                      ? isDark
                        ? "#161b22"
                        : "#ffffff"
                      : activeConfig.accentColor,
                    color: isBot ? (isDark ? "#f1f5f9" : "#0f172a") : "#ffffff",
                    border: isBot ? (isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0") : "none",
                  }}
                >
                  {renderFormattedText(msg.text)}

                  {isBot && (
                    <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 0.5 }}>
                      <Tooltip title="Read Aloud">
                        <IconButton
                          size="small"
                          onClick={() => handleReadAloud(msg.text)}
                          sx={{
                            color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
                            minWidth: 32,
                            minHeight: 32,
                            "&:hover": { color: activeConfig.accentColor },
                          }}
                        >
                          <VolumeUpIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                </Paper>

                {/* Visual Mock requested indicator */}
                {isBot && msg.visualMockPrompt && (
                  <Fade in timeout={400}>
                    <Paper
                      elevation={2}
                      sx={{
                        mt: 1,
                        p: 1.5,
                        borderRadius: 3,
                        backgroundColor: isDark ? "#161b22" : "#ffffff",
                        border: `1px solid ${activeConfig.accentColor}40`,
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                        <PhotoLibraryIcon sx={{ color: activeConfig.accentColor, fontSize: 20 }} />
                        <Typography variant="caption" sx={{ fontWeight: 800 }}>
                          Visual Concept Requested
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontStyle: "italic", mb: 1 }}>
                        "{msg.visualMockPrompt}"
                      </Typography>
                      {msg.generatedImage ? (
                        <Box
                          component="img"
                          src={msg.generatedImage}
                          alt={msg.visualMockPrompt}
                          sx={{ width: "100%", maxHeight: 200, borderRadius: 2, objectFit: "contain" }}
                        />
                      ) : (
                        <Box
                          sx={{
                            height: 100,
                            borderRadius: 2,
                            border: "1px dashed rgba(128,128,128,0.3)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "rgba(0,0,0,0.02)",
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            Visual Layout Preview
                          </Typography>
                        </Box>
                      )}
                    </Paper>
                  </Fade>
                )}

                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    mt: 0.3,
                    px: 0.5,
                    fontSize: "0.68rem",
                    color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
                    textAlign: isBot ? "left" : "right",
                  }}
                >
                  {msg.timestamp}
                </Typography>
              </Box>
            </Box>
          );
        })}

        {/* Loading / Typing indicator */}
        {loading && (
          <Box sx={{ display: "flex", gap: 1, alignItems: "center", pl: 0.5 }}>
            <WzChatbotIcon size={32} variant="tile" borderRadius={8} bg="#10172A" zColor="#C4272F" />
            <Box
              sx={{
                p: 1.5,
                borderRadius: "4px 16px 16px 16px",
                backgroundColor: isDark ? "#161b22" : "#ffffff",
                border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <CircularProgress size={16} sx={{ color: activeConfig.accentColor }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                WorldNewz Assistant is typing...
              </Typography>
            </Box>
          </Box>
        )}
      </Box>

      {/* Suggested Prompt Chips */}
      <Box
        sx={{
          px: 2,
          py: 1,
          backgroundColor: isDark ? "#161b22" : "#f8fafc",
          borderTop: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #e2e8f0",
          display: "flex",
          gap: 1,
          overflowX: "auto",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {activeConfig.suggestions.map((prompt, idx) => (
          <Chip
            key={idx}
            id={`assistant-chip-prompt-${idx}`}
            label={prompt}
            onClick={() => handleSend(prompt)}
            clickable
            size="small"
            sx={{
              height: 28,
              fontSize: "0.75rem",
              fontWeight: 600,
              whiteSpace: "nowrap",
              backgroundColor: `${activeConfig.accentColor}15`,
              color: activeConfig.accentColor,
              border: `1px solid ${activeConfig.accentColor}30`,
              "&:hover": {
                backgroundColor: `${activeConfig.accentColor}30`,
              },
            }}
          />
        ))}
      </Box>

      {/* Composer Input Form */}
      <Box
        component="form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        sx={{
          p: 1.5,
          backgroundColor: isDark ? "#161b22" : "#ffffff",
          borderTop: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
          display: "flex",
          gap: 1,
          alignItems: "center",
        }}
      >
        <TextField
          id="worldnewz-assistant-input"
          fullWidth
          size="small"
          placeholder={`Ask Assistant (${activeConfig.name} Mode)...`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
          inputProps={{
            "aria-label": "Type message to WorldNewz Assistant",
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 3,
              backgroundColor: isDark ? "#0d1117" : "#f1f5f9",
              fontSize: "0.9rem",
              "& fieldset": { borderColor: isDark ? "rgba(255,255,255,0.1)" : "#cbd5e1" },
              "&:hover fieldset": { borderColor: activeConfig.accentColor },
              "&.Mui-focused fieldset": { borderColor: activeConfig.accentColor },
            },
          }}
        />

        <Tooltip title={isListening ? "Listening..." : "Voice Input"}>
          <IconButton
            id="assistant-voice-btn"
            aria-label="Voice input"
            onClick={handleVoiceInput}
            disabled={loading}
            sx={{
              minWidth: 44,
              minHeight: 44,
              backgroundColor: isListening ? "#ef4444" : `${activeConfig.accentColor}15`,
              color: isListening ? "white" : activeConfig.accentColor,
              "&:hover": { backgroundColor: isListening ? "#dc2626" : `${activeConfig.accentColor}30` },
            }}
          >
            <MicIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Button
          id="assistant-send-btn"
          type="submit"
          variant="contained"
          disabled={loading || !input.trim()}
          aria-label="Send message"
          sx={{
            minWidth: 44,
            height: 44,
            borderRadius: 3,
            px: 2,
            fontWeight: 700,
            backgroundColor: activeConfig.accentColor,
            color: "#ffffff",
            boxShadow: `0 4px 12px ${activeConfig.accentColor}50`,
            "&:hover": { backgroundColor: activeConfig.accentColor, filter: "brightness(0.9)" },
          }}
        >
          <SendIcon fontSize="small" />
        </Button>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Fixed Launcher Icon Button */}
      <Box
        sx={{
          position: "fixed",
          bottom: isMobile ? 16 : 26,
          right: isMobile ? 16 : 26,
          zIndex: 9990,
          display: isOpen ? "none" : "block",
        }}
      >
        <Tooltip
          title="Ask WorldNewz Assistant"
          open={showTooltip}
          onOpen={handleMouseEnterTooltip}
          arrow
          placement="left"
        >
          <Box sx={{ position: "relative" }}>
            {/* Pulsing Dot Indicator for Idle Ready State */}
            <Box
              sx={{
                position: "absolute",
                top: 2,
                right: 2,
                width: 12,
                height: 12,
                borderRadius: "50%",
                backgroundColor: "#2EC4B6",
                border: "2px solid #ffffff",
                boxShadow: "0 0 8px #2EC4B6",
                zIndex: 2,
                "@keyframes pulse-idle": {
                  "0%": { transform: "scale(0.95)", boxShadow: "0 0 0 0 rgba(46, 196, 182, 0.7)" },
                  "70%": { transform: "scale(1)", boxShadow: "0 0 0 8px rgba(46, 196, 182, 0)" },
                  "100%": { transform: "scale(0.95)", boxShadow: "0 0 0 0 rgba(46, 196, 182, 0)" },
                },
                animation: "pulse-idle 2s infinite",
              }}
            />

            <IconButton
              id="worldnewz-assistant-launcher"
              aria-label="Open WorldNewz Assistant"
              onClick={() => {
                setIsOpen(true);
                setShowTooltip(false);
                sessionStorage.setItem("worldnewz_assistant_tooltip_shown", "true");
              }}
              sx={{
                width: isMobile ? 50 : 58,
                height: isMobile ? 50 : 58,
                borderRadius: "50%",
                backgroundColor: "#10172A",
                color: "#ffffff",
                boxShadow: `0 6px 20px ${activeConfig.accentColor}70`,
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                border: `3px solid ${activeConfig.accentColor}`,
                p: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                "&:hover": {
                  transform: "scale(1.08)",
                  boxShadow: `0 8px 26px ${activeConfig.accentColor}90`,
                  backgroundColor: "#10172A",
                },
                "&:focus-visible": {
                  outline: `3px solid ${activeConfig.accentColor}`,
                  outlineOffset: 3,
                },
              }}
            >
              <WzChatbotIcon size={isMobile ? 38 : 44} variant="transparent" zColor="#C4272F" />
            </IconButton>
          </Box>
        </Tooltip>
      </Box>

      {/* Desktop / Tablet Panel Overlay */}
      {!isMobile && (
        <Slide direction="up" in={isOpen} mountOnEnter unmountOnExit>
          <Paper
            elevation={12}
            sx={{
              position: "fixed",
              bottom: 26,
              right: 26,
              width: theme.breakpoints.down("md") ? "85vw" : 400,
              height: 580,
              maxHeight: "calc(100vh - 40px)",
              zIndex: 9990,
              borderRadius: 4,
              overflow: "hidden",
              border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #cbd5e1",
              boxShadow: isDark
                ? "0 20px 50px rgba(0,0,0,0.8)"
                : "0 20px 50px rgba(15, 23, 42, 0.25)",
            }}
          >
            {renderPanelContent()}
          </Paper>
        </Slide>
      )}

      {/* Mobile Fullscreen Sheet Dialog Overlay */}
      {isMobile && (
        <Dialog
          fullScreen
          open={isOpen}
          onClose={() => setIsOpen(false)}
          TransitionComponent={Slide}
          TransitionProps={{ direction: "up" } as any}
          sx={{ zIndex: 9995 }}
        >
          {renderPanelContent()}
        </Dialog>
      )}
    </>
  );
};

export default WorldNewzAssistant;
