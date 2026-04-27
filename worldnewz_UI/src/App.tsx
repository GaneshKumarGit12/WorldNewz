import { Outlet, Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Box from "@mui/material/Box";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import MicIcon from "@mui/icons-material/Mic";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import Fab from "@mui/material/Fab";
import Badge from "@mui/material/Badge";
import Tooltip from "@mui/material/Tooltip";
import { useState, useEffect } from "react";
import type { ChangeEvent, FormEvent } from "react";
import Footer from "./components/Footer";
import Toolbar from "@mui/material/Toolbar";
import AppBar from "@mui/material/AppBar";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Chip from "@mui/material/Chip";
import { useColorMode } from "./context/ThemeContext";
import { useBookmarks } from "./hooks/useBookmarks";

const navLinks = [
  { label: "Discover", path: "/" },
  { label: "Sports", path: "/sports" },
  { label: "Money", path: "/money" },
  { label: "Weather", path: "/weather" },
  { label: "Shopping", path: "/shopping" },
];

const categories = ["general", "sports", "business", "technology", "health", "science", "shopping"];

const App: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { mode, toggleMode } = useColorMode();
  const { bookmarks } = useBookmarks();

  useEffect(() => {
    const query = searchParams.get("q") ?? "";
    setSearchTerm(query);
  }, [searchParams]);

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const performSearch = (value: string, category?: string) => {
    const trimmed = value.trim();
    if (!trimmed && !category) { navigate("/search"); return; }
    const queryParam = trimmed ? `q=${encodeURIComponent(trimmed)}` : "";
    const categoryParam = category ? `category=${encodeURIComponent(category)}` : "";
    const combined = [queryParam, categoryParam].filter(Boolean).join("&");
    navigate(`/search?${combined}`);
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    performSearch(searchTerm);
  };

  const handleVoiceSearch = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { window.alert("Voice search not supported in this browser."); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchTerm(transcript);
      performSearch(transcript);
    };
    recognition.onerror = () => console.warn("Voice search failed");
    recognition.start();
  };

  const handleCopilotSearch = () => {
    performSearch(searchTerm || "latest news");
  };

  const isDark = mode === "dark";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* ─── Top AppBar ─── */}
      <AppBar
        position="static"
        sx={{ backgroundColor: isDark ? "#161b22" : "#0a0a0a" }}
        elevation={2}
      >
        <Toolbar>
          {/* Logo */}
          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{
              flexGrow: 1,
              fontWeight: 800,
              color: "white",
              textTransform: "uppercase",
              letterSpacing: 2,
              textDecoration: "none",
              "&:hover": { color: "#1976d2" },
            }}
          >
            🌐 WorldNewz
          </Typography>

          {/* Desktop nav */}
          <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 0.5 }}>
            {navLinks.map((link) => (
              <Button
                key={link.path}
                component={Link}
                to={link.path}
                sx={{
                  color: "white",
                  fontWeight: location.pathname === link.path ? "bold" : "normal",
                  borderBottom: location.pathname === link.path ? "2px solid #1976d2" : "none",
                  borderRadius: 0,
                  "&:hover": { color: "#90caf9" },
                }}
              >
                {link.label}
              </Button>
            ))}

            {/* Bookmarks button */}
            <Tooltip title="Bookmarks">
              <IconButton
                component={Link}
                to="/bookmarks"
                sx={{ color: location.pathname === "/bookmarks" ? "#ffb74d" : "white", ml: 1 }}
              >
                <Badge badgeContent={bookmarks.length} color="warning" max={99}>
                  <BookmarkIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Dark mode toggle */}
            <Tooltip title={isDark ? "Switch to Light mode" : "Switch to Dark mode"}>
              <IconButton onClick={toggleMode} sx={{ color: "white", ml: 0.5 }}>
                {isDark ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>
          </Box>

          {/* Mobile: bookmark + theme + hamburger */}
          <Box sx={{ display: { xs: "flex", md: "none" }, alignItems: "center" }}>
            <IconButton component={Link} to="/bookmarks" sx={{ color: "white" }}>
              <Badge badgeContent={bookmarks.length} color="warning" max={99}>
                <BookmarkIcon />
              </Badge>
            </IconButton>
            <IconButton onClick={toggleMode} sx={{ color: "white" }}>
              {isDark ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
            <IconButton sx={{ color: "white" }} edge="end" onClick={() => setDrawerOpen(true)}>
              <MenuIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* ─── Mobile Drawer ─── */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { backgroundColor: isDark ? "#161b22" : "#0a0a0a", color: "white" } }}
      >
        <List sx={{ width: 250 }}>
          {[...navLinks, { label: "Bookmarks", path: "/bookmarks" }].map((link) => (
            <ListItem key={link.path} disablePadding>
              <ListItemButton
                component={Link}
                to={link.path}
                onClick={() => setDrawerOpen(false)}
                sx={{
                  fontWeight: location.pathname === link.path ? "bold" : "normal",
                  color: location.pathname === link.path ? "#1976d2" : "white",
                  "&:hover": { color: "#90caf9" },
                }}
              >
                <ListItemText primary={link.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* ─── Search Bar + Category chips ─── */}
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
          <Box component="form" onSubmit={handleSearchSubmit} sx={{ display: "flex", justifyContent: "center", mb: 1.5 }}>
            <TextField
              fullWidth
              value={searchTerm}
              onChange={handleSearchChange}
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
                        <IconButton size="small" aria-label="Voice search" onClick={handleVoiceSearch} sx={{ p: 0.5 }}>
                          <MicIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                      <Button
                        startIcon={<SmartToyIcon sx={{ fontSize: 16 }} />}
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={handleCopilotSearch}
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

          {/* Compact category chips - horizontal scrollable on mobile */}
          <Box 
            sx={{ 
              display: "flex", 
              flexWrap: "wrap", 
              gap: 0.75, 
              justifyContent: "center",
              overflowX: "auto",
              pb: 0.5,
              "&::-webkit-scrollbar": { height: "4px" },
              "&::-webkit-scrollbar-track": { background: "transparent" },
              "&::-webkit-scrollbar-thumb": { background: "#ccc", borderRadius: "2px" },
            }}
          >
            {categories.map((cat) => (
              <Chip
                key={cat}
                label={cat}
                clickable
                onClick={() => performSearch(searchTerm, cat)}
                color={searchParams.get("category") === cat ? "primary" : "default"}
                variant={searchParams.get("category") === cat ? "filled" : "outlined"}
                size="small"
                sx={{ 
                  textTransform: "capitalize",
                  fontSize: "0.8rem",
                  height: 28,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              />
            ))}
          </Box>
        </Box>
      </Box>

      {/* ─── Page Content ─── */}
      <Box sx={{ flexGrow: 1 }}>
        <Outlet context={{ searchTerm }} />
      </Box>

      <Footer />

      {/* ─── Global Back to Top FAB ─── */}
      {showBackToTop && (
        <Fab
          color="primary"
          size="medium"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          sx={{ position: "fixed", bottom: 24, right: 24, boxShadow: "0 4px 12px rgba(0,0,0,0.3)", zIndex: 2000 }}
        >
          <KeyboardArrowUpIcon />
        </Fab>
      )}
    </Box>
  );
};

export default App;