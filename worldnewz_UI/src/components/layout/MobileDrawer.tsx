import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemText, 
  Collapse, 
  Divider, 
  Box, 
  Typography, 
  IconButton,
  Button
} from "@mui/material";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import CloseIcon from "@mui/icons-material/Close";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import ChatBubbleIcon from "@mui/icons-material/ChatBubble";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import HomeIcon from "@mui/icons-material/Home";

import { newsPillarLinks, lifestylePillarLinks, explorePillarLinks, playPillarLinks } from "../../utils/navigationConfig";

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  categoriesOpen?: boolean;
  onCategoriesToggle?: () => void;
  isDark: boolean;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  open,
  onClose,
  isDark
}) => {
  const location = useLocation();
  const [newsOpen, setNewsOpen] = useState(true);
  const [lifestyleOpen, setLifestyleOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [playOpen, setPlayOpen] = useState(false);

  const drawerBg = isDark ? "#111827" : "#ffffff";
  const drawerText = isDark ? "#f3f4f6" : "#0f172a";
  const dividerColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const inactiveLinkColor = isDark ? "rgba(243,244,246,0.85)" : "#334155";
  const hoverLinkColor = isDark ? "#ffffff" : "#0f172a";
  const brandRed = "var(--color-brand-accent, #c83a15)";

  const quickTiles = [
    { label: "Home", path: "/", icon: <HomeIcon sx={{ fontSize: 18 }} /> },
    { label: "Deals", path: "/amazon-products", icon: <ShoppingBagIcon sx={{ fontSize: 18, color: "#f59e0b" }} /> },
    { label: "Weather", path: "/weather", icon: <WbSunnyIcon sx={{ fontSize: 18, color: "#38bdf8" }} /> },
    { label: "Stocks", path: "/stocks", icon: <TrendingUpIcon sx={{ fontSize: 18, color: "#10b981" }} /> },
    { label: "Bookmarks", path: "/bookmarks", icon: <BookmarkIcon sx={{ fontSize: 18, color: "#eab308" }} /> },
    { label: "Comments", path: "/comments", icon: <ChatBubbleIcon sx={{ fontSize: 18, color: brandRed }} /> },
    { label: "NewsBot", path: "/chatbot", icon: <SmartToyIcon sx={{ fontSize: 18, color: "#8b5cf6" }} /> },
    { label: "Admin", path: "/admin", icon: <AdminPanelSettingsIcon sx={{ fontSize: 18 }} /> },
  ];

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          backgroundColor: drawerBg,
          color: drawerText,
          width: { xs: 290, sm: 320 },
          boxShadow: isDark ? "-4px 0 24px rgba(0,0,0,0.7)" : "-4px 0 24px rgba(0,0,0,0.12)",
        }
      }}
    >
      {/* Drawer Header with Brand & Close Button */}
      <Box 
        sx={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between", 
          p: 2, 
          borderBottom: `1px solid ${dividerColor}` 
        }}
      >
        <Box component={Link} to="/" onClick={onClose} sx={{ textDecoration: "none", display: "flex", alignItems: "baseline", gap: 0.5 }}>
          <Typography
            sx={{
              fontFamily: "var(--font-serif-headline, Georgia, serif)",
              fontWeight: 700,
              fontSize: "20px",
              color: drawerText,
              letterSpacing: "-0.01em",
              textTransform: "uppercase",
            }}
          >
            WorldNew<Typography component="span" sx={{ color: brandRed, fontFamily: "inherit", fontWeight: 700, fontSize: "inherit" }}>z</Typography>s
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} aria-label="Close navigation menu" sx={{ color: drawerText }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Quick Action Tiles Grid for Mobile Ergonomics */}
      <Box sx={{ p: 1.5, borderBottom: `1px solid ${dividerColor}` }}>
        <Typography 
          sx={{ 
            fontSize: "10.5px", 
            fontWeight: 700, 
            letterSpacing: "0.08em", 
            textTransform: "uppercase", 
            color: isDark ? "rgba(255,255,255,0.5)" : "#64748b",
            mb: 1, 
            px: 0.5 
          }}
        >
          Quick Shortcuts
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1 }}>
          {quickTiles.map((tile) => {
            const isActive = location.pathname === tile.path;
            return (
              <Button
                key={tile.path}
                component={Link}
                to={tile.path}
                onClick={onClose}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  py: 1,
                  px: 0.5,
                  minWidth: 0,
                  borderRadius: "6px",
                  textTransform: "none",
                  backgroundColor: isActive ? (isDark ? "rgba(200,58,21,0.2)" : "rgba(200,58,21,0.08)") : (isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)"),
                  border: isActive ? `1px solid ${brandRed}` : `1px solid ${dividerColor}`,
                  color: isActive ? brandRed : drawerText,
                  "&:hover": {
                    backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                  }
                }}
              >
                {tile.icon}
                <Typography sx={{ fontSize: "10px", fontWeight: isActive ? 700 : 500, mt: 0.4, textAlign: "center" }}>
                  {tile.label}
                </Typography>
              </Button>
            );
          })}
        </Box>
      </Box>

      {/* Main Navigation Pillars */}
      <List sx={{ width: "100%", px: 1, py: 1 }}>
        {/* Pillar 1: News */}
        <ListItem disablePadding>
          <ListItemButton onClick={() => setNewsOpen(!newsOpen)} sx={{ color: brandRed, fontWeight: "bold", borderRadius: "6px" }}>
            <ListItemText primary="📰 News Pillar" primaryTypographyProps={{ sx: { fontWeight: "700", fontSize: "0.92rem" } }} />
            {newsOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={newsOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding sx={{ pl: 1 }}>
            {newsPillarLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <ListItem key={link.path} disablePadding>
                  <ListItemButton
                    component={Link}
                    to={link.path}
                    onClick={onClose}
                    sx={{
                      borderRadius: "6px",
                      py: 0.6,
                      fontWeight: isActive ? "bold" : "normal",
                      color: isActive ? brandRed : inactiveLinkColor,
                      backgroundColor: isActive ? (isDark ? "rgba(200,58,21,0.12)" : "rgba(200,58,21,0.06)") : "transparent",
                      "&:hover": { color: hoverLinkColor, backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" },
                    }}
                  >
                    <ListItemText primary={link.label} primaryTypographyProps={{ sx: { fontSize: "0.88rem" } }} />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Collapse>

        <Divider sx={{ borderColor: dividerColor, my: 1 }} />

        {/* Pillar 2: Lifestyle */}
        <ListItem disablePadding>
          <ListItemButton onClick={() => setLifestyleOpen(!lifestyleOpen)} sx={{ borderRadius: "6px" }}>
            <ListItemText primary="🌿 Lifestyle & Culture" primaryTypographyProps={{ sx: { fontWeight: "700", fontSize: "0.92rem", color: drawerText } }} />
            {lifestyleOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={lifestyleOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding sx={{ pl: 1 }}>
            {lifestylePillarLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <ListItem key={link.path} disablePadding>
                  <ListItemButton
                    component={Link}
                    to={link.path}
                    onClick={onClose}
                    sx={{
                      borderRadius: "6px",
                      py: 0.6,
                      fontWeight: isActive ? "bold" : "normal",
                      color: isActive ? brandRed : inactiveLinkColor,
                      backgroundColor: isActive ? (isDark ? "rgba(200,58,21,0.12)" : "rgba(200,58,21,0.06)") : "transparent",
                      "&:hover": { color: hoverLinkColor, backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" },
                    }}
                  >
                    <ListItemText primary={link.label} primaryTypographyProps={{ sx: { fontSize: "0.88rem" } }} />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Collapse>

        <Divider sx={{ borderColor: dividerColor, my: 1 }} />

        {/* Pillar 3: Explore / Extras */}
        <ListItem disablePadding>
          <ListItemButton onClick={() => setExploreOpen(!exploreOpen)} sx={{ borderRadius: "6px" }}>
            <ListItemText primary="🚀 Explore & Utilities" primaryTypographyProps={{ sx: { fontWeight: "700", fontSize: "0.92rem", color: drawerText } }} />
            {exploreOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={exploreOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding sx={{ pl: 1 }}>
            {explorePillarLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <ListItem key={link.path} disablePadding>
                  <ListItemButton
                    component={Link}
                    to={link.path}
                    onClick={onClose}
                    sx={{
                      borderRadius: "6px",
                      py: 0.6,
                      fontWeight: isActive ? "bold" : "normal",
                      color: isActive ? brandRed : inactiveLinkColor,
                      backgroundColor: isActive ? (isDark ? "rgba(200,58,21,0.12)" : "rgba(200,58,21,0.06)") : "transparent",
                      "&:hover": { color: hoverLinkColor, backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" },
                    }}
                  >
                    <ListItemText primary={link.label} primaryTypographyProps={{ sx: { fontSize: "0.88rem" } }} />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Collapse>

        <Divider sx={{ borderColor: dividerColor, my: 1 }} />

        {/* Pillar 4: Play */}
        <ListItem disablePadding>
          <ListItemButton onClick={() => setPlayOpen(!playOpen)} sx={{ borderRadius: "6px" }}>
            <ListItemText primary="🎮 Play & Interactive" primaryTypographyProps={{ sx: { fontWeight: "700", fontSize: "0.92rem", color: drawerText } }} />
            {playOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={playOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding sx={{ pl: 1 }}>
            {playPillarLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <ListItem key={link.path} disablePadding>
                  <ListItemButton
                    component={Link}
                    to={link.path}
                    onClick={onClose}
                    sx={{
                      borderRadius: "6px",
                      py: 0.6,
                      fontWeight: isActive ? "bold" : "normal",
                      color: isActive ? brandRed : inactiveLinkColor,
                      backgroundColor: isActive ? (isDark ? "rgba(200,58,21,0.12)" : "rgba(200,58,21,0.06)") : "transparent",
                      "&:hover": { color: hoverLinkColor, backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" },
                    }}
                  >
                    <ListItemText primary={link.label} primaryTypographyProps={{ sx: { fontSize: "0.88rem" } }} />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Collapse>

        <Divider sx={{ borderColor: dividerColor, my: 1 }} />

        {/* Legal & Editorial Links */}
        {[
          { label: "Facebook Settings", path: "/facebook-settings" },
          { label: "Editorial Briefings", path: "/editorial-briefings" },
          { label: "About WorldNewzs", path: "/about" },
          { label: "Contact Us", path: "/contact" },
          { label: "Privacy Policy", path: "/privacy-policy" },
          { label: "Terms of Service", path: "/terms" },
        ].map((link) => (
          <ListItem key={link.path} disablePadding>
            <ListItemButton
              component={Link}
              to={link.path}
              onClick={onClose}
              sx={{
                borderRadius: "6px",
                py: 0.5,
                fontWeight: location.pathname === link.path ? "bold" : "normal",
                color: location.pathname === link.path ? brandRed : (isDark ? "rgba(255,255,255,0.6)" : "#64748b"),
                "&:hover": { color: hoverLinkColor },
              }}
            >
              <ListItemText primary={link.label} primaryTypographyProps={{ sx: { fontSize: "0.84rem" } }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};
export default MobileDrawer;
