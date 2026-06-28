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
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Collapse from "@mui/material/Collapse";
import Fab from "@mui/material/Fab";
import Badge from "@mui/material/Badge";
import Tooltip from "@mui/material/Tooltip";
import Divider from "@mui/material/Divider";
import { useState, useEffect, lazy, Suspense } from "react";
import React, { useState, useEffect, Suspense, lazy, ChangeEvent, FormEvent, useCallback } from "react";
import { useLocation, useNavigate, useSearchParams, Outlet } from "react-router-dom";
import { Box, Snackbar, Alert } from "@mui/material";

import { useColorMode } from "./context/ThemeContext";
import { useBookmarks } from "./hooks/useBookmarks";
import { useComments } from "./hooks/useComments";

import { JSONLDWebSite, JSONLDOrganization } from "./seo/JSONLDSchemas";
import { AmazonStrip } from "./components/layout/AmazonStrip";
import { Header } from "./components/layout/Header";
import { MobileDrawer } from "./components/layout/MobileDrawer";
import { SearchBar } from "./components/layout/SearchBar";
import { BackToTop } from "./components/layout/BackToTop";
import { PushNotificationBanner } from "./components/layout/PushNotificationBanner";

// Lazy load footer and cookie consent
const Footer = lazy(() => import("./components/Footer"));
const CookieConsent = lazy(() => import("./components/CookieConsent"));

const App: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerCategoriesOpen, setDrawerCategoriesOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);
  const [showPushBanner, setShowPushBanner] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showBackToTop, setShowBackToTop] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { mode, toggleMode } = useColorMode();
  const { bookmarks } = useBookmarks();
  const { getAllComments } = useComments();

  // Optimized Comments retrieval: calculate count on mount or when engagement updates
  const totalComments = getAllComments().length;

  const [hideSearchInGame, setHideSearchInGame] = useState(() => localStorage.getItem("dvcubie_hide_search") !== "false");
  const [hideBadgesInGame, setHideBadgesInGame] = useState(() => localStorage.getItem("dvcubie_hide_badges") !== "false");

  useEffect(() => {
    const handleSettingsChange = () => {
      setHideSearchInGame(localStorage.getItem("dvcubie_hide_search") !== "false");
      setHideBadgesInGame(localStorage.getItem("dvcubie_hide_badges") !== "false");
    };

    window.addEventListener("dvcubie-settings-changed", handleSettingsChange);
    handleSettingsChange();

    return () => {
      window.removeEventListener("dvcubie-settings-changed", handleSettingsChange);
    };
  }, []);

  // Lock body scroll on game path
  useEffect(() => {
    if (location.pathname === "/games/dvcubie2026") {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [location.pathname]);

  const [verificationSnackbar, setVerificationSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({ 
    open: false, 
    message: "", 
    severity: "success" 
  });

  useEffect(() => {
    const query = searchParams.get("q") ?? "";
    setSearchTerm(query);
  }, [searchParams]);

  // Listen for subscription verification parameters
  useEffect(() => {
    const verified = searchParams.get("subscription_verified");
    if (verified) {
      if (verified === "true") {
        setVerificationSnackbar({
          open: true,
          message: "Email successfully verified! Your subscription to WorldNewzs newsletter is now active.",
          severity: "success"
        });
      } else {
        const errorMsg = searchParams.get("error") === "invalid_token" ? "Invalid or expired verification token." : "Verification failed.";
        setVerificationSnackbar({
          open: true,
          message: `Verification Failed: ${errorMsg}`,
          severity: "error"
        });
      }
      
      const url = new URL(window.location.href);
      url.searchParams.delete("subscription_verified");
      url.searchParams.delete("error");
      window.history.replaceState({}, document.title, url.pathname + url.search);
    }
  }, [searchParams]);

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // GA4 Route-Change Tracking
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

  const handleMenuClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleSearchChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  }, []);

  const performSearch = useCallback((value: string, category?: string) => {
    const trimmed = value.trim();
    if (!trimmed && !category) { navigate("/search"); return; }
    const queryParam = trimmed ? `q=${encodeURIComponent(trimmed)}` : "";
    const categoryParam = category ? `category=${encodeURIComponent(category)}` : "";
    const combined = [queryParam, categoryParam].filter(Boolean).join("&");
    navigate(`/search?${combined}`);
  }, [navigate]);

  const handleSearchSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    performSearch(searchTerm);
  }, [searchTerm, performSearch]);

  const handleVoiceSearch = useCallback(() => {
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
  }, [performSearch]);

  const handleCopilotSearch = useCallback(() => {
    performSearch(searchTerm || "latest news");
  }, [searchTerm, performSearch]);

  const handleEnablePush = useCallback(() => {
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
  }, []);

  const handleDismissPush = useCallback(() => {
    localStorage.setItem("worldnewzs_push_dismissed", "true");
    setShowPushBanner(false);
  }, []);

  const handleBackToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const isDark = mode === "dark";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <JSONLDWebSite />
      <JSONLDOrganization />

      {/* Deals Strip */}
      <AmazonStrip />

      {/* Header AppBar */}
      <Header
        isDark={isDark}
        toggleMode={toggleMode}
        bookmarksCount={bookmarks.length}
        totalComments={totalComments}
        hideBadgesInGame={hideBadgesInGame}
        onMenuClick={handleMenuClick}
        onMenuClose={handleMenuClose}
        anchorEl={anchorEl}
        menuOpen={menuOpen}
        onDrawerOpen={() => setDrawerOpen(true)}
      />

      {/* Mobile Drawer */}
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        categoriesOpen={drawerCategoriesOpen}
        onCategoriesToggle={() => setDrawerCategoriesOpen(!drawerCategoriesOpen)}
        isDark={isDark}
      />

      {/* Sticky Search bar and category chips */}
      <SearchBar
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        onSearchSubmit={handleSearchSubmit}
        onVoiceSearch={handleVoiceSearch}
        onCopilotSearch={handleCopilotSearch}
        isDark={isDark}
        hideSearchInGame={hideSearchInGame}
        hideBadgesInGame={hideBadgesInGame}
      />

      {/* Page Content */}
      <Box sx={{ flexGrow: 1 }}>
        <Outlet context={{ searchTerm }} />
      </Box>

      {/* Footer and Cookie Banner */}
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
      <Suspense fallback={null}>
        <CookieConsent />
      </Suspense>

      {/* Push Notifications Banner */}
      {showPushBanner && (
        <PushNotificationBanner
          onEnable={handleEnablePush}
          onDismiss={handleDismissPush}
          isDark={isDark}
        />
      )}

      {/* Back to Top */}
      <BackToTop show={showBackToTop} onClick={handleBackToTop} />

      {/* Subscription Status Alerts */}
      <Snackbar
        open={verificationSnackbar.open}
        autoHideDuration={6000}
        onClose={() => setVerificationSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert 
          onClose={() => setVerificationSnackbar(prev => ({ ...prev, open: false }))} 
          severity={verificationSnackbar.severity} 
          sx={{ width: "100%", borderRadius: 3, fontWeight: 700 }}
        >
          {verificationSnackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default App;