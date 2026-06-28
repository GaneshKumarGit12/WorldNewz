import React from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Box, TextField, InputAdornment, Tooltip, IconButton, Button } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import MicIcon from "@mui/icons-material/Mic";
import SmartToyIcon from "@mui/icons-material/SmartToy";

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

  if (location.pathname === "/games/dvcubie2026" && hideSearchInGame && hideBadgesInGame) {
    return null;
  }

  return (
    <Box
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 1100,
        backgroundColor: isDark ? "rgba(22,27,34,0.95)" : "rgba(236,239,255,0.95)",
        backdropFilter: "blur(8px)",
        py: { xs: 1.5, sm: 2 },
        px: { xs: 2, sm: 4 },
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      <Box sx={{ maxWidth: 1200, mx: "auto" }}>
        {/* Compact search section */}
        {!(location.pathname === "/games/dvcubie2026" && hideSearchInGame) && (
          <Box component="form" onSubmit={onSearchSubmit} sx={{ display: "flex", justifyContent: "center", mb: 1.5 }}>
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

        {/* Compact category chips - horizontal scrollable on mobile */}
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
      </Box>
    </Box>
  );
};
export default SearchBar;
