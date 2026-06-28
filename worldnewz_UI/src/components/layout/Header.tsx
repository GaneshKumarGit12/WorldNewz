import React from "react";
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

import { primaryNavLinks, secondaryNavLinks } from "../../utils/navigationConfig";

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
  onMenuClick,
  onMenuClose,
  anchorEl,
  menuOpen,
  onDrawerOpen
}) => {
  const location = useLocation();

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
          {primaryNavLinks.filter((link) => !link.highlight).map((link) => {
            const isActive = location.pathname === link.path || (link.path === "/jobs" && location.pathname.startsWith("/jobs"));
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
            onClick={onMenuClick}
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
            onClose={onMenuClose}
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
                onClick={onMenuClose}
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

      {/* Centered responsive navigation buttons (Polls, GK Quiz, MoviesDB, Deals, Jobs) */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1.5,
          py: 1.5,
          px: 2,
          backgroundColor: isDark ? "#12161a" : "#050505",
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {primaryNavLinks.filter((link) => link.highlight).map((link) => {
          const isActive = location.pathname === link.path || (link.path === "/jobs" && location.pathname.startsWith("/jobs"));
          const buttonContent = (
            <Button
              key={link.path}
              component={Link}
              to={link.path}
              sx={{
                background: link.highlightColor || "linear-gradient(135deg, #00c6ff, #0072ff)",
                color: "white",
                fontWeight: "bold",
                borderRadius: "20px",
                px: 2.2,
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
              }}
            >
              {link.label}
            </Button>
          );

          if (link.badge) {
            return (
              <Badge
                key={link.path}
                badgeContent={link.badge}
                color="error"
                sx={{
                  "& .MuiBadge-badge": {
                    fontSize: "0.6rem",
                    fontWeight: "bold",
                    height: 14,
                    minWidth: 14,
                    top: 4,
                    right: 12,
                    px: 0.5,
                  },
                }}
              >
                {buttonContent}
              </Badge>
            );
          }
          return buttonContent;
        })}
      </Box>
    </AppBar>
  );
};
