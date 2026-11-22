import React, { useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { 
  Box, 
  TextField, 
  InputAdornment, 
  Tooltip, 
  IconButton, 
  Button, 
  Collapse, 
  Typography 
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import MicIcon from "@mui/icons-material/Mic";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import TuneIcon from "@mui/icons-material/Tune";

import { categories, getCategoryPath } from "../../utils/navigationConfig";
import { WzChatbotIcon } from "../common/WzChatbotIcon";

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onVoiceSearch: () => void;
  onCopilotSearch: () => void;
  isDark: boolean;
  hideSearchInGame: boolean;
  hideBadgesInGame: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchTerm,
  onSearchChange,
  onSearchSubmit,
  onVoiceSearch,
  onCopilotSearch,
  isDark,
  hideSearchInGame,
  hideBadgesInGame
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Persistent show/hide expansion state (Default is 'show' / true)
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("global_nav_search_expanded");
      return saved !== "false";
    } catch {
      return true;
    }
  });

  const handleToggleExpand = () => {
    setIsExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("global_nav_search_expanded", String(next));
      } catch (e) {
        console.warn("Storage write failed", e);
      }
      return next;
    });
  };

  if (location.pathname === "/games/dvcubie2026" && hideSearchInGame && hideBadgesInGame) {
    return null;
  }

  return (
    <Box
      id="collapsible-global-search-nav"
      component="section"
      aria-label="Category Navigation and Search Bar"
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 1100,
        backgroundColor: "var(--color-surface-container-low)",
        backdropFilter: "blur(16px)",
        py: isExpanded ? { xs: 1.25, sm: 1.5 } : { xs: 0.5, sm: 0.75 },
        px: 0,
        borderBottom: "1px solid var(--color-border-divider)",
        boxShadow: isExpanded 
          ? (isDark ? "0 4px 20px rgba(0,0,0,0.5)" : "0 4px 14px rgba(15,23,42,0.06)")
          : (isDark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 6px rgba(15,23,42,0.04)"),
        transition: "var(--transition-theme)",
      }}
    >
      <Box sx={{ maxWidth: "1440px", mx: "auto", px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Top Control Bar with Show/Hide Toggle */}
        <Box 
          sx={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            mb: isExpanded ? 1.2 : 0,
            gap: 1
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <TuneIcon sx={{ fontSize: 16, color: "var(--color-brand-accent)" }} />
            <Typography 
              variant="caption" 
              sx={{ 
                fontFamily: "var(--font-mono-telemetry)",
                fontWeight: 700, 
                letterSpacing: "0.08em", 
                textTransform: "uppercase",
                fontSize: "0.75rem",
                color: "var(--color-ink-primary)"
              }}
            >
              Category Navigation &amp; Search
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {!isExpanded && (
              <Typography 
                variant="caption" 
                onClick={handleToggleExpand}
                sx={{ 
                  display: { xs: "none", sm: "inline-block" },
                  cursor: "pointer", 
                  color: "var(--color-brand-accent)",
                  fontFamily: "var(--font-mono-telemetry)",
                  fontWeight: 600,
                  fontSize: "0.72rem",
                  mr: 0.5,
                  textTransform: "uppercase",
                  "&:hover": { textDecoration: "underline" }
                }}
              >
                Page content maximized
              </Typography>
            )}

            <Tooltip title={isExpanded ? "Hide Category Bar & Search (-)" : "Show Category Bar & Search (+)"}>
              <Button
                id="btn-toggle-search-nav"
                size="small"
                onClick={handleToggleExpand}
                startIcon={isExpanded ? <RemoveIcon sx={{ fontSize: 13 }} /> : <AddIcon sx={{ fontSize: 13 }} />}
                endIcon={isExpanded ? <ExpandLessIcon sx={{ fontSize: 15 }} /> : <ExpandMoreIcon sx={{ fontSize: 15 }} />}
                sx={{
                  textTransform: "uppercase",
                  fontFamily: "var(--font-mono-telemetry)",
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  letterSpacing: "0.04em",
                  py: 0.35,
                  px: 1.4,
                  borderRadius: "9999px",
                  border: "1px solid var(--color-border-divider)",
                  backgroundColor: "var(--color-surface-container)",
                  color: "var(--color-ink-secondary)",
                  boxShadow: "none",
                  transition: "all 0.18s ease-in-out",
                  "&:hover": {
                    backgroundColor: "var(--color-surface-container-high)",
                    color: "var(--color-ink-primary)",
                    borderColor: "var(--color-ink-tertiary)",
                  }
                }}
              >
                {isExpanded ? "Hide (-)" : "Show Navigation (+)"}
              </Button>
            </Tooltip>
          </Box>
        </Box>

        {/* Collapsible Content: Search Bar + Category Chips */}
        <Collapse in={isExpanded} timeout={300} unmountOnExit={false}>
          {/* Centered Pill Search Bar */}
          {!(location.pathname === "/games/dvcubie2026" && hideSearchInGame) && (
            <Box component="form" onSubmit={onSearchSubmit} sx={{ display: "flex", justifyContent: "center", mb: 1.5, mt: 0.5 }}>
              <TextField
                id="global-search-input"
                name="q"
                fullWidth
                value={searchTerm}
                onChange={onSearchChange}
                placeholder="Search wire dispatches, weather, shopping, stocks, sports… (Ctrl+K)"
                variant="outlined"
                size="small"
                autoComplete="off"
                inputProps={{ "aria-label": "Search wire dispatches, weather, shopping, stocks, sports" }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" sx={{ ml: 1, mr: 0 }}>
                      <SearchIcon sx={{ fontSize: 18, color: "var(--color-ink-tertiary)" }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end" sx={{ mr: 0.5 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Tooltip title="Voice search">
                          <IconButton id="btn-voice-search" size="small" aria-label="Voice search" onClick={onVoiceSearch} sx={{ p: 0.5, color: "var(--color-ink-secondary)" }}>
                            <MicIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                        <Button
                          id="btn-copilot-search"
                          startIcon={<WzChatbotIcon size={16} variant="tile" borderRadius={3} bg="#0f131c" zColor="#e02b20" />}
                          variant="contained"
                          size="small"
                          onClick={onCopilotSearch}
                          sx={{
                            backgroundColor: "var(--color-brand-accent)",
                            color: "#ffffff",
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                            borderRadius: "9999px",
                            boxShadow: "none",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            py: 0.4,
                            px: 1.5,
                            "&:hover": { backgroundColor: "var(--color-brand-accent-hover)" },
                          }}
                        >
                          Search
                        </Button>
                      </Box>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  maxWidth: 680,
                  backgroundColor: "var(--color-surface-container)",
                  borderRadius: "9999px",
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "9999px",
                    py: 0.35,
                    fontSize: "0.88rem",
                    color: "var(--color-ink-primary)",
                    fontFamily: "var(--font-sans-body)",
                    "& fieldset": {
                      borderColor: "var(--color-border-divider)",
                    },
                    "&:hover fieldset": {
                      borderColor: "var(--color-ink-tertiary)",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "var(--color-brand-accent)",
                    },
                  },
                }}
              />
            </Box>
          )}

          {/* Compact Category Chips Bar */}
          {!(location.pathname === "/games/dvcubie2026" && hideBadgesInGame) && (
            <Box 
              sx={{ 
                display: "flex", 
                flexWrap: { xs: "nowrap", md: "wrap" }, 
                gap: 0.8, 
                rowGap: 1.0,
                justifyContent: { xs: "flex-start", md: "center" },
                alignItems: "center",
                overflowX: "auto",
                width: "100%",
                maxWidth: "100%",
                pb: 0.5,
                scrollbarWidth: "none",
                "&::-webkit-scrollbar": { display: "none" },
              }}
            >
              {categories.map((cat) => {
                const path = getCategoryPath(cat);
                const isActive = location.pathname === path || (path === "/jobs" && location.pathname.startsWith("/jobs")) || (location.pathname === "/search" && searchParams.get("category") === cat);
                const isPlayGames = cat.toLowerCase().includes("play games");

                return (
                  <Box
                    key={cat}
                    component="button"
                    onClick={() => navigate(path)}
                    sx={{
                      textTransform: "capitalize",
                      fontSize: isPlayGames ? "0.82rem" : "0.78rem",
                      fontWeight: isPlayGames || isActive ? 700 : 500,
                      fontFamily: "var(--font-sans-body)",
                      height: 30,
                      px: isPlayGames ? 1.8 : 1.3,
                      border: isPlayGames 
                        ? "1.5px solid #22c55e"
                        : `1px solid ${isActive ? "var(--color-brand-accent)" : "var(--color-border-divider)"}`,
                      borderRadius: "9999px",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      background: isPlayGames
                        ? "linear-gradient(135deg, #181c24 0%, #1e3a8a 100%)"
                        : (isActive ? "var(--color-brand-accent)" : "var(--color-surface-container)"),
                      color: isPlayGames || isActive 
                        ? "#ffffff" 
                        : "var(--color-ink-primary)",
                      boxShadow: isActive ? "0 2px 6px rgba(224, 43, 32, 0.35)" : "none",
                      transition: "all 0.16s ease-in-out",
                      "&:hover": {
                        backgroundColor: isActive 
                          ? "var(--color-brand-accent-hover)" 
                          : "var(--color-surface-container-high)",
                        borderColor: isActive ? "var(--color-brand-accent-hover)" : "var(--color-ink-tertiary)",
                        transform: "translateY(-1px)",
                      },
                    }}
                  >
                    {cat}
                  </Box>
                );
              })}
            </Box>
          )}
        </Collapse>
      </Box>
    </Box>
  );
};
