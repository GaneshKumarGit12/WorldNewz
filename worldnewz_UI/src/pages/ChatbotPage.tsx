import React, { useState, useRef, useEffect } from "react";
import { 
  Box, Container, Typography, Paper, TextField, IconButton, Button, 
  Avatar, List, ListItem, Card, CardContent, Chip, CircularProgress, 
  Divider, Tooltip, Fade, Grid, Menu, MenuItem, ListItemIcon, ListItemText
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import PersonIcon from "@mui/icons-material/Person";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import MicIcon from "@mui/icons-material/Mic";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import SmartToyIcon from "@mui/icons-material/SmartToy";

import { useColorMode } from "../context/ThemeContext";
import { SEOMeta } from "../seo/SEOMeta";
import { JSONLDBreadcrumb } from "../seo/JSONLDSchemas";
import { askChatbot, fetchChatbotModels } from "../api/apiClient";
import type { ChatMessageDto, ChatbotModelOption } from "../api/apiClient";
import { WzChatbotIcon } from "../components/common/WzChatbotIcon";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: Date;
  modelUsed?: string;
  visualMockPrompt?: string;
  generatedImage?: string;
}

const DEFAULT_MODELS: ChatbotModelOption[] = [
  {
    id: "auto",
    name: "Auto (Smart Free Fallback)",
    provider: "Multi-Model",
    description: "Automatically routes across top free models with instant fallback",
    badge: "Recommended",
    isFree: true,
    isDefault: true,
  },
  {
    id: "openrouter/free",
    name: "OpenRouter Free Router",
    provider: "OpenRouter",
    description: "Dynamic community-backed free routing endpoint",
    badge: "Auto Fast",
    isFree: true,
  },
  {
    id: "minimax/minimax-m2.7:free",
    name: "MiniMax M2.7",
    provider: "MiniMax",
    description: "Advanced reasoning, long-form synthesis and news comprehension",
    badge: "Smart Reasoning",
    isFree: true,
  },
  {
    id: "nvidia/nemotron-3-super-120b-a12b:free",
    name: "NVIDIA Nemotron 3 Super 120B",
    provider: "NVIDIA",
    description: "Flagship 120B parameter model with nuanced understanding",
    badge: "Flagship 120B",
    isFree: true,
  },
  {
    id: "google/gemma-4-31b-it:free",
    name: "Google Gemma 4 31B",
    provider: "Google",
    description: "Latest Google Gemma open weights model for informative responses",
    badge: "Google Gemma",
    isFree: true,
  },
  {
    id: "z-ai/glm-5.2:free",
    name: "Z.ai GLM 5.2",
    provider: "Z.ai",
    description: "Compact, low-latency, and precise conversational responses",
    badge: "Fast",
    isFree: true,
  },
];

