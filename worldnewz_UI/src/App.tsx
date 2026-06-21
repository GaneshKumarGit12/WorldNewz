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
import ChatBubbleIcon from "@mui/icons-material/ChatBubble";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import FacebookIcon from "@mui/icons-material/Facebook";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Collapse from "@mui/material/Collapse";
import Fab from "@mui/material/Fab";
import Badge from "@mui/material/Badge";
import Tooltip from "@mui/material/Tooltip";
import Divider from "@mui/material/Divider";
import { useState, useEffect } from "react";
import type { ChangeEvent, FormEvent } from "react";
import Footer from "./components/Footer";
import CookieConsent from "./components/CookieConsent";
import { JSONLDWebSite, JSONLDOrganization } from "./seo/JSONLDSchemas";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import CloseIcon from "@mui/icons-material/Close";
import Toolbar from "@mui/material/Toolbar";
import AppBar from "@mui/material/AppBar";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import { useColorMode } from "./context/ThemeContext";
import { useBookmarks } from "./hooks/useBookmarks";
import { useComments } from "./hooks/useComments";

const primaryNavLinks = [
  { label: "Discover", path: "/" },
  { label: "Politics", path: "/politics" },
  { label: "Technology", path: "/technology" },
  { label: "Business", path: "/business" },
  { label: "Polls 🗳️", path: "/polls", highlight: true, highlightColor: "linear-gradient(135deg, #00c6ff, #0072ff)" },
  { label: "GK Quiz 🏆", path: "/badge-quiz", highlight: true, highlightColor: "linear-gradient(135deg, #f857a6, #ff5858)" },
  { label: "MoviesDB 🎬", path: "/movies", highlight: true, highlightColor: "linear-gradient(135deg, #e11d48, #be123c)" },
];

const secondaryNavLinks = [
  { label: "Science & Health", path: "/science-health" },
  { label: "Local News (India)", path: "/local-news" },
  { label: "Sports", path: "/sports" },
  { label: "Money", path: "/money" },
  { label: "Weather", path: "/weather" },
  { label: "Shopping", path: "/shopping" },
  { label: "Travel", path: "/travel" },
  { label: "Food", path: "/food" },
  { label: "Entertainment", path: "/entertainment" },
  { label: "Services", path: "/services" },
  { label: "Gaming", path: "/gaming" },
  { label: "Cartoons", path: "/cartoons" },
  { label: "Stocks", path: "/stocks" },
  { label: "Lifestyle", path: "/lifestyle" },
  { label: "Education", path: "/education" },
  { label: "Opinion", path: "/opinion" },
  { label: "Trending", path: "/trending" },
  { label: "Podcasts & Videos", path: "/podcasts-videos" },
  { label: "Editorial Briefings", path: "/editorial-briefings" },
];

const categories = [
  "general", 
  "politics", 
  "technology", 
  "business", 
  "science & health", 
  "lifestyle", 
  "education", 
  "opinion", 
  "trending", 
  "podcasts & videos",
  "local news", 
  "sports", 
  "money", 
  "weather", 
  "shopping", 
  "travel", 
  "food", 
  "entertainment",
  "services",
  "gaming",
  "cartoons",
  "polls",
  "badge quiz",
  "stocks",
  "movies"
];

const getCategoryPath = (cat: string): string => {
  switch (cat.toLowerCase().trim()) {
    case "general": return "/";
    case "politics": return "/politics";
    case "technology": return "/technology";
    case "business": return "/business";
    case "science & health": return "/science-health";
    case "lifestyle": return "/lifestyle";
    case "education": return "/education";
    case "opinion": return "/opinion";
    case "trending": return "/trending";
    case "podcasts & videos": return "/podcasts-videos";
    case "local news": return "/local-news";
    case "sports": return "/sports";
    case "money": return "/money";
    case "weather": return "/weather";
    case "shopping": return "/shopping";
    case "travel": return "/travel";
    case "food": return "/food";
    case "entertainment": return "/entertainment";
    case "services": return "/services";
    case "gaming": return "/gaming";
    case "cartoons": return "/cartoons";
    case "polls": return "/polls";
    case "badge quiz": return "/badge-quiz";
    case "stocks": return "/stocks";
    case "movies": return "/movies";
    default: return "/";
  }
};

