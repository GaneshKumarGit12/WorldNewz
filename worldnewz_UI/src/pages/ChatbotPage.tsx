import React, { useState, useRef, useEffect } from "react";
import { 
  Box, Container, Typography, Paper, TextField, IconButton, Button, 
  Avatar, List, ListItem, Card, CardContent, Chip, CircularProgress, 
  Divider, Tooltip, Fade, Grid 
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import PersonIcon from "@mui/icons-material/Person";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import MicIcon from "@mui/icons-material/Mic";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";

import { SEOMeta } from "../seo/SEOMeta";
import { JSONLDBreadcrumb } from "../seo/JSONLDSchemas";
import { askChatbot } from "../api/apiClient";
import type { ChatMessageDto } from "../api/apiClient";
import { WzChatbotIcon } from "../components/common/WzChatbotIcon";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: Date;
  visualMockPrompt?: string;
  generatedImage?: string;
}

export const ChatbotPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "bot",
      text: "Hello! I am **NewsBot**, your friendly AI news assistant on WorldNewzs. 🤖\n\nAsk me anything! I can summarize breaking developments, find specific topics, show weather updates, or even provide wireframe illustrations of futuristic concepts.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat container locally
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages, loading]);

  const handleSend = (textToSend: string) => {
    if (!textToSend.trim()) return;

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
      .filter(m => m.id !== "welcome")
      .map(m => ({
        sender: m.sender,
        text: m.text
      }));

    askChatbot(textToSend, apiHistory)
      .then(res => {
        const botMsg: Message = {
          id: `msg-${Date.now()}-bot`,
          sender: "bot",
          text: res.data.reply,
          timestamp: new Date(),
          visualMockPrompt: res.data.visualMockPrompt,
          generatedImage: res.data.generatedImage
        };
        setMessages(prev => [...prev, botMsg]);
      })
      .catch(err => {
        let errorText = err.message || "Failed to communicate with NewsBot. Please try again.";
        const statusCode = (err as any).response?.status;
        if (statusCode === 429) {
          errorText = "**Rate Limit Exceeded (429)**: The Gemini API free tier rate limit was reached. If you are the administrator, you can update the **GEMINI_API_KEY** environment variable in your **Render.com dashboard** to a key with higher quota limits. Otherwise, please wait 60 seconds before sending another message.";
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
        <Typography key={i} variant="body1" sx={{ mb: 1, lineHeight: 1.6, wordBreak: "break-word" }}>
          {parts.map((part, idx) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              const boldText = part.slice(2, -2);
              return <strong key={idx} style={{ color: "#3b82f6" }}>{boldText}</strong>;
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
                    style={{ color: "#60a5fa", fontWeight: 700, textDecoration: "none", borderBottom: "1px dashed #60a5fa" }}
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
    "What categories are on WorldNewzs?",
    "Draw an image of a futuristic electric flying bike",
    "Suggest some topics to write about today"
  ];

  return (
    <main style={{ paddingBottom: "32px" }}>
      <SEOMeta 
        title="AI NewsBot Chatbot - Interactive News Assistant | WorldNewzs" 
        description="Interact with NewsBot, the intelligent AI companion on WorldNewzs. Ask questions, get summaries of categories, discover news stories, and request visual design concepts." 
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
              fontFamily: "'Outfit', 'Inter', sans-serif" 
            }}
          >
            WorldNewz AI Assistant
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Have a chat with our smart virtual assistant. Get quick summaries, insights, and category links.
        </Typography>

        <Grid container spacing={3}>
          {/* Main Chat Panel */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper 
              elevation={4} 
              sx={{ 
                height: 550, 
                display: "flex", 
                flexDirection: "column", 
                borderRadius: 4, 
                backgroundColor: "#0d1117",
                border: "1px solid rgba(255,255,255,0.08)",
                overflow: "hidden"
              }}
            >
              {/* Chat Header */}
              <Box 
                sx={{ 
                  p: 2, 
                  backgroundColor: "#161b22", 
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <WzChatbotIcon size={38} variant="tile" borderRadius={9} bg="#10172A" zColor="#C4272F" />
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "white" }}>
                      WorldNewz Assistant
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#10b981", fontWeight: 700, display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#10b981" }} /> Online
                    </Typography>
                  </Box>
                </Box>
                <AutoAwesomeIcon sx={{ color: "#3b82f6" }} />
              </Box>

              {/* Chat Message Window */}
              <Box ref={chatContainerRef} sx={{ flexGrow: 1, overflowY: "auto", p: 3, display: "flex", flexDirection: "column", gap: 2 }}>
                <List disablePadding>
                  {messages.map((msg) => {
                    const isBot = msg.sender === "bot";
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
                        <Box sx={{ display: "flex", gap: 1.5, maxWidth: "80%", alignItems: "flex-start", flexDirection: isBot ? "row" : "row-reverse" }}>
                          {isBot ? (
                            <WzChatbotIcon size={36} variant="tile" borderRadius={8} bg="#10172A" zColor="#C4272F" />
                          ) : (
                            <Avatar sx={{ backgroundColor: "#3b82f6", width: 36, height: 36 }}>
                              <PersonIcon sx={{ fontSize: 20 }} />
                            </Avatar>
                          )}
                          
                          <Box>
                            <Paper 
                              elevation={1} 
                              sx={{ 
                                p: 2, 
                                borderRadius: isBot ? "4px 16px 16px 16px" : "16px 4px 16px 16px",
                                backgroundColor: isBot ? "#161b22" : "#1d4ed8",
                                color: "white",
                                border: isBot ? "1px solid rgba(255,255,255,0.06)" : "none",
                              }}
                            >
                              {renderMessageText(msg.text)}

                              {isBot && (
                                <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
                                  <Tooltip title="Read Aloud">
                                    <IconButton 
                                      size="small" 
                                      onClick={() => handleReadAloud(msg.text)}
                                      sx={{ color: "rgba(255,255,255,0.5)", "&:hover": { color: "#60a5fa" } }}
                                    >
                                      <VolumeUpIcon fontSize="inherit" />
                                    </IconButton>
                                  </Tooltip>
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
                                    backgroundColor: "#0d1117", 
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    boxShadow: "0 4px 20px rgba(0,0,0,0.4)"
                                  }}
                                >
                                  <CardContent sx={{ p: 2.5 }}>
                                    <Box sx={{ display: "flex", gap: 1.5, mb: 1.5 }}>
                                      <PhotoLibraryIcon sx={{ color: "#3b82f6", fontSize: 24 }} />
                                      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                                        Visual Mock Layout
                                      </Typography>
                                    </Box>
                                    
                                    <Typography variant="body2" sx={{ mb: 2, fontStyle: "italic", color: "text.secondary" }}>
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
                                          backgroundColor: "#161b22",
                                          border: "1px solid rgba(255,255,255,0.1)"
                                        }}
                                      />
                                    ) : (
                                      <Box 
                                        sx={{ 
                                          height: 180, 
                                          borderRadius: 2, 
                                          border: "2px dashed rgba(255,255,255,0.1)",
                                          display: "flex",
                                          flexDirection: "column",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          gap: 1,
                                          backgroundColor: "rgba(255,255,255,0.02)"
                                        }}
                                      >
                                        <PhotoLibraryIcon sx={{ fontSize: 40, color: "rgba(255,255,255,0.15)" }} />
                                        <Typography variant="caption" sx={{ fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>
                                          Image Generation Failed
                                        </Typography>
                                        <Typography variant="caption" sx={{ px: 2, textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
                                          Cloudflare Workers AI failed to render this visual.
                                        </Typography>
                                      </Box>
                                    )}
                                  </CardContent>
                                </Card>
                              </Fade>
                            )}

                            <Typography 
                              variant="caption" 
                              color="text.secondary" 
                              sx={{ 
                                display: "block", 
                                mt: 0.5, 
                                pl: 1,
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
                    <Box sx={{ p: 1.5, borderRadius: "4px 16px 16px 16px", backgroundColor: "#161b22", border: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 0.5 }}>
                      <CircularProgress size={16} sx={{ color: "#3b82f6" }} />
                      <Typography variant="body2" sx={{ color: "text.secondary", ml: 1 }}>
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
                  backgroundColor: "#161b22", 
                  borderTop: "1px solid rgba(255,255,255,0.08)",
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
                      borderRadius: 4,
                      backgroundColor: "#0d1117",
                      "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
                      "&:hover fieldset": { borderColor: "#3b82f6" },
                    }
                  }}
                />

                <Tooltip title={isListening ? "Listening..." : "Voice Search"}>
                  <IconButton 
                    id="chatbot-voice-btn"
                    onClick={handleVoiceInput}
                    disabled={loading}
                    sx={{ 
                      p: 1.5, 
                      backgroundColor: isListening ? "#ef4444" : "rgba(255,255,255,0.05)",
                      color: isListening ? "white" : "#3b82f6",
                      "&:hover": { backgroundColor: isListening ? "#dc2626" : "rgba(255,255,255,0.08)" }
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
                    borderRadius: 4, 
                    px: 3, 
                    py: 1.5,
                    fontWeight: 700,
                    backgroundColor: "#3b82f6",
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
            <Paper elevation={3} sx={{ p: 3, borderRadius: 4, height: "100%", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
                <AutoAwesomeIcon sx={{ color: "#3b82f6" }} /> Suggested Prompts
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Click on any of the chips below to test NewsBot's capabilities.
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
                      backgroundColor: "rgba(59, 130, 246, 0.05)",
                      border: "1px solid rgba(59, 130, 246, 0.15)",
                      color: "#60a5fa",
                      "& .MuiChip-label": { display: "block", width: "100%" },
                      "&:hover": {
                        backgroundColor: "rgba(59, 130, 246, 0.1)",
                        transform: "translateY(-1px)"
                      }
                    }}
                  />
                ))}
              </Box>

              <Divider sx={{ my: 4 }} />

              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                Core Web Policies
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                NewsBot operates strictly under WorldNewzs content guidelines:
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: "flex", gap: 1 }}>
                  • <span>Safe content verification for Google AdSense separation.</span>
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "flex", gap: 1 }}>
                  • <span>Neutral, objective fact-checking reporting tone.</span>
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "flex", gap: 1 }}>
                  • <span>Clickable referral links to categories.</span>
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
