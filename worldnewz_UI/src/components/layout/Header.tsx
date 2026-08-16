import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Box, Typography, Button, Menu, MenuItem, Tooltip, IconButton, Badge } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import ChatBubbleIcon from "@mui/icons-material/ChatBubble";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import FacebookIcon from "@mui/icons-material/Facebook";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";

import { newsPillarLinks, lifestylePillarLinks, explorePillarLinks, playPillarLinks } from "../../utils/navigationConfig";
import { VerificationStrip } from "./VerificationStrip";

interface HeaderProps {
  isDark: boolean;
  toggleMode: () => void;
  bookmarksCount: number;
  totalComments: number;
  hideBadgesInGame: boolean;
  onMenuClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onMenuClose: () => void;
  anchorEl: HTMLElement | null;
  menuOpen: boolean;
  onDrawerOpen: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isDark,
  toggleMode,
  bookmarksCount,
  totalComments,
  hideBadgesInGame,
  onDrawerOpen,
}) => {
  const location = useLocation();

  const [moreNewsAnchorEl, setMoreNewsAnchorEl] = useState<null | HTMLElement>(null);
  const [lifestyleAnchorEl, setLifestyleAnchorEl] = useState<null | HTMLElement>(null);
  const [exploreAnchorEl, setExploreAnchorEl] = useState<null | HTMLElement>(null);
  const [playAnchorEl, setPlayAnchorEl] = useState<null | HTMLElement>(null);

  const moreNewsOpen = Boolean(moreNewsAnchorEl);
  const lifestyleOpen = Boolean(lifestyleAnchorEl);
  const exploreOpen = Boolean(exploreAnchorEl);
  const playOpen = Boolean(playAnchorEl);

  const handleMoreNewsClick = (event: React.MouseEvent<HTMLButtonElement>) => setMoreNewsAnchorEl(event.currentTarget);
  const handleMoreNewsClose = () => setMoreNewsAnchorEl(null);

  const handleLifestyleClick = (event: React.MouseEvent<HTMLButtonElement>) => setLifestyleAnchorEl(event.currentTarget);
  const handleLifestyleClose = () => setLifestyleAnchorEl(null);

  const handleExploreClick = (event: React.MouseEvent<HTMLButtonElement>) => setExploreAnchorEl(event.currentTarget);
  const handleExploreClose = () => setExploreAnchorEl(null);

  const handlePlayClick = (event: React.MouseEvent<HTMLButtonElement>) => setPlayAnchorEl(event.currentTarget);
  const handlePlayClose = () => setPlayAnchorEl(null);

  const currentDateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Box component="header" sx={{ width: "100%", backgroundColor: "#10172A", color: "#FFFFFF" }}>
      {/* 1. Top Utility Strip */}
      <Box
        className="masthead-top"
        sx={{
          backgroundColor: "#10172A",
          color: "#9AA2B4",
          borderBottom: "1px solid #1E293B",
          fontSize: "12px",
          fontFamily: "var(--mono, 'IBM Plex Mono', monospace)",
          py: 0.75,
        }}
      >
        <Box
          className="wrap"
          sx={{
            maxWidth: "1240px",
            margin: "0 auto",
            padding: "0 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Left info */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
              <Box
                className="dot"
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: "var(--red, #B7222B)",
                  display: "inline-block",
                  boxShadow: "0 0 0 3px rgba(183, 34, 43, 0.25)",
                }}
              />
              <Typography component="span" sx={{ fontSize: "11.5px", color: "#C9CEDA", fontFamily: "inherit", fontWeight: 600 }}>
                LIVE COVERAGE
              </Typography>
            </Box>
            <Typography component="span" sx={{ fontSize: "11.5px", color: "#8B92A3", fontFamily: "inherit", display: { xs: "none", sm: "inline" } }}>
              {currentDateStr}
            </Typography>
          </Box>

          {/* Right utility actions */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            {/* Search Pill Button */}
            <Button
              component={Link}
              to="/search"
              sx={{
                border: "1px solid #2E3A58",
                borderRadius: "20px",
                px: 1.8,
                py: 0.3,
                color: "#8C93A8",
                fontSize: "11.5px",
                textTransform: "none",
                fontFamily: "var(--sans)",
                backgroundColor: "transparent",
                "&:hover": { borderColor: "#4C5670", color: "#FFFFFF" },
                display: { xs: "none", sm: "flex" },
                alignItems: "center",
                gap: 0.75,
              }}
            >
              <SearchIcon sx={{ fontSize: 14 }} />
              Search news, topics, tickers…
            </Button>

            {/* Badges & Actions */}
            {!(location.pathname === "/games/dvcubie2026" && hideBadgesInGame) && (
              <>
                <Tooltip title="Comments">
                  <IconButton
                    id="header-comments-btn"
                    component={Link}
                    to="/comments"
                    size="small"
                    aria-label="Comments"
                    sx={{ color: location.pathname === "/comments" ? "var(--red)" : "#9AA2B4" }}
                  >
                    <Badge badgeContent={totalComments} color="error" max={999}>
                      <ChatBubbleIcon sx={{ fontSize: 16 }} />
                    </Badge>
                  </IconButton>
                </Tooltip>

                <Tooltip title="Bookmarks">
                  <IconButton
                    id="header-bookmarks-btn"
                    component={Link}
                    to="/bookmarks"
                    size="small"
                    aria-label="Bookmarks"
                    sx={{ color: location.pathname === "/bookmarks" ? "var(--gold)" : "#9AA2B4" }}
                  >
                    <Badge badgeContent={bookmarksCount} color="warning" max={99}>
                      <BookmarkIcon sx={{ fontSize: 16 }} />
                    </Badge>
                  </IconButton>
                </Tooltip>
              </>
            )}

            <Tooltip title="Admin Dashboard">
              <IconButton
                id="header-admin-btn-desktop"
                component={Link}
                to="/admin"
                size="small"
                aria-label="Admin Dashboard"
                sx={{ color: location.pathname === "/admin" ? "var(--gold)" : "#9AA2B4" }}
              >
                <AdminPanelSettingsIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Facebook Settings">
              <IconButton
                id="header-facebook-btn"
                component={Link}
                to="/facebook-settings"
                size="small"
                aria-label="Facebook Settings"
                sx={{ color: location.pathname === "/facebook-settings" ? "var(--red)" : "#9AA2B4" }}
              >
                <FacebookIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>

            <Tooltip title={isDark ? "Switch to Light mode" : "Switch to Dark mode"}>
              <IconButton id="btn-theme-toggle" onClick={toggleMode} size="small" aria-label="Toggle theme" sx={{ color: "#9AA2B4" }}>
                {isDark ? <LightModeIcon sx={{ fontSize: 16 }} /> : <DarkModeIcon sx={{ fontSize: 16 }} />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      {/* 2. Main Brand Masthead */}
      <Box
        className="masthead-main"
        sx={{
          backgroundColor: "#10172A",
          py: { xs: 2, md: 2.8 },
          borderBottom: "1px solid #1B2740",
        }}
      >
        <Box
          className="wrap"
          sx={{
            maxWidth: "1240px",
            margin: "0 auto",
            padding: "0 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Brand Logo & Tagline */}
          <Box component={Link} to="/" sx={{ textDecoration: "none", display: "flex", flexDirection: "column", gap: 0.2 }}>
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5 }}>
              <Typography
                component="span"
                sx={{
                  fontFamily: "var(--serif, 'Source Serif 4', Georgia, serif)",
                  fontWeight: 700,
                  fontSize: { xs: "26px", sm: "34px" },
                  color: "#FFFFFF",
                  letterSpacing: "-0.01em",
                  lineHeight: 1.1,
                }}
              >
                WorldNew<Typography component="span" sx={{ color: "var(--red, #B7222B)", fontFamily: "inherit", fontWeight: 700, fontSize: "inherit" }}>z</Typography>s
              </Typography>
            </Box>
            <Typography
              component="span"
              sx={{
                fontFamily: "var(--mono, 'IBM Plex Mono', monospace)",
                fontSize: "10.5px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#7C86A0",
              }}
            >
              Reporting, verified
            </Typography>
          </Box>

          {/* Right Header Actions */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Button
              id="btn-header-subscribe"
              component={Link}
              to="/editorial-briefings"
              variant="contained"
              sx={{
                backgroundColor: "var(--red, #B7222B)",
                color: "#FFFFFF",
                fontWeight: 600,
                fontSize: "13px",
                px: 2.5,
                py: 1,
                borderRadius: "3px",
                textTransform: "none",
                letterSpacing: "0.02em",
                fontFamily: "var(--sans)",
                "&:hover": { backgroundColor: "var(--red-deep, #8E1B22)" },
                display: { xs: "none", sm: "inline-flex" },
              }}
            >
              Subscribe
            </Button>

            <IconButton
              id="btn-mobile-drawer"
              aria-label="Menu"
              sx={{ color: "#FFFFFF", display: { xs: "inline-flex", md: "none" } }}
              edge="end"
              onClick={onDrawerOpen}
            >
              <MenuIcon />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* 3. Signature Verification Strip */}
      <VerificationStrip />

      {/* 4. Primary Navigation Bar */}
      <Box
        component="nav"
        className="primary"
        sx={{
          backgroundColor: "var(--paper-raise)",
          borderTop: "1px solid var(--line-soft)",
          borderBottom: "1px solid var(--line)",
          boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.35)" : "0 1px 3px rgba(0,0,0,0.03)",
        }}
      >
        <Box
          className="wrap"
          sx={{
            maxWidth: "1240px",
            margin: "0 auto",
            padding: "0 28px",
            display: "flex",
            alignItems: "center",
            gap: { xs: 0.5, md: 1 },
            height: "50px",
            overflowX: "auto",
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          {/* Core 4 Pillar Links */}
          {newsPillarLinks.slice(0, 4).map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Button
                key={link.path}
                component={Link}
                to={link.path}
                disableRipple
                sx={{
                  color: isActive ? "var(--red)" : "var(--slate)",
                  fontWeight: isActive ? 700 : 600,
                  fontSize: "13.5px",
                  fontFamily: "var(--sans, 'IBM Plex Sans', sans-serif)",
                  whiteSpace: "nowrap",
                  py: 0.8,
                  px: 1.6,
                  borderRadius: "6px",
                  backgroundColor: isActive
                    ? (isDark ? "rgba(244, 63, 94, 0.12)" : "rgba(183, 34, 43, 0.08)")
                    : "transparent",
                  textTransform: "none",
                  position: "relative",
                  transition: "all 0.18s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:hover": {
                    color: isDark ? "#FFFFFF" : "var(--text-h)",
                    backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(183, 34, 43, 0.06)",
                  },
                  "&::after": isActive ? {
                    content: '""',
                    position: "absolute",
                    bottom: "-6px",
                    left: "15%",
                    right: "15%",
                    height: "2.5px",
                    backgroundColor: "var(--red)",
                    borderRadius: "2px",
                  } : undefined,
                }}
              >
                {link.label}
              </Button>
            );
          })}

          {/* More News Dropdown */}
          {(() => {
            const isMoreActive = newsPillarLinks.slice(4).some((l) => location.pathname === l.path);
            return (
              <>
                <Button
                  id="btn-nav-more-news"
                  aria-controls={moreNewsOpen ? "more-news-menu" : undefined}
                  aria-haspopup="true"
                  aria-expanded={moreNewsOpen ? "true" : undefined}
                  onClick={handleMoreNewsClick}
                  endIcon={
                    <KeyboardArrowDownIcon
                      sx={{
                        fontSize: "18px !important",
                        ml: -0.5,
                        transition: "transform 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
                        transform: moreNewsOpen ? "rotate(180deg)" : "rotate(0deg)",
                        color: moreNewsOpen || isMoreActive ? "var(--red)" : "inherit",
                      }}
                    />
                  }
                  disableRipple
                  sx={{
                    color: isMoreActive || moreNewsOpen ? "var(--red)" : "var(--slate)",
                    fontWeight: isMoreActive || moreNewsOpen ? 700 : 600,
                    fontSize: "13.5px",
                    fontFamily: "var(--sans)",
                    whiteSpace: "nowrap",
                    py: 0.8,
                    px: 1.6,
                    borderRadius: "6px",
                    backgroundColor: isMoreActive || moreNewsOpen
                      ? (isDark ? "rgba(244, 63, 94, 0.12)" : "rgba(183, 34, 43, 0.08)")
                      : "transparent",
                    textTransform: "none",
                    position: "relative",
                    transition: "all 0.18s cubic-bezier(0.4, 0, 0.2, 1)",
                    "&:hover": {
                      color: isDark ? "#FFFFFF" : "var(--text-h)",
                      backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(183, 34, 43, 0.06)",
                    },
                    "&::after": isMoreActive ? {
                      content: '""',
                      position: "absolute",
                      bottom: "-6px",
                      left: "15%",
                      right: "15%",
                      height: "2.5px",
                      backgroundColor: "var(--red)",
                      borderRadius: "2px",
                    } : undefined,
                  }}
                >
                  More News
                </Button>
                <Menu
                  id="more-news-menu"
                  anchorEl={moreNewsAnchorEl}
                  open={moreNewsOpen}
                  onClose={handleMoreNewsClose}
                  elevation={0}
                  transformOrigin={{ horizontal: "left", vertical: "top" }}
                  anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
                  PaperProps={{
                    sx: {
                      backgroundColor: isDark ? "#151C2C" : "#FFFFFF",
                      color: isDark ? "#FFFFFF" : "var(--text)",
                      borderRadius: "10px",
                      border: isDark ? "1px solid #242E42" : "1px solid #DBDEE4",
                      boxShadow: isDark
                        ? "0 20px 40px -6px rgba(0,0,0,0.7), 0 8px 16px -2px rgba(0,0,0,0.45)"
                        : "0 16px 36px -4px rgba(0,0,0,0.12), 0 6px 14px -2px rgba(0,0,0,0.06)",
                      mt: 1.2,
                      p: 0.8,
                      minWidth: 230,
                    },
                  }}
                >
                  {newsPillarLinks.slice(4).map((link) => {
                    const isSelected = location.pathname === link.path;
                    return (
                      <MenuItem
                        key={link.path}
                        component={Link}
                        to={link.path}
                        onClick={handleMoreNewsClose}
                        selected={isSelected}
                        sx={{
                          minWidth: 210,
                          py: 1.1,
                          px: 1.8,
                          my: 0.3,
                          mx: 0.2,
                          borderRadius: "6px",
                          fontSize: "13.5px",
                          fontFamily: "var(--sans)",
                          fontWeight: isSelected ? 700 : 500,
                          color: isSelected ? "var(--red)" : (isDark ? "#E2E8F0" : "var(--text)"),
                          backgroundColor: isSelected
                            ? (isDark ? "rgba(244, 63, 94, 0.16)" : "rgba(183, 34, 43, 0.1)")
                            : "transparent",
                          borderLeft: isSelected ? "3px solid var(--red)" : "3px solid transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          transition: "all 0.16s ease-in-out",
                          "&:hover": {
                            backgroundColor: isDark ? "rgba(244, 63, 94, 0.14)" : "rgba(183, 34, 43, 0.08)",
                            color: "var(--red)",
                            fontWeight: 600,
                            transform: "translateX(4px)",
                            borderLeft: "3px solid var(--red)",
                          },
                        }}
                      >
                        <span>{link.label}</span>
                        {link.badge && (
                          <Box
                            component="span"
                            sx={{
                              fontSize: "9.5px",
                              fontWeight: 700,
                              px: 0.8,
                              py: 0.2,
                              borderRadius: "4px",
                              backgroundColor: "var(--red)",
                              color: "#FFFFFF",
                              letterSpacing: "0.05em",
                            }}
                          >
                            {link.badge}
                          </Box>
                        )}
                      </MenuItem>
                    );
                  })}
                </Menu>
              </>
            );
          })()}

          {/* Lifestyle Dropdown */}
          {(() => {
            const isLifeActive = lifestylePillarLinks.some((l) => location.pathname === l.path);
            return (
              <>
                <Button
                  id="btn-nav-lifestyle"
                  aria-controls={lifestyleOpen ? "lifestyle-menu" : undefined}
                  aria-haspopup="true"
                  aria-expanded={lifestyleOpen ? "true" : undefined}
                  onClick={handleLifestyleClick}
                  endIcon={
                    <KeyboardArrowDownIcon
                      sx={{
                        fontSize: "18px !important",
                        ml: -0.5,
                        transition: "transform 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
                        transform: lifestyleOpen ? "rotate(180deg)" : "rotate(0deg)",
                        color: lifestyleOpen || isLifeActive ? "var(--red)" : "inherit",
                      }}
                    />
                  }
                  disableRipple
                  sx={{
                    color: isLifeActive || lifestyleOpen ? "var(--red)" : "var(--slate)",
                    fontWeight: isLifeActive || lifestyleOpen ? 700 : 600,
                    fontSize: "13.5px",
                    fontFamily: "var(--sans)",
                    whiteSpace: "nowrap",
                    py: 0.8,
                    px: 1.6,
                    borderRadius: "6px",
                    backgroundColor: isLifeActive || lifestyleOpen
                      ? (isDark ? "rgba(244, 63, 94, 0.12)" : "rgba(183, 34, 43, 0.08)")
                      : "transparent",
                    textTransform: "none",
                    position: "relative",
                    transition: "all 0.18s cubic-bezier(0.4, 0, 0.2, 1)",
                    "&:hover": {
                      color: isDark ? "#FFFFFF" : "var(--text-h)",
                      backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(183, 34, 43, 0.06)",
                    },
                    "&::after": isLifeActive ? {
                      content: '""',
                      position: "absolute",
                      bottom: "-6px",
                      left: "15%",
                      right: "15%",
                      height: "2.5px",
                      backgroundColor: "var(--red)",
                      borderRadius: "2px",
                    } : undefined,
                  }}
                >
                  Lifestyle
                </Button>
                <Menu
                  id="lifestyle-menu"
                  anchorEl={lifestyleAnchorEl}
                  open={lifestyleOpen}
                  onClose={handleLifestyleClose}
                  elevation={0}
                  transformOrigin={{ horizontal: "left", vertical: "top" }}
                  anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
                  PaperProps={{
                    sx: {
                      backgroundColor: isDark ? "#151C2C" : "#FFFFFF",
                      color: isDark ? "#FFFFFF" : "var(--text)",
                      borderRadius: "10px",
                      border: isDark ? "1px solid #242E42" : "1px solid #DBDEE4",
                      boxShadow: isDark
                        ? "0 20px 40px -6px rgba(0,0,0,0.7), 0 8px 16px -2px rgba(0,0,0,0.45)"
                        : "0 16px 36px -4px rgba(0,0,0,0.12), 0 6px 14px -2px rgba(0,0,0,0.06)",
                      mt: 1.2,
                      p: 0.8,
                      minWidth: 230,
                    },
                  }}
                >
                  {lifestylePillarLinks.map((link) => {
                    const isSelected = location.pathname === link.path;
                    return (
                      <MenuItem
                        key={link.path}
                        component={Link}
                        to={link.path}
                        onClick={handleLifestyleClose}
                        selected={isSelected}
                        sx={{
                          minWidth: 210,
                          py: 1.1,
                          px: 1.8,
                          my: 0.3,
                          mx: 0.2,
                          borderRadius: "6px",
                          fontSize: "13.5px",
                          fontFamily: "var(--sans)",
                          fontWeight: isSelected ? 700 : 500,
                          color: isSelected ? "var(--red)" : (isDark ? "#E2E8F0" : "var(--text)"),
                          backgroundColor: isSelected
                            ? (isDark ? "rgba(244, 63, 94, 0.16)" : "rgba(183, 34, 43, 0.1)")
                            : "transparent",
                          borderLeft: isSelected ? "3px solid var(--red)" : "3px solid transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          transition: "all 0.16s ease-in-out",
                          "&:hover": {
                            backgroundColor: isDark ? "rgba(244, 63, 94, 0.14)" : "rgba(183, 34, 43, 0.08)",
                            color: "var(--red)",
                            fontWeight: 600,
                            transform: "translateX(4px)",
                            borderLeft: "3px solid var(--red)",
                          },
                        }}
                      >
                        <span>{link.label}</span>
                        {link.badge && (
                          <Box
                            component="span"
                            sx={{
                              fontSize: "9.5px",
                              fontWeight: 700,
                              px: 0.8,
                              py: 0.2,
                              borderRadius: "4px",
                              backgroundColor: "var(--red)",
                              color: "#FFFFFF",
                              letterSpacing: "0.05em",
                            }}
                          >
                            {link.badge}
                          </Box>
                        )}
                      </MenuItem>
                    );
                  })}
                </Menu>
              </>
            );
          })()}

          {/* Explore Dropdown */}
          {(() => {
            const isExploreActive = explorePillarLinks.some((l) => location.pathname === l.path);
            return (
              <>
                <Button
                  id="btn-nav-explore"
                  aria-controls={exploreOpen ? "explore-menu" : undefined}
                  aria-haspopup="true"
                  aria-expanded={exploreOpen ? "true" : undefined}
                  onClick={handleExploreClick}
                  endIcon={
                    <KeyboardArrowDownIcon
                      sx={{
                        fontSize: "18px !important",
                        ml: -0.5,
                        transition: "transform 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
                        transform: exploreOpen ? "rotate(180deg)" : "rotate(0deg)",
                        color: exploreOpen || isExploreActive ? "var(--red)" : "inherit",
                      }}
                    />
                  }
                  disableRipple
                  sx={{
                    color: isExploreActive || exploreOpen ? "var(--red)" : "var(--slate)",
                    fontWeight: isExploreActive || exploreOpen ? 700 : 600,
                    fontSize: "13.5px",
                    fontFamily: "var(--sans)",
                    whiteSpace: "nowrap",
                    py: 0.8,
                    px: 1.6,
                    borderRadius: "6px",
                    backgroundColor: isExploreActive || exploreOpen
                      ? (isDark ? "rgba(244, 63, 94, 0.12)" : "rgba(183, 34, 43, 0.08)")
                      : "transparent",
                    textTransform: "none",
                    position: "relative",
                    transition: "all 0.18s cubic-bezier(0.4, 0, 0.2, 1)",
                    "&:hover": {
                      color: isDark ? "#FFFFFF" : "var(--text-h)",
                      backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(183, 34, 43, 0.06)",
                    },
                    "&::after": isExploreActive ? {
                      content: '""',
                      position: "absolute",
                      bottom: "-6px",
                      left: "15%",
                      right: "15%",
                      height: "2.5px",
                      backgroundColor: "var(--red)",
                      borderRadius: "2px",
                    } : undefined,
                  }}
                >
                  Explore
                </Button>
                <Menu
                  id="explore-menu"
                  anchorEl={exploreAnchorEl}
                  open={exploreOpen}
                  onClose={handleExploreClose}
                  elevation={0}
                  transformOrigin={{ horizontal: "left", vertical: "top" }}
                  anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
                  PaperProps={{
                    sx: {
                      backgroundColor: isDark ? "#151C2C" : "#FFFFFF",
                      color: isDark ? "#FFFFFF" : "var(--text)",
                      borderRadius: "10px",
                      border: isDark ? "1px solid #242E42" : "1px solid #DBDEE4",
                      boxShadow: isDark
                        ? "0 20px 40px -6px rgba(0,0,0,0.7), 0 8px 16px -2px rgba(0,0,0,0.45)"
                        : "0 16px 36px -4px rgba(0,0,0,0.12), 0 6px 14px -2px rgba(0,0,0,0.06)",
                      mt: 1.2,
                      p: 0.8,
                      minWidth: 230,
                    },
                  }}
                >
                  {explorePillarLinks.map((link) => {
                    const isSelected = location.pathname === link.path;
                    return (
                      <MenuItem
                        key={link.path}
                        component={Link}
                        to={link.path}
                        onClick={handleExploreClose}
                        selected={isSelected}
                        sx={{
                          minWidth: 210,
                          py: 1.1,
                          px: 1.8,
                          my: 0.3,
                          mx: 0.2,
                          borderRadius: "6px",
                          fontSize: "13.5px",
                          fontFamily: "var(--sans)",
                          fontWeight: isSelected ? 700 : 500,
                          color: isSelected ? "var(--red)" : (isDark ? "#E2E8F0" : "var(--text)"),
                          backgroundColor: isSelected
                            ? (isDark ? "rgba(244, 63, 94, 0.16)" : "rgba(183, 34, 43, 0.1)")
                            : "transparent",
                          borderLeft: isSelected ? "3px solid var(--red)" : "3px solid transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          transition: "all 0.16s ease-in-out",
                          "&:hover": {
                            backgroundColor: isDark ? "rgba(244, 63, 94, 0.14)" : "rgba(183, 34, 43, 0.08)",
                            color: "var(--red)",
                            fontWeight: 600,
                            transform: "translateX(4px)",
                            borderLeft: "3px solid var(--red)",
                          },
                        }}
                      >
                        <span>{link.label}</span>
                        {link.badge && (
                          <Box
                            component="span"
                            sx={{
                              fontSize: "9.5px",
                              fontWeight: 700,
                              px: 0.8,
                              py: 0.2,
                              borderRadius: "4px",
                              backgroundColor: "var(--red)",
                              color: "#FFFFFF",
                              letterSpacing: "0.05em",
                            }}
                          >
                            {link.badge}
                          </Box>
                        )}
                      </MenuItem>
                    );
                  })}
                </Menu>
              </>
            );
          })()}

          {/* Play & Media Dropdown */}
          {(() => {
            const isPlayActive = playPillarLinks.some((l) => location.pathname === l.path);
            return (
              <>
                <Button
                  id="btn-nav-play"
                  aria-controls={playOpen ? "play-menu" : undefined}
                  aria-haspopup="true"
                  aria-expanded={playOpen ? "true" : undefined}
                  onClick={handlePlayClick}
                  endIcon={
                    <KeyboardArrowDownIcon
                      sx={{
                        fontSize: "18px !important",
                        ml: -0.5,
                        transition: "transform 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
                        transform: playOpen ? "rotate(180deg)" : "rotate(0deg)",
                        color: playOpen || isPlayActive ? "var(--red)" : "inherit",
                      }}
                    />
                  }
                  disableRipple
                  sx={{
                    color: isPlayActive || playOpen ? "var(--red)" : "var(--slate)",
                    fontWeight: isPlayActive || playOpen ? 700 : 600,
                    fontSize: "13.5px",
                    fontFamily: "var(--sans)",
                    whiteSpace: "nowrap",
                    py: 0.8,
                    px: 1.6,
                    borderRadius: "6px",
                    backgroundColor: isPlayActive || playOpen
                      ? (isDark ? "rgba(244, 63, 94, 0.12)" : "rgba(183, 34, 43, 0.08)")
                      : "transparent",
                    textTransform: "none",
                    position: "relative",
                    transition: "all 0.18s cubic-bezier(0.4, 0, 0.2, 1)",
                    "&:hover": {
                      color: isDark ? "#FFFFFF" : "var(--text-h)",
                      backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(183, 34, 43, 0.06)",
                    },
                    "&::after": isPlayActive ? {
                      content: '""',
                      position: "absolute",
                      bottom: "-6px",
                      left: "15%",
                      right: "15%",
                      height: "2.5px",
                      backgroundColor: "var(--red)",
                      borderRadius: "2px",
                    } : undefined,
                  }}
                >
                  Play & Media
                </Button>
                <Menu
                  id="play-menu"
                  anchorEl={playAnchorEl}
                  open={playOpen}
                  onClose={handlePlayClose}
                  elevation={0}
                  transformOrigin={{ horizontal: "left", vertical: "top" }}
                  anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
                  PaperProps={{
                    sx: {
                      backgroundColor: isDark ? "#151C2C" : "#FFFFFF",
                      color: isDark ? "#FFFFFF" : "var(--text)",
                      borderRadius: "10px",
                      border: isDark ? "1px solid #242E42" : "1px solid #DBDEE4",
                      boxShadow: isDark
                        ? "0 20px 40px -6px rgba(0,0,0,0.7), 0 8px 16px -2px rgba(0,0,0,0.45)"
                        : "0 16px 36px -4px rgba(0,0,0,0.12), 0 6px 14px -2px rgba(0,0,0,0.06)",
                      mt: 1.2,
                      p: 0.8,
                      minWidth: 230,
                    },
                  }}
                >
                  {playPillarLinks.map((link) => {
                    const isSelected = location.pathname === link.path;
                    return (
                      <MenuItem
                        key={link.path}
                        component={Link}
                        to={link.path}
                        onClick={handlePlayClose}
                        selected={isSelected}
                        sx={{
                          minWidth: 210,
                          py: 1.1,
                          px: 1.8,
                          my: 0.3,
                          mx: 0.2,
                          borderRadius: "6px",
                          fontSize: "13.5px",
                          fontFamily: "var(--sans)",
                          fontWeight: isSelected ? 700 : 500,
                          color: isSelected ? "var(--red)" : (isDark ? "#E2E8F0" : "var(--text)"),
                          backgroundColor: isSelected
                            ? (isDark ? "rgba(244, 63, 94, 0.16)" : "rgba(183, 34, 43, 0.1)")
                            : "transparent",
                          borderLeft: isSelected ? "3px solid var(--red)" : "3px solid transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          transition: "all 0.16s ease-in-out",
                          "&:hover": {
                            backgroundColor: isDark ? "rgba(244, 63, 94, 0.14)" : "rgba(183, 34, 43, 0.08)",
                            color: "var(--red)",
                            fontWeight: 600,
                            transform: "translateX(4px)",
                            borderLeft: "3px solid var(--red)",
                          },
                        }}
                      >
                        <span>{link.label}</span>
                        {link.badge && (
                          <Box
                            component="span"
                            sx={{
                              fontSize: "9.5px",
                              fontWeight: 700,
                              px: 0.8,
                              py: 0.2,
                              borderRadius: "4px",
                              backgroundColor: "var(--red)",
                              color: "#FFFFFF",
                              letterSpacing: "0.05em",
                            }}
                          >
                            {link.badge}
                          </Box>
                        )}
                      </MenuItem>
                    );
                  })}
                </Menu>
              </>
            );
          })()}
        </Box>
      </Box>
    </Box>
  );
};