const App: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerCategoriesOpen, setDrawerCategoriesOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);
  const [showPushBanner, setShowPushBanner] = useState(false);

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { mode, toggleMode } = useColorMode();
  const { bookmarks } = useBookmarks();
  const { getAllComments } = useComments();
  const totalComments = getAllComments().length;

  useEffect(() => {
    const query = searchParams.get("q") ?? "";
    setSearchTerm(query);
  }, [searchParams]);

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // GA4 Virtual Route-Change Tracking
  useEffect(() => {
    const gtag = (window as any).gtag;
    if (typeof gtag === "function") {
      gtag("config", "G-JD24Y5Y78Z", {
        page_path: location.pathname + location.search,
      });
    }
  }, [location]);

  // Push Notifications Banner Display Logic
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const permission = Notification.permission;
      const isDismissed = localStorage.getItem("worldnewzs_push_dismissed") === "true";
      if (permission === "default" && !isDismissed) {
        const timer = setTimeout(() => {
          setShowPushBanner(true);
        }, 4000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleEnablePush = () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification("WorldNewzs", {
            body: "You have successfully subscribed to breaking news alerts!",
            icon: "/logo-transparent.svg",
          });
        }
        localStorage.setItem("worldnewzs_push_dismissed", "true");
        setShowPushBanner(false);
      });
    }
  };

  const handleDismissPush = () => {
    localStorage.setItem("worldnewzs_push_dismissed", "true");
    setShowPushBanner(false);
  };

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
      <JSONLDWebSite />
      <JSONLDOrganization />
      {/* ─── Top AppBar ─── */}
      <AppBar
        position="static"
        sx={{ backgroundColor: isDark ? "#161b22" : "#0a0a0a" }}
        elevation={2}
      >
        <Toolbar>
          {/* Logo */}
          <Box 
            component={Link} 
            to="/" 
            sx={{ 
              display: "flex", 
              alignItems: "center", 
              textDecoration: "none", 
              flexGrow: 1,
              mr: 2,
              "&:hover .brand-logo-img": {
                transform: "rotate(15deg) scale(1.05)",
              },
              "&:hover .brand-name-text": {
                color: "#ff8a65",
              }
            }}
          >
            <Box
              component="img"
              className="brand-logo-img"
              src="/logo-transparent.svg"
              alt="WorldNewzs Logo"
              sx={{ 
                height: 38, 
                width: 38, 
                mr: 1.5, 
                transition: "transform 0.3s ease-in-out" 
              }}
            />
            <Typography
              variant="h6"
              className="brand-name-text"
              sx={{
                fontWeight: 900,
                color: "white",
                textTransform: "uppercase",
                letterSpacing: 2,
                fontFamily: "'Outfit', 'Inter', 'Roboto', sans-serif",
                transition: "color 0.3s ease-in-out",
                fontSize: { xs: "1.1rem", sm: "1.3rem" }
              }}
            >
              WorldNewzs
            </Typography>
          </Box>

          {/* Desktop nav */}
          <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 1 }}>
            {primaryNavLinks.map((link) => {
              const isHighlighted = link.highlight;
              const isActive = location.pathname === link.path;
              return (
                <Button
                  key={link.path}
                  component={Link}
                  to={link.path}
                  sx={isHighlighted ? {
                    background: link.highlightColor || "linear-gradient(135deg, #00c6ff, #0072ff)",
                    color: "white",
                    fontWeight: "bold",
                    borderRadius: "20px",
                    px: 2,
                    mx: 0.5,
                    fontSize: "0.85rem",
                    textTransform: "none",
                    whiteSpace: "nowrap",
                    height: "36px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: isActive ? "0 0 10px rgba(255,255,255,0.4)" : "none",
                    border: isActive ? "1px solid #fff" : "1px solid transparent",
                    transition: "all 0.3s ease-in-out",
                    "&:hover": {
                      transform: "translateY(-1px)",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                      filter: "brightness(1.1)",
                    },
                  } : {
                    color: "white",
                    fontWeight: isActive ? "bold" : "normal",
                    borderBottom: isActive ? "2px solid #c83a15" : "none",
                    borderRadius: 0,
                    "&:hover": { color: "#ff8a65" },
                  }}
                >
                  {link.label}
                </Button>
              );
            })}

            {/* Dropdown for other categories */}
            <Button
              aria-controls={menuOpen ? "more-categories-menu" : undefined}
              aria-haspopup="true"
              aria-expanded={menuOpen ? "true" : undefined}
              onClick={handleMenuClick}
              endIcon={<KeyboardArrowDownIcon />}
              sx={{
                color: "white",
                fontWeight: secondaryNavLinks.some(l => location.pathname === l.path) ? "bold" : "normal",
                borderBottom: secondaryNavLinks.some(l => location.pathname === l.path) ? "2px solid #c83a15" : "none",
                borderRadius: 0,
                "&:hover": { color: "#ff8a65" },
              }}
            >
              More
            </Button>
            <Menu
              id="more-categories-menu"
              anchorEl={anchorEl}
              open={menuOpen}
              onClose={handleMenuClose}
              MenuListProps={{
                "aria-labelledby": "basic-button",
              }}
              PaperProps={{
                sx: {
                  backgroundColor: isDark ? "#161b22" : "#ffffff",
                  color: isDark ? "white" : "black",
                  boxShadow: "0px 8px 16px rgba(0,0,0,0.15)",
                  border: "1px solid",
                  borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                }
              }}
            >
              {secondaryNavLinks.map((link) => (
                <MenuItem
                  key={link.path}
                  component={Link}
                  to={link.path}
                  onClick={handleMenuClose}
                  selected={location.pathname === link.path}
                  sx={{
                    minWidth: 140,
                    fontWeight: location.pathname === link.path ? "bold" : "normal",
                    color: location.pathname === link.path ? "#c83a15" : "inherit",
                    "&.Mui-selected": {
                      backgroundColor: isDark ? "rgba(200, 58, 21, 0.15)" : "rgba(200, 58, 21, 0.08)",
                      color: "#c83a15",
                      fontWeight: "bold",
                    },
                    "&:hover": {
                      backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.04)",
                    }
                  }}
                >
                  {link.label}
                </MenuItem>
              ))}
            </Menu>

            {/* Comments button */}
            <Tooltip title="Comments">
              <IconButton
                component={Link}
                to="/comments"
                aria-label="Comments"
                sx={{ color: location.pathname === "/comments" ? "#c83a15" : "white", ml: 1 }}
              >
                <Badge badgeContent={totalComments} color="primary" max={999}>
                  <ChatBubbleIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Bookmarks button */}
            <Tooltip title="Bookmarks">
              <IconButton
                component={Link}
                to="/bookmarks"
                aria-label="Bookmarks"
                sx={{ color: location.pathname === "/bookmarks" ? "#ffb74d" : "white", ml: 1 }}
              >
                <Badge badgeContent={bookmarks.length} color="warning" max={99}>
                  <BookmarkIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Facebook Settings */}
            <Tooltip title="Facebook Integration">
              <IconButton
                component={Link}
                to="/facebook-settings"
                aria-label="Facebook Settings"
                sx={{ color: location.pathname === "/facebook-settings" ? "#c83a15" : "white", ml: 1 }}
              >
                <FacebookIcon />
              </IconButton>
            </Tooltip>

            {/* Dark mode toggle */}
            <Tooltip title={isDark ? "Switch to Light mode" : "Switch to Dark mode"}>
              <IconButton onClick={toggleMode} aria-label="Toggle theme" sx={{ color: "white", ml: 0.5 }}>
                {isDark ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>
          </Box>

          {/* Mobile: bookmark + theme + hamburger */}
          <Box sx={{ display: { xs: "flex", md: "none" }, alignItems: "center" }}>
            <IconButton component={Link} to="/comments" aria-label="Comments" sx={{ color: "white" }}>
              <Badge badgeContent={totalComments} color="primary" max={999}>
                <ChatBubbleIcon />
              </Badge>
            </IconButton>
            <IconButton component={Link} to="/bookmarks" aria-label="Bookmarks" sx={{ color: "white" }}>
              <Badge badgeContent={bookmarks.length} color="warning" max={99}>
                <BookmarkIcon />
              </Badge>
            </IconButton>
            <IconButton component={Link} to="/facebook-settings" aria-label="Facebook Settings" sx={{ color: location.pathname === "/facebook-settings" ? "#c83a15" : "white" }}>
              <FacebookIcon />
            </IconButton>
            <IconButton onClick={toggleMode} aria-label="Toggle theme" sx={{ color: "white" }}>
              {isDark ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
            <IconButton aria-label="Menu" sx={{ color: "white" }} edge="end" onClick={() => setDrawerOpen(true)}>
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
          {primaryNavLinks.map((link) => {
            const isHighlighted = link.highlight;
            const isActive = location.pathname === link.path;
            return (
              <ListItem key={link.path} disablePadding sx={isHighlighted ? { px: 2, py: 0.5 } : {}}>
                <ListItemButton
                  component={Link}
                  to={link.path}
                  onClick={() => setDrawerOpen(false)}
                  sx={isHighlighted ? {
                    background: link.highlightColor || "linear-gradient(135deg, #00c6ff, #0072ff)",
                    color: "white",
                    borderRadius: "12px",
                    fontWeight: "bold",
                    justifyContent: "center",
                    textAlign: "center",
                    border: isActive ? "2px solid #fff" : "none",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                    "& .MuiListItemText-primary": {
                      fontWeight: "700 !important",
                      fontSize: "0.95rem"
                    },
                    "&:hover": {
                      filter: "brightness(1.1)",
                    }
                  } : {
                    fontWeight: isActive ? "bold" : "normal",
                    color: isActive ? "#c83a15" : "white",
                    "&:hover": { color: "#ff8a65" },
                  }}
                >
                  <ListItemText primary={link.label} sx={isHighlighted ? { textAlign: "center" } : {}} />
                </ListItemButton>
              </ListItem>
            );
          })}

          {/* Collapsible Mobile Secondary Categories */}
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => setDrawerCategoriesOpen(!drawerCategoriesOpen)}
              sx={{
                color: secondaryNavLinks.some(l => location.pathname === l.path) ? "#c83a15" : "white",
                "&:hover": { color: "#ff8a65" },
              }}
            >
              <ListItemText 
                primary="More Categories" 
                primaryTypographyProps={{ 
                  sx: { fontWeight: secondaryNavLinks.some(l => location.pathname === l.path) ? "bold" : "normal" } 
                }} 
              />
              {drawerCategoriesOpen ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
          </ListItem>
          <Collapse in={drawerCategoriesOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding sx={{ pl: 2 }}>
              {secondaryNavLinks.map((link) => (
                <ListItem key={link.path} disablePadding>
                  <ListItemButton
                    component={Link}
                    to={link.path}
                    onClick={() => setDrawerOpen(false)}
                    sx={{
                      fontWeight: location.pathname === link.path ? "bold" : "normal",
                      color: location.pathname === link.path ? "#c83a15" : "rgba(255,255,255,0.7)",
                      "&:hover": { color: "#ff8a65" },
                    }}
                  >
                    <ListItemText primary={link.label} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Collapse>

          <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", my: 1 }} />
          {[
            { label: "Facebook Settings", path: "/facebook-settings" },
            { label: "About Us", path: "/about" },
            { label: "Contact Us", path: "/contact" }
          ].map((link) => (
            <ListItem key={link.path} disablePadding>
              <ListItemButton
                component={Link}
                to={link.path}
                onClick={() => setDrawerOpen(false)}
                sx={{
                  fontWeight: location.pathname === link.path ? "bold" : "normal",
                  color: location.pathname === link.path ? "#c83a15" : "rgba(255,255,255,0.7)",
                  "&:hover": { color: "#ff8a65" },
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
              flexWrap: { xs: "nowrap", md: "wrap" }, 
              gap: 1.0, 
              rowGap: 1.25,
              justifyContent: { xs: "flex-start", md: "center" },
              overflowX: "auto",
              pb: 0.5,
              "&::-webkit-scrollbar": { height: "4px" },
              "&::-webkit-scrollbar-track": { background: "transparent" },
              "&::-webkit-scrollbar-thumb": { background: "#ccc", borderRadius: "2px" },
            }}
          >
            {categories.map((cat) => {
              const path = getCategoryPath(cat);
              const isActive = location.pathname === path || (location.pathname === "/search" && searchParams.get("category") === cat);
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
        </Box>
      </Box>

      {/* ─── Page Content ─── */}
      <Box sx={{ flexGrow: 1 }}>
        <Outlet context={{ searchTerm }} />
      </Box>

      <Footer />
      <CookieConsent />

      {/* ─── Push Notifications Banner ─── */}
      {showPushBanner && (
        <Box
          sx={{
            position: "fixed",
            bottom: { xs: 80, sm: 24 },
            left: { xs: 16, sm: 24 },
            right: { xs: 16, sm: "auto" },
            maxWidth: 360,
            zIndex: 3000,
            p: 2.5,
            borderRadius: 4,
            border: "1px solid",
            borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
            backgroundColor: isDark ? "rgba(22,27,34,0.95)" : "rgba(255,255,255,0.95)",
            backdropFilter: "blur(12px)",
            boxShadow: isDark
              ? "0 10px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)"
              : "0 10px 30px rgba(0,0,0,0.08)",
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
            animation: "slideUp 0.4s ease-out",
            transition: "all 0.3s ease",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                backgroundColor: isDark ? "rgba(255,138,101,0.15)" : "rgba(200,58,21,0.08)",
                color: isDark ? "#ff8a65" : "#c83a15",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <NotificationsActiveIcon />
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isDark ? "white" : "black" }}>
                  Enable Breaking News Alerts
                </Typography>
                <IconButton size="small" onClick={handleDismissPush} sx={{ p: 0, color: "text.secondary" }} aria-label="Dismiss">
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.8rem", lineHeight: 1.4 }}>
                Get instant desktop and mobile notifications for critical breaking events and regional news stories.
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
            <Button size="small" onClick={handleDismissPush} sx={{ textTransform: "none", color: "text.secondary", fontWeight: 600 }}>
              Later
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={handleEnablePush}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                borderRadius: 2,
                px: 2,
                background: "linear-gradient(135deg, #ff8a65 0%, #c83a15 100%)",
                color: "white",
                boxShadow: "none",
                "&:hover": {
                  background: "linear-gradient(135deg, #ff9e80 0%, #d84315 100%)",
                },
              }}
            >
              Enable Alerts
            </Button>
          </Box>
        </Box>
      )}



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