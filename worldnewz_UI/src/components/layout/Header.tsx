import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AppBar, Toolbar, Box, Typography, Button, Menu, MenuItem, Tooltip, IconButton, Badge } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import ChatBubbleIcon from "@mui/icons-material/ChatBubble";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import FacebookIcon from "@mui/icons-material/Facebook";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import MenuIcon from "@mui/icons-material/Menu";

import { coreNewsLinks, exploreLinks, utilityLinks, moreNewsLinks } from "../../utils/navigationConfig";

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
  onDrawerOpen
}) => {
  const location = useLocation();

  const [exploreAnchorEl, setExploreAnchorEl] = useState<null | HTMLElement>(null);
  const [utilityAnchorEl, setUtilityAnchorEl] = useState<null | HTMLElement>(null);
  const [moreAnchorEl, setMoreAnchorEl] = useState<null | HTMLElement>(null);

  const exploreOpen = Boolean(exploreAnchorEl);
  const utilityOpen = Boolean(utilityAnchorEl);
  const moreOpen = Boolean(moreAnchorEl);

  const handleExploreClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setExploreAnchorEl(event.currentTarget);
  };
  const handleExploreClose = () => {
    setExploreAnchorEl(null);
  };

  const handleUtilityClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setUtilityAnchorEl(event.currentTarget);
  };
  const handleUtilityClose = () => {
    setUtilityAnchorEl(null);
  };

  const handleMoreClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setMoreAnchorEl(event.currentTarget);
  };
  const handleMoreClose = () => {
    setMoreAnchorEl(null);
  };

  return (
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
          {coreNewsLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Button
                key={link.path}
                component={Link}
                to={link.path}
                sx={{
                  color: "white",
                  fontWeight: isActive ? "bold" : "normal",
                  borderBottom: isActive ? "2px solid #c83a15" : "none",
                  borderRadius: 0,
                  textTransform: "none",
                  "&:hover": { color: "#ff8a65" },
                }}
              >
                {link.label}
              </Button>
            );
          })}

          {/* Explore Dropdown */}
          <Button
            aria-controls={exploreOpen ? "explore-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={exploreOpen ? "true" : undefined}
            onClick={handleExploreClick}
            endIcon={<KeyboardArrowDownIcon />}
            sx={{
              color: "white",
              fontWeight: exploreLinks.some(l => location.pathname === l.path) ? "bold" : "normal",
              borderBottom: exploreLinks.some(l => location.pathname === l.path) ? "2px solid #c83a15" : "none",
              borderRadius: 0,
              textTransform: "none",
              "&:hover": { color: "#ff8a65" },
            }}
          >
            Explore
          </Button>
          <Menu
            id="explore-menu"
            anchorEl={exploreAnchorEl}
            open={exploreOpen}
            onClose={handleExploreClose}
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
            {exploreLinks.map((link) => (
              <MenuItem
                key={link.path}
                component={Link}
                to={link.path}
                onClick={handleExploreClose}
                selected={location.pathname === link.path}
                sx={{
                  minWidth: 160,
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

          {/* Utilities Dropdown */}
          <Button
            aria-controls={utilityOpen ? "utility-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={utilityOpen ? "true" : undefined}
            onClick={handleUtilityClick}
            endIcon={<KeyboardArrowDownIcon />}
            sx={{
              color: "white",
              fontWeight: utilityLinks.some(l => location.pathname === l.path || (l.path === "/jobs" && location.pathname.startsWith("/jobs"))) ? "bold" : "normal",
              borderBottom: utilityLinks.some(l => location.pathname === l.path || (l.path === "/jobs" && location.pathname.startsWith("/jobs"))) ? "2px solid #c83a15" : "none",
              borderRadius: 0,
              textTransform: "none",
              "&:hover": { color: "#ff8a65" },
            }}
          >
            Utilities
          </Button>
          <Menu
            id="utility-menu"
            anchorEl={utilityAnchorEl}
            open={utilityOpen}
            onClose={handleUtilityClose}
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
            {utilityLinks.map((link) => (
              <MenuItem
                key={link.path}
                component={Link}
                to={link.path}
                onClick={handleUtilityClose}
                selected={location.pathname === link.path || (link.path === "/jobs" && location.pathname.startsWith("/jobs"))}
                sx={{
                  minWidth: 160,
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

          {/* More Categories Dropdown */}
          <Button
            aria-controls={moreOpen ? "more-news-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={moreOpen ? "true" : undefined}
            onClick={handleMoreClick}
            endIcon={<KeyboardArrowDownIcon />}
            sx={{
              color: "white",
              fontWeight: moreNewsLinks.some(l => location.pathname === l.path) ? "bold" : "normal",
              borderBottom: moreNewsLinks.some(l => location.pathname === l.path) ? "2px solid #c83a15" : "none",
              borderRadius: 0,
              textTransform: "none",
              "&:hover": { color: "#ff8a65" },
            }}
          >
            Categories
          </Button>
          <Menu
            id="more-news-menu"
            anchorEl={moreAnchorEl}
            open={moreOpen}
            onClose={handleMoreClose}
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
            {moreNewsLinks.map((link) => (
              <MenuItem
                key={link.path}
                component={Link}
                to={link.path}
                onClick={handleMoreClose}
                selected={location.pathname === link.path}
                sx={{
                  minWidth: 160,
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
          {!(location.pathname === "/games/dvcubie2026" && hideBadgesInGame) && (
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
          )}

          {/* Bookmarks button */}
          {!(location.pathname === "/games/dvcubie2026" && hideBadgesInGame) && (
            <Tooltip title="Bookmarks">
              <IconButton
                component={Link}
                to="/bookmarks"
                aria-label="Bookmarks"
                sx={{ color: location.pathname === "/bookmarks" ? "#ffb74d" : "white", ml: 1 }}
              >
                <Badge badgeContent={bookmarksCount} color="warning" max={99}>
                  <BookmarkIcon />
                </Badge>
              </IconButton>
            </Tooltip>
          )}

          {/* Admin Panel button */}
          <Tooltip title="Admin Dashboard">
            <IconButton
              id="header-admin-btn-desktop"
              component={Link}
              to="/admin"
              aria-label="Admin Dashboard"
              sx={{ color: location.pathname === "/admin" ? "#ffb74d" : "white", ml: 1 }}
            >
              <AdminPanelSettingsIcon />
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
          {!(location.pathname === "/games/dvcubie2026" && hideBadgesInGame) && (
            <>
              <IconButton component={Link} to="/comments" aria-label="Comments" sx={{ color: "white" }}>
                <Badge badgeContent={totalComments} color="primary" max={999}>
                  <ChatBubbleIcon />
                </Badge>
              </IconButton>
              <IconButton component={Link} to="/bookmarks" aria-label="Bookmarks" sx={{ color: "white" }}>
                <Badge badgeContent={bookmarksCount} color="warning" max={99}>
                  <BookmarkIcon />
                </Badge>
              </IconButton>
            </>
          )}
          <IconButton 
            id="header-admin-btn-mobile"
            component={Link} 
            to="/admin" 
            aria-label="Admin Dashboard" 
            sx={{ color: location.pathname === "/admin" ? "#ffb74d" : "white" }}
          >
            <AdminPanelSettingsIcon />
          </IconButton>
          <IconButton component={Link} to="/facebook-settings" aria-label="Facebook Settings" sx={{ color: location.pathname === "/facebook-settings" ? "#c83a15" : "white" }}>
            <FacebookIcon />
          </IconButton>
          <IconButton onClick={toggleMode} aria-label="Toggle theme" sx={{ color: "white" }}>
            {isDark ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
          <IconButton aria-label="Menu" sx={{ color: "white" }} edge="end" onClick={onDrawerOpen}>
            <MenuIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};
