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
import SmartToyIcon from "@mui/icons-material/SmartToy";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import TuneIcon from "@mui/icons-material/Tune";

import { categories, getCategoryPath } from "../../utils/navigationConfig";

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
    const saved = localStorage.getItem("global_nav_search_expanded");
    return saved !== "false";
  });

  const handleToggleExpand = () => {
    setIsExpanded((prev) => {
      const next = !prev;
      localStorage.setItem("global_nav_search_expanded", String(next));
      return next;
    });
  };

  if (location.pathname === "/games/dvcubie2026" && hideSearchInGame && hideBadgesInGame) {
    return null;
  }

  return (
    <Box
      id="collapsible-global-search-nav"
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 1100,
        backgroundColor: isDark ? "rgba(15, 23, 42, 0.96)" : "rgba(248, 250, 252, 0.96)",
        backdropFilter: "blur(12px)",
        py: isExpanded ? { xs: 1.25, sm: 1.5 } : { xs: 0.5, sm: 0.75 },
        px: { xs: 1.5, sm: 3 },
        borderBottom: "1px solid",
        borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)",
        boxShadow: isExpanded 
          ? "0 4px 20px rgba(0,0,0,0.12)" 
          : "0 2px 8px rgba(0,0,0,0.06)",
        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <Box sx={{ maxWidth: 1200, mx: "auto" }}>
        {/* Top Control Bar with Show/Hide Toggle */}
        <Box 
          sx={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            mb: isExpanded ? 1 : 0,
            gap: 1
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <TuneIcon sx={{ fontSize: 16, color: "#c83a15" }} />
            <Typography 
              variant="caption" 
              sx={{ 
                fontWeight: 800, 
                letterSpacing: 0.5, 
                textTransform: "uppercase",
                fontSize: "0.72rem",
                color: isDark ? "rgba(255,255,255,0.7)" : "text.secondary"
              }}
            >
              Category Navigation & Search
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
                  color: "primary.main",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  mr: 0.5,
                  "&:hover": { textDecoration: "underline" }
                }}
              >
                Page content maximized
              </Typography>
            )}

            <Tooltip title={isExpanded ? "Hide Category Bar & Search (-)" : "Show Category Bar & Search (+)"}>
              <Button
                size="small"
                onClick={handleToggleExpand}
                startIcon={isExpanded ? <RemoveIcon sx={{ fontSize: 14 }} /> : <AddIcon sx={{ fontSize: 14 }} />}
                endIcon={isExpanded ? <ExpandLessIcon sx={{ fontSize: 16 }} /> : <ExpandMoreIcon sx={{ fontSize: 16 }} />}
                sx={{
                  textTransform: "none",
                  fontWeight: 800,
                  fontSize: "0.75rem",
                  py: 0.25,
                  px: 1.25,
                  borderRadius: 4,
                  border: "1px solid",
                  borderColor: isExpanded 
                    ? (isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)")
                    : "#c83a15",
                  backgroundColor: isExpanded 
                    ? (isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)")
                    : "rgba(200, 58, 21, 0.12)",
                  color: isExpanded 
                    ? (isDark ? "#ffffff" : "#1f2937") 
                    : "#c83a15",
                  boxShadow: "none",
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    backgroundColor: isExpanded 
                      ? (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)")
                      : "#c83a15",
                    color: isExpanded ? (isDark ? "#ffffff" : "#000000") : "#ffffff",
                    borderColor: "#c83a15",
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
          {/* Compact search section */}
          {!(location.pathname === "/games/dvcubie2026" && hideSearchInGame) && (
            <Box component="form" onSubmit={onSearchSubmit} sx={{ display: "flex", justifyContent: "center", mb: 1.5, mt: 0.5 }}>
              <TextField
                fullWidth
                value={searchTerm}
                onChange={onSearchChange}
                placeholder="Search news, weather, shopping, sports…"
                variant="outlined"
                size="small"
                autoComplete="off"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" sx={{ ml: 1, mr: 0 }}>
                      <SearchIcon color="action" sx={{ fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end" sx={{ mr: 0.5 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Tooltip title="Voice search">
                          <IconButton size="small" aria-label="Voice search" onClick={onVoiceSearch} sx={{ p: 0.5 }}>
                            <MicIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                        <Button
                          startIcon={<SmartToyIcon sx={{ fontSize: 16 }} />}
                          variant="contained"
                          color="primary"
                          size="small"
                          onClick={onCopilotSearch}
                          sx={{ textTransform: "none", borderRadius: 4, boxShadow: "none", fontSize: "0.8rem", py: 0.5 }}
                        >
                          Search
                        </Button>
                      </Box>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  maxWidth: 600,
                  backgroundColor: "background.paper",
                  borderRadius: 6,
                  boxShadow: "0 4px 20px rgba(15,23,42,0.08)",
                  "& .MuiOutlinedInput-root": {
                    py: 0.75,
                    fontSize: "0.95rem",
                  },
                }}
              />
            </Box>
          )}

          {/* Compact category chips grid */}
          {!(location.pathname === "/games/dvcubie2026" && hideBadgesInGame) && (
            <Box 
              sx={{ 
                display: "flex", 
                flexWrap: { xs: "nowrap", md: "wrap" }, 
                gap: 1.0, 
                rowGap: 1.25,
                justifyContent: { xs: "flex-start", md: "center" },
                overflowX: "auto",
                width: "100%",
                maxWidth: "100%",
                pb: 0.5,
                "&::-webkit-scrollbar": { height: "4px" },
                "&::-webkit-scrollbar-track": { background: "transparent" },
                "&::-webkit-scrollbar-thumb": { background: "#ccc", borderRadius: "2px" },
              }}
            >
              {categories.map((cat) => {
                const path = getCategoryPath(cat);
                const isActive = location.pathname === path || (path === "/jobs" && location.pathname.startsWith("/jobs")) || (location.pathname === "/search" && searchParams.get("category") === cat);
                return (
                  <Box
                    key={cat}
                    component="button"
                    onClick={() => navigate(path)}
                    sx={{
                      textTransform: "capitalize",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      fontFamily: "'Outfit', 'Inter', 'Roboto', sans-serif",
                      height: 30,
                      px: 1.75,
                      border: "1px solid",
                      borderColor: isActive ? "#c83a15" : (isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.15)"),
                      borderRadius: "4px",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      backgroundColor: isActive 
                        ? "#c83a15" 
                        : (isDark ? "#161b22" : "#ffffff"),
                      color: isActive 
                        ? "#ffffff" 
                        : (isDark ? "rgba(255, 255, 255, 0.85)" : "#1f2937"),
                      boxShadow: "none",
                      transition: "all 0.15s ease-in-out",
                      "&:hover": {
                        backgroundColor: isActive 
                          ? "#d84315" 
                          : (isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)"),
                        borderColor: isActive ? "#d84315" : (isDark ? "rgba(255, 255, 255, 0.35)" : "rgba(0, 0, 0, 0.35)"),
                      },
                      "&:focus": {
                        outline: "none",
                      }
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

export default SearchBar;