export const ChatbotPage: React.FC = () => {
  const { mode } = useColorMode();
  const isDark = mode === "dark";

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "bot",
      text: "Hello! I am **WorldNewz Assistant**, your intelligent AI companion on WorldNewzs. 🤖\n\nAsk me anything! I can summarize breaking developments, find specific topics, compare news facts, or illustrate futuristic concepts.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Model Selection
  const [models, setModels] = useState<ChatbotModelOption[]>(DEFAULT_MODELS);
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    return localStorage.getItem("worldnewz_selected_llm_model") || "auto";
  });
  const [modelMenuAnchor, setModelMenuAnchor] = useState<null | HTMLElement>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Fetch available models
  useEffect(() => {
    fetchChatbotModels()
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setModels(res.data);
        }
      })
      .catch((err) => {
        console.warn("Failed to fetch models from API, using default list:", err);
      });
  }, []);

  // Auto-scroll to bottom of chat container locally
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages, loading]);

  const handleSelectModel = (modelId: string) => {
    setSelectedModel(modelId);
    localStorage.setItem("worldnewz_selected_llm_model", modelId);
    setModelMenuAnchor(null);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: "bot",
        text: "Hello! I am **WorldNewz Assistant**, your intelligent AI companion on WorldNewzs. 🤖\n\nAsk me anything! I can summarize breaking developments, find specific topics, compare news facts, or illustrate futuristic concepts.",
        timestamp: new Date()
      }
    ]);
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleSend = (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}-user`,
      sender: "user",
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Convert message history to API format
    const apiHistory: ChatMessageDto[] = messages
      .filter(m => !m.id.startsWith("welcome"))
      .map(m => ({
        sender: m.sender,
        text: m.text
      }));

    const modelParam = selectedModel === "auto" ? undefined : selectedModel;

    askChatbot(textToSend, apiHistory, "news", modelParam)
      .then(res => {
        const botMsg: Message = {
          id: `msg-${Date.now()}-bot`,
          sender: "bot",
          text: res.data.reply,
          timestamp: new Date(),
          modelUsed: res.data.modelUsed,
          visualMockPrompt: res.data.visualMockPrompt,
          generatedImage: res.data.generatedImage
        };
        setMessages(prev => [...prev, botMsg]);
      })
      .catch(err => {
        let errorText = err.message || "Failed to communicate with WorldNewz Assistant. Please try again.";
        const statusCode = (err as any).response?.status;
        if (statusCode === 429) {
          errorText = "**Rate Limit Exceeded (429)**: The free tier rate limit was reached. Please wait 30 seconds before sending another message.";
        }
        const errMsg: Message = {
          id: `msg-${Date.now()}-err`,
          sender: "bot",
          text: `⚠️ **System Error**: ${errorText}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errMsg]);
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

  const handleSuggestion = (prompt: string) => {
    handleSend(prompt);
  };

  // Simple Markdown inline parser to format paragraphs, bolding, and links
  const renderMessageText = (text: string) => {
    return text.split("\n\n").map((para, i) => {
      // Split by bold patterns **text**
      const parts = para.split(/(\*\*.*?\*\*)/g);
      
      return (
        <Typography key={i} variant="body1" sx={{ mb: 1, lineHeight: 1.6, wordBreak: "break-word", fontSize: "0.95rem" }}>
          {parts.map((part, idx) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              const boldText = part.slice(2, -2);
              return <strong key={idx} style={{ color: isDark ? "#60a5fa" : "#2563eb", fontWeight: 700 }}>{boldText}</strong>;
            }

            // Split by markdown link pattern [label](url)
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
                      color: isDark ? "#93c5fd" : "#1d4ed8", 
                      fontWeight: 700, 
                      textDecoration: "none", 
                      borderBottom: isDark ? "1px dashed #93c5fd" : "1px dashed #1d4ed8" 
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

  // Voice Speech Recognition
  const handleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  // Text-To-Speech response reader
  const handleReadAloud = (text: string) => {
    if (!("speechSynthesis" in window)) {
      alert("Speech synthesis is not supported in this browser.");
      return;
    }
    // Cancel existing synthesis
    window.speechSynthesis.cancel();
    // Clean markdown tokens for clear speech
    const cleanText = text.replace(/\*\*|\[|\]\(.*?\)/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    window.speechSynthesis.speak(utterance);
  };

  const suggestions = [
    "Summarize latest Technology news",
    "What are top global business headlines today?",
    "Draw an image of a futuristic electric flying car",
    "Suggest interesting topics to write about today"
  ];

  const currentModelObj = models.find((m) => m.id === selectedModel) || models[0];

  return (
    <main style={{ paddingBottom: "32px" }}>
      <SEOMeta 
        title="AI Assistant Chatbot - Interactive News Assistant | WorldNewzs" 
        description="Interact with WorldNewz Assistant, the intelligent AI companion on WorldNewzs. Ask questions, get summaries of categories, discover news stories, and request visual design concepts." 
        keywords={["chatbot", "ai assistant", "newsbot", "gemini news bot", "interactive ai news", "worldnewzs bot"]} 
        canonical="https://worldnewzs.in/chatbot" 
      />
      <JSONLDBreadcrumb crumbs={[
        { name: "Home", url: "https://worldnewzs.in" },
        { name: "Chatbot", url: "https://worldnewzs.in/chatbot" }
      ]} />

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
          <WzChatbotIcon size={42} variant="tile" borderRadius={10} bg="#10172A" zColor="#C4272F" />
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              fontWeight: 900, 
              letterSpacing: -0.5, 
              color: isDark ? "#f8fafc" : "#0f172a",
              fontFamily: "'Outfit', 'Inter', sans-serif" 
            }}
          >
            WorldNewz AI Assistant
          </Typography>
        </Box>
        <Typography variant="body1" sx={{ color: isDark ? "#94a3b8" : "#475569", mb: 4 }}>
          Have a chat with our smart AI assistant powered by multi-model intelligence. Get quick summaries, insights, and category links.
        </Typography>

        <Grid container spacing={3}>
          {/* Main Chat Panel */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper 
              elevation={4} 
              sx={{ 
                height: 580, 
                display: "flex", 
                flexDirection: "column", 
                borderRadius: 4, 
                backgroundColor: isDark ? "#0d1117" : "#ffffff",
                border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #cbd5e1",
                boxShadow: isDark ? "0 10px 30px rgba(0,0,0,0.5)" : "0 10px 30px rgba(15,23,42,0.08)",
                overflow: "hidden"
              }}
            >
              {/* Chat Header */}
              <Box 
                sx={{ 
                  p: 2, 
                  backgroundColor: isDark ? "#161b22" : "#f8fafc", 
                  borderBottom: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <WzChatbotIcon size={38} variant="tile" borderRadius={9} bg="#10172A" zColor="#C4272F" />
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: isDark ? "#f8fafc" : "#0f172a" }}>
                      WorldNewz Assistant
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#10b981", fontWeight: 700, display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#10b981" }} /> Online & Ready
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {/* Model Selector Button */}
                  <Button
                    size="small"
                    onClick={(e) => setModelMenuAnchor(e.currentTarget)}
                    endIcon={<KeyboardArrowDownIcon sx={{ fontSize: 16 }} />}
                    startIcon={<AutoAwesomeIcon sx={{ fontSize: 16, color: "#3b82f6" }} />}
                    sx={{
                      py: 0.5,
                      px: 1.2,
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      textTransform: "none",
                      borderRadius: 2.5,
                      color: isDark ? "#f8fafc" : "#0f172a",
                      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#ffffff",
                      border: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid #cbd5e1",
                      "&:hover": {
                        backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#f1f5f9",
                        borderColor: "#3b82f6",
                      },
                    }}
                  >
                    {currentModelObj?.name || "Auto Fallback"}
                  </Button>

                  <Tooltip title="Clear chat history">
                    <IconButton
                      size="small"
                      onClick={handleClearChat}
                      sx={{
                        color: isDark ? "rgba(255,255,255,0.6)" : "rgba(15,23,42,0.6)",
                        "&:hover": { color: "#ef4444" },
                      }}
                    >
                      <RestartAltIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              {/* Model Dropdown Menu */}
              <Menu
                anchorEl={modelMenuAnchor}
                open={Boolean(modelMenuAnchor)}
                onClose={() => setModelMenuAnchor(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                PaperProps={{
                  sx: {
                    width: 340,
                    maxHeight: 400,
                    borderRadius: 3,
                    backgroundColor: isDark ? "#161b22" : "#ffffff",
                    border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0",
                    boxShadow: isDark ? "0 10px 30px rgba(0,0,0,0.7)" : "0 10px 30px rgba(15,23,42,0.15)",
                  },
                }}
              >
                <Box sx={{ px: 2, py: 1.2, borderBottom: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #f1f5f9" }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isDark ? "#f8fafc" : "#0f172a" }}>
                    Select AI Engine
                  </Typography>
                  <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                    Choose specific model or smart multi-model fallback
                  </Typography>
                </Box>
                {models.map((m) => {
                  const isSelected = m.id === selectedModel;
                  return (
                    <MenuItem
                      key={m.id}
                      onClick={() => handleSelectModel(m.id)}
                      selected={isSelected}
                      sx={{
                        py: 1.2,
                        px: 2,
                        "&.Mui-selected": {
                          backgroundColor: "rgba(59, 130, 246, 0.15)",
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 28, color: isSelected ? "#3b82f6" : "inherit" }}>
                        {isSelected ? <CheckIcon fontSize="small" /> : <SmartToyIcon fontSize="small" />}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: isSelected ? 800 : 600, color: isDark ? "#f8fafc" : "#0f172a" }}>
                              {m.name}
                            </Typography>
                            {m.badge && (
                              <Chip
                                label={m.badge}
                                size="small"
                                sx={{
                                  height: 18,
                                  fontSize: "0.62rem",
                                  fontWeight: 800,
                                  backgroundColor: isSelected ? "rgba(59, 130, 246, 0.25)" : (isDark ? "rgba(255,255,255,0.08)" : "#f1f5f9"),
                                  color: isSelected ? "#3b82f6" : (isDark ? "#cbd5e1" : "#475569"),
                                }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.72rem", display: "block" }}>
                            {m.description}
                          </Typography>
                        }
                      />
                    </MenuItem>
                  );
                })}
              </Menu>

              {/* Chat Message Window */}
              <Box 
                ref={chatContainerRef} 
                sx={{ 
                  flexGrow: 1, 
                  overflowY: "auto", 
                  p: 3, 
                  display: "flex", 
                  flexDirection: "column", 
                  gap: 2,
                  backgroundColor: isDark ? "#0d1117" : "#f8fafc"
                }}
              >
                <List disablePadding>
                  {messages.map((msg) => {
                    const isBot = msg.sender === "bot";
                    const isCopied = copiedId === msg.id;

                    return (
                      <ListItem 
                        key={msg.id} 
                        disablePadding 
                        sx={{ 
                          mb: 2, 
                          display: "flex", 
                          justifyContent: isBot ? "flex-start" : "flex-end" 
                        }}
                      >
                        <Box sx={{ display: "flex", gap: 1.5, maxWidth: "82%", alignItems: "flex-start", flexDirection: isBot ? "row" : "row-reverse" }}>
                          {isBot ? (
                            <WzChatbotIcon size={36} variant="tile" borderRadius={8} bg="#10172A" zColor="#C4272F" />
                          ) : (
                            <Avatar sx={{ backgroundColor: "#3b82f6", width: 36, height: 36 }}>
                              <PersonIcon sx={{ fontSize: 20 }} />
                            </Avatar>
                          )}
                          
                          <Box sx={{ width: "100%" }}>
                            <Paper 
                              elevation={1} 
                              sx={{ 
                                p: 2, 
                                borderRadius: isBot ? "4px 16px 16px 16px" : "16px 4px 16px 16px",
                                backgroundColor: isBot 
                                  ? (isDark ? "#161b22" : "#ffffff") 
                                  : "#2563eb",
                                color: isBot 
                                  ? (isDark ? "#f8fafc" : "#0f172a") 
                                  : "#ffffff",
                                border: isBot 
                                  ? (isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0") 
                                  : "none",
                                boxShadow: isBot
                                  ? (isDark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 8px rgba(15,23,42,0.05)")
                                  : "0 4px 12px rgba(37,99,235,0.35)"
                              }}
                            >
                              {renderMessageText(msg.text)}

                              {isBot && (
                                <Box 
                                  sx={{ 
                                    display: "flex", 
                                    alignItems: "center", 
                                    justifyContent: "space-between", 
                                    mt: 1, 
                                    pt: 0.8,
                                    borderTop: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #f1f5f9" 
                                  }}
                                >
                                  {msg.modelUsed ? (
                                    <Chip
                                      label={msg.modelUsed.replace(":free", "").split("/").pop()}
                                      size="small"
                                      sx={{
                                        height: 18,
                                        fontSize: "0.64rem",
                                        fontWeight: 700,
                                        backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9",
                                        color: isDark ? "#94a3b8" : "#64748b",
                                      }}
                                    />
                                  ) : (
                                    <Box />
                                  )}

                                  <Box sx={{ display: "flex", gap: 0.5 }}>
                                    <Tooltip title={isCopied ? "Copied!" : "Copy message"}>
                                      <IconButton 
                                        size="small" 
                                        onClick={() => handleCopyText(msg.id, msg.text)}
                                        sx={{ 
                                          color: isCopied ? "#10b981" : isDark ? "rgba(255,255,255,0.5)" : "rgba(15,23,42,0.5)", 
                                          "&:hover": { color: "#3b82f6" } 
                                        }}
                                      >
                                        {isCopied ? <CheckIcon sx={{ fontSize: 16 }} /> : <ContentCopyIcon sx={{ fontSize: 16 }} />}
                                      </IconButton>
                                    </Tooltip>

                                    <Tooltip title="Read Aloud">
                                      <IconButton 
                                        size="small" 
                                        onClick={() => handleReadAloud(msg.text)}
                                        sx={{ 
                                          color: isDark ? "rgba(255,255,255,0.5)" : "rgba(15,23,42,0.5)", 
                                          "&:hover": { color: "#3b82f6" } 
                                        }}
                                      >
                                        <VolumeUpIcon sx={{ fontSize: 16 }} />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                </Box>
                              )}
                            </Paper>

                            {/* Render visual mock placeholder card if requested */}
                            {isBot && msg.visualMockPrompt && (
                              <Fade in timeout={500}>
                                <Card 
                                  sx={{ 
                                    mt: 1.5, 
                                    borderRadius: 3, 
                                    backgroundColor: isDark ? "#161b22" : "#ffffff", 
                                    border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #cbd5e1",
                                    boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.4)" : "0 4px 20px rgba(15,23,42,0.06)"
                                  }}
                                >
                                  <CardContent sx={{ p: 2.5 }}>
                                    <Box sx={{ display: "flex", gap: 1.5, mb: 1.5 }}>
                                      <PhotoLibraryIcon sx={{ color: "#3b82f6", fontSize: 24 }} />
                                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: isDark ? "#f8fafc" : "#0f172a" }}>
                                        Visual Mock Layout
                                      </Typography>
                                    </Box>
                                    
                                    <Typography variant="body2" sx={{ mb: 2, fontStyle: "italic", color: isDark ? "#94a3b8" : "#64748b" }}>
                                      Prompt: "{msg.visualMockPrompt}"
                                    </Typography>

                                    {/* Mock Image Placeholder or Real Generated Image */}
                                    {msg.generatedImage ? (
                                      <Box 
                                        component="img"
                                        src={msg.generatedImage}
                                        alt={msg.visualMockPrompt}
                                        sx={{ 
                                          width: "100%", 
                                          maxHeight: 350, 
                                          borderRadius: 2, 
                                          objectFit: "contain",
                                          backgroundColor: isDark ? "#161b22" : "#f1f5f9",
                                          border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0"
                                        }}
                                      />
                                    ) : (
                                      <Box 
                                        sx={{ 
                                          height: 180, 
                                          borderRadius: 2, 
                                          border: isDark ? "2px dashed rgba(255,255,255,0.15)" : "2px dashed #cbd5e1",
                                          display: "flex",
                                          flexDirection: "column",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          gap: 1,
                                          backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc"
                                        }}
                                      >
                                        <PhotoLibraryIcon sx={{ fontSize: 40, color: isDark ? "rgba(255,255,255,0.2)" : "rgba(15,23,42,0.2)" }} />
                                        <Typography variant="caption" sx={{ fontWeight: 700, color: isDark ? "rgba(255,255,255,0.7)" : "#475569" }}>
                                          Visual Layout Wireframe
                                        </Typography>
                                        <Typography variant="caption" sx={{ px: 2, textAlign: "center", color: isDark ? "rgba(255,255,255,0.4)" : "#94a3b8" }}>
                                          Cloudflare Workers AI generated mock visual preview
                                        </Typography>
                                      </Box>
                                    )}
                                  </CardContent>
                                </Card>
                              </Fade>
                            )}

                            <Typography 
                              variant="caption" 
                              sx={{ 
                                display: "block", 
                                mt: 0.5, 
                                pl: 1,
                                color: isDark ? "rgba(255,255,255,0.4)" : "rgba(15,23,42,0.5)",
                                textAlign: isBot ? "left" : "right" 
                              }}
                            >
                              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Typography>
                          </Box>
                        </Box>
                      </ListItem>
                    );
                  })}
                </List>

                {/* Thinking animation indicator */}
                {loading && (
                  <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", pl: 1 }}>
                    <WzChatbotIcon size={36} variant="tile" borderRadius={8} bg="#10172A" zColor="#C4272F" />
                    <Box 
                      sx={{ 
                        p: 1.5, 
                        borderRadius: "4px 16px 16px 16px", 
                        backgroundColor: isDark ? "#161b22" : "#ffffff", 
                        border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0", 
                        display: "flex", 
                        alignItems: "center",
                        gap: 1 
                      }}
                    >
                      <CircularProgress size={16} sx={{ color: "#3b82f6" }} />
                      <Typography variant="body2" sx={{ color: isDark ? "#cbd5e1" : "#475569", fontWeight: 600 }}>
                        WorldNewz Assistant is thinking...
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>

              {/* Chat Input controls */}
              <Box 
                sx={{ 
                  p: 2, 
                  backgroundColor: isDark ? "#161b22" : "#ffffff", 
                  borderTop: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
                  display: "flex",
                  gap: 1.5,
                  alignItems: "center"
                }}
              >
                <TextField
                  id="chatbot-message-input"
                  fullWidth
                  variant="outlined"
                  placeholder="Type your question here (e.g. summarize tech news)..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 3.5,
                      backgroundColor: isDark ? "#0d1117" : "#ffffff",
                      "& fieldset": { borderColor: isDark ? "rgba(255,255,255,0.15)" : "#cbd5e1" },
                      "&:hover fieldset": { borderColor: "#3b82f6" },
                      "&.Mui-focused fieldset": { borderColor: "#3b82f6", borderWidth: "1.5px" },
                    },
                    "& .MuiInputBase-input": {
                      color: isDark ? "#f8fafc" : "#0f172a !important",
                      "-webkit-text-fill-color": isDark ? "#f8fafc" : "#0f172a",
                      "&::placeholder": {
                        color: isDark ? "rgba(248, 250, 252, 0.6) !important" : "rgba(15, 23, 42, 0.6) !important",
                        opacity: 1,
                        "-webkit-text-fill-color": isDark ? "rgba(248, 250, 252, 0.6)" : "rgba(15, 23, 42, 0.6)",
                      },
                    },
                  }}
                />

                <Tooltip title={isListening ? "Listening..." : "Voice Search"}>
                  <IconButton 
                    id="chatbot-voice-btn"
                    onClick={handleVoiceInput}
                    disabled={loading}
                    sx={{ 
                      p: 1.5, 
                      backgroundColor: isListening ? "#ef4444" : (isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9"),
                      color: isListening ? "white" : "#3b82f6",
                      "&:hover": { backgroundColor: isListening ? "#dc2626" : (isDark ? "rgba(255,255,255,0.12)" : "#e2e8f0") }
                    }}
                  >
                    <MicIcon />
                  </IconButton>
                </Tooltip>

                <Button
                  id="chatbot-send-btn"
                  variant="contained"
                  disabled={loading || !input.trim()}
                  onClick={() => handleSend(input)}
                  endIcon={<SendIcon />}
                  sx={{ 
                    borderRadius: 3.5, 
                    px: 3, 
                    py: 1.5,
                    fontWeight: 700,
                    backgroundColor: "#3b82f6",
                    color: "#ffffff",
                    boxShadow: "0 4px 12px rgba(59,130,246,0.35)",
                    "&:hover": { backgroundColor: "#2563eb" }
                  }}
                >
                  Send
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Quick-Help sidebar */}
          <Grid size={{ xs: 12, md: 4 }} component="aside" aria-label="Suggested Prompts">
            <Paper 
              elevation={3} 
              sx={{ 
                p: 3, 
                borderRadius: 4, 
                height: "100%", 
                backgroundColor: isDark ? "#0d1117" : "#ffffff",
                border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #cbd5e1",
                boxShadow: isDark ? "0 10px 30px rgba(0,0,0,0.5)" : "0 10px 30px rgba(15,23,42,0.08)"
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, display: "flex", alignItems: "center", gap: 1, color: isDark ? "#f8fafc" : "#0f172a" }}>
                <AutoAwesomeIcon sx={{ color: "#3b82f6" }} /> Suggested Prompts
              </Typography>
              <Typography variant="body2" sx={{ color: isDark ? "#94a3b8" : "#64748b", mb: 3 }}>
                Click on any of the chips below to test WorldNewz Assistant capabilities.
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {suggestions.map((item, idx) => (
                  <Chip
                    key={idx}
                    id={`suggested-prompt-chip-${idx}`}
                    label={item}
                    onClick={() => handleSuggestion(item)}
                    clickable
                    sx={{
                      p: 2.5,
                      borderRadius: 3,
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      justifyContent: "flex-start",
                      textAlign: "left",
                      height: "auto",
                      whiteSpace: "normal",
                      backgroundColor: isDark ? "rgba(59, 130, 246, 0.08)" : "rgba(59, 130, 246, 0.06)",
                      border: isDark ? "1px solid rgba(59, 130, 246, 0.25)" : "1px solid rgba(59, 130, 246, 0.2)",
                      color: isDark ? "#93c5fd" : "#2563eb",
                      "& .MuiChip-label": { display: "block", width: "100%" },
                      "&:hover": {
                        backgroundColor: isDark ? "rgba(59, 130, 246, 0.18)" : "rgba(59, 130, 246, 0.12)",
                        transform: "translateY(-1px)"
                      }
                    }}
                  />
                ))}
              </Box>

              <Divider sx={{ my: 3.5, borderColor: isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0" }} />

              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: isDark ? "#f8fafc" : "#0f172a" }}>
                Core Web Policies
              </Typography>
              <Typography variant="caption" sx={{ display: "block", mb: 1, color: isDark ? "#94a3b8" : "#64748b" }}>
                WorldNewz Assistant operates under strict content guidelines:
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Typography variant="caption" sx={{ display: "flex", gap: 1, color: isDark ? "#94a3b8" : "#64748b" }}>
                  • <span>Safe content verification for Google AdSense separation.</span>
                </Typography>
                <Typography variant="caption" sx={{ display: "flex", gap: 1, color: isDark ? "#94a3b8" : "#64748b" }}>
                  • <span>Neutral, objective fact-checking reporting tone.</span>
                </Typography>
                <Typography variant="caption" sx={{ display: "flex", gap: 1, color: isDark ? "#94a3b8" : "#64748b" }}>
                  • <span>Clickable referral links to categories and sources.</span>
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </main>
  );
};

export default ChatbotPage;
